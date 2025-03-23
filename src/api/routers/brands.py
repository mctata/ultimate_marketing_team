from fastapi import APIRouter, HTTPException, Depends, status, Query, Path, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, Field, HttpUrl, conint
from datetime import datetime, date
import json
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import re
import asyncio
import logging

from src.api.routers.auth import oauth2_scheme, get_current_user
from src.core.messaging import RabbitMQClient
from src.core.database import get_db
from src.models.project import Brand, Project, ProjectType

router = APIRouter()
mq_client = RabbitMQClient()

# Pydantic Models
class BrandBase(BaseModel):
    name: str
    website_url: Optional[HttpUrl] = None
    description: Optional[str] = None
    
class WebsiteAnalysisRequest(BaseModel):
    url: HttpUrl
    
class WebsiteColorPalette(BaseModel):
    primary: str
    secondary: str
    accent: Optional[str] = None
    
class WebsiteFonts(BaseModel):
    primary: str
    secondary: Optional[str] = None
    
class WebsiteContactInfo(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    
class SocialMediaAccount(BaseModel):
    platform: str
    url: str
    
class PostingSchedule(BaseModel):
    frequency: str
    bestTimes: List[str]

class WebsiteAnalysisResult(BaseModel):
    name: str
    description: str
    logo: Optional[str] = None
    industry: str
    website: str
    colors: WebsiteColorPalette
    fonts: WebsiteFonts
    contentTone: str
    products: List[str]
    contactInfo: WebsiteContactInfo
    socialMedia: List[SocialMediaAccount]
    topics: List[str]
    contentTypes: List[str]
    schedule: PostingSchedule
    targetAudience: List[str]
    hashtags: List[str]
    marketingGoals: List[str]

class BrandCreate(BrandBase):
    logo_url: Optional[HttpUrl] = None
    guidelines: Optional[Dict[str, Any]] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    website_url: Optional[HttpUrl] = None
    description: Optional[str] = None
    logo_url: Optional[HttpUrl] = None

class BrandGuidelines(BaseModel):
    voice: Optional[str] = None
    tone: Optional[str] = None
    color_palette: Optional[List[str]] = None
    typography: Optional[Dict[str, Any]] = None
    imagery_style: Optional[str] = None
    target_audience: Optional[Dict[str, Any]] = None

class Brand(BaseModel):
    id: int
    name: str
    website_url: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class BrandDetail(Brand):
    guidelines: Optional[Dict[str, Any]] = None

class ProjectTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectType(ProjectTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_type_id: int
    due_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    brand_id: int

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_type_id: Optional[int] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class Project(ProjectBase):
    id: int
    brand_id: int
    status: str
    created_by: Optional[int] = None
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    project_type_name: Optional[str] = None

    class Config:
        orm_mode = True

# Agent communication function
async def send_agent_task(task_type: str, task_data: Dict[str, Any], wait_for_response: bool = True) -> Dict[str, Any]:
    """Send a task to the Brand & Project Management Agent."""
    try:
        # Prepare task message
        task = {
            "task_type": task_type,
            **task_data
        }
        
        if wait_for_response:
            # Generate unique response queue
            import uuid
            response_queue = f"response_api_{uuid.uuid4()}"
            mq_client.declare_queue(response_queue)
            task["response_queue"] = response_queue
            
            # Send task
            mq_client.publish_direct("brand_project_agent_queue", task)
            
            # Wait for response
            import asyncio
            from concurrent.futures import ThreadPoolExecutor
            
            # Create a future to store the result
            loop = asyncio.get_event_loop()
            result_future = loop.create_future()
            
            def consume_response():
                # This function runs in a separate thread
                result = None
                try:
                    # Consume one message from the response queue
                    def callback(message):
                        nonlocal result
                        result = message
                        return False  # Stop consuming after first message
                    
                    mq_client.consume_one(response_queue, callback, timeout=30)
                except Exception as e:
                    result = {"status": "error", "error": f"Error receiving response: {str(e)}"}
                
                # Set the result in the future
                loop.call_soon_threadsafe(result_future.set_result, result)
            
            # Run the consumption in a thread pool
            with ThreadPoolExecutor() as executor:
                executor.submit(consume_response)
            
            # Wait for the result
            result = await result_future
            
            # Delete the response queue
            mq_client.delete_queue(response_queue)
            
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Timeout waiting for agent response"
                )
            
            return result
        else:
            # Send task without waiting for response
            mq_client.publish_direct("brand_project_agent_queue", task)
            return {"status": "sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error communicating with agent: {str(e)}"
        )

# Website analysis helpers
async def extract_website_colors(html_content: str, url: str) -> WebsiteColorPalette:
    """Extract primary and secondary colors from website."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Extract CSS styles and inline styles
        colors = []
        
        # Check stylesheets
        style_tags = soup.find_all('style')
        for style in style_tags:
            if style.string:
                # Extract hex and rgb colors
                hex_colors = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}', style.string)
                rgb_colors = re.findall(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', style.string)
                colors.extend(hex_colors)
                colors.extend([f'rgb({r},{g},{b})' for r, g, b in rgb_colors])
        
        # Add colors from inline styles
        for tag in soup.find_all(style=True):
            style = tag['style']
            if 'color' in style or 'background' in style:
                hex_colors = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}', style)
                rgb_colors = re.findall(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', style)
                colors.extend(hex_colors)
                colors.extend([f'rgb({r},{g},{b})' for r, g, b in rgb_colors])
        
        # Count frequency
        from collections import Counter
        color_counter = Counter(colors)
        
        most_common = color_counter.most_common(3)
        
        # Default colors if none found
        primary = '#3498db'    # Blue
        secondary = '#2ecc71'  # Green
        accent = '#e74c3c'     # Red
        
        if most_common and len(most_common) > 0:
            primary = most_common[0][0]
            if len(most_common) > 1:
                secondary = most_common[1][0]
            if len(most_common) > 2:
                accent = most_common[2][0]
        
        return WebsiteColorPalette(
            primary=primary,
            secondary=secondary,
            accent=accent
        )
    except Exception as e:
        logging.error(f"Error extracting colors: {str(e)}")
        # Return default colors
        return WebsiteColorPalette(
            primary='#3498db',
            secondary='#2ecc71',
            accent='#e74c3c'
        )

async def extract_website_fonts(html_content: str) -> WebsiteFonts:
    """Extract font families from website."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        fonts = set()
        
        # Extract from style tags
        for style in soup.find_all('style'):
            if style.string:
                font_families = re.findall(r'font-family:\s*([^;}]+)', style.string)
                for family in font_families:
                    # Clean up and extract primary font name
                    cleaned = family.split(',')[0].strip().strip("'").strip('"')
                    if cleaned and cleaned.lower() not in ('inherit', 'initial'):
                        fonts.add(cleaned)
        
        # Extract from inline styles
        for tag in soup.find_all(style=True):
            if 'font-family' in tag['style']:
                font_families = re.findall(r'font-family:\s*([^;}]+)', tag['style'])
                for family in font_families:
                    cleaned = family.split(',')[0].strip().strip("'").strip('"')
                    if cleaned and cleaned.lower() not in ('inherit', 'initial'):
                        fonts.add(cleaned)
        
        # Convert to list and get primary/secondary
        font_list = list(fonts)
        primary_font = 'Roboto'  # Default
        secondary_font = None
        
        if font_list:
            primary_font = font_list[0]
            if len(font_list) > 1:
                secondary_font = font_list[1]
        
        return WebsiteFonts(
            primary=primary_font,
            secondary=secondary_font
        )
    except Exception as e:
        logging.error(f"Error extracting fonts: {str(e)}")
        return WebsiteFonts(
            primary='Roboto'
        )

async def extract_social_media(html_content: str) -> List[SocialMediaAccount]:
    """Extract social media accounts from website."""
    social_patterns = {
        'Facebook': [r'facebook\.com/([^/"\']+)', r'fb\.com/([^/"\']+)'],
        'Twitter': [r'twitter\.com/([^/"\']+)', r'x\.com/([^/"\']+)'],
        'Instagram': [r'instagram\.com/([^/"\']+)'],
        'LinkedIn': [r'linkedin\.com/company/([^/"\']+)', r'linkedin\.com/in/([^/"\']+)'],
        'YouTube': [r'youtube\.com/channel/([^/"\']+)', r'youtube\.com/user/([^/"\']+)'],
        'Pinterest': [r'pinterest\.com/([^/"\']+)'],
        'TikTok': [r'tiktok\.com/@([^/"\']+)']
    }
    
    social_accounts = []
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link['href']
            for platform, patterns in social_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, href)
                    if match:
                        username = match.group(1)
                        social_accounts.append(SocialMediaAccount(
                            platform=platform,
                            url=href
                        ))
                        break
        
        # Remove duplicates
        unique_accounts = {}
        for account in social_accounts:
            if account.platform not in unique_accounts:
                unique_accounts[account.platform] = account
        
        return list(unique_accounts.values())
    except Exception as e:
        logging.error(f"Error extracting social media: {str(e)}")
        return []

async def extract_contact_info(html_content: str) -> WebsiteContactInfo:
    """Extract contact information from website."""
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_pattern = r'(?:\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'
    
    try:
        # Find emails
        emails = re.findall(email_pattern, html_content)
        email = emails[0] if emails else None
        
        # Find phone numbers
        phones = re.findall(phone_pattern, html_content)
        phone = phones[0] if phones else None
        
        # Address would need more complex extraction, omitted for simplicity
        
        return WebsiteContactInfo(
            email=email,
            phone=phone
        )
    except Exception as e:
        logging.error(f"Error extracting contact info: {str(e)}")
        return WebsiteContactInfo()

async def extract_website_metadata(html_content: str, url: str) -> tuple:
    """Extract website name, description, and other metadata."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Company name from title or OG data
        name = None
        title_tag = soup.find('title')
        if title_tag and title_tag.string:
            name = title_tag.string.strip()
        
        if not name:
            og_title = soup.find('meta', property='og:title')
            if og_title and og_title.get('content'):
                name = og_title['content']
        
        if not name:
            # Extract from domain
            domain = urlparse(url).netloc
            domain = domain.replace('www.', '')
            parts = domain.split('.')
            name = parts[0].capitalize()
        
        # Description
        description = None
        meta_desc = soup.find('meta', attrs={'name': 'description'})
        if meta_desc and meta_desc.get('content'):
            description = meta_desc['content']
        
        if not description:
            og_desc = soup.find('meta', property='og:description')
            if og_desc and og_desc.get('content'):
                description = og_desc['content']
        
        # Logo
        logo = None
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            logo = og_image['content']
        
        if not logo:
            # Look for common logo patterns in header
            header = soup.find('header')
            if header:
                img = header.find('img')
                if img and img.get('src'):
                    logo = img['src']
            
            # Check for a common logo element
            if not logo:
                for img in soup.find_all('img'):
                    src = img.get('src', '')
                    alt = img.get('alt', '').lower()
                    img_class = img.get('class', [])
                    img_id = img.get('id', '')
                    
                    # Check if it looks like a logo
                    logo_indicators = ['logo', 'brand', 'company', 'site-icon']
                    for indicator in logo_indicators:
                        if (indicator in str(img_class) or 
                            indicator in img_id.lower() or 
                            indicator in alt or 
                            indicator in src.lower()):
                            logo = img['src']
                            break
                    
                    if logo:
                        break
        
        # Make sure logo URL is absolute
        if logo and not logo.startswith(('http://', 'https://')):
            base_url = '{uri.scheme}://{uri.netloc}'.format(uri=urlparse(url))
            logo = f"{base_url}/{logo.lstrip('/')}"
        
        return name, description, logo
    except Exception as e:
        logging.error(f"Error extracting metadata: {str(e)}")
        domain = urlparse(url).netloc
        name = domain.replace('www.', '').split('.')[0].capitalize()
        return name, f"{name} is a modern company with an online presence.", None

async def determine_website_industry(html_content: str) -> str:
    """Determine the industry of the website."""
    industry_keywords = {
        'Technology': ['software', 'tech', 'app', 'digital', 'computer', 'IT', 'SaaS', 'cloud', 'data'],
        'E-commerce': ['shop', 'store', 'buy', 'cart', 'purchase', 'order', 'shipping', 'delivery', 'product'],
        'Finance': ['bank', 'finance', 'invest', 'money', 'capital', 'wealth', 'insurance', 'loan', 'mortgage'],
        'Healthcare': ['health', 'medical', 'doctor', 'patient', 'hospital', 'clinic', 'therapy', 'wellness'],
        'Education': ['school', 'learning', 'education', 'course', 'student', 'teacher', 'class', 'degree', 'academy'],
        'Marketing': ['marketing', 'agency', 'brand', 'campaign', 'advertis', 'promotion', 'media', 'creative'],
        'Travel': ['travel', 'hotel', 'flight', 'vacation', 'booking', 'destination', 'tour', 'trip'],
        'Food & Beverage': ['food', 'restaurant', 'recipe', 'menu', 'drink', 'kitchen', 'chef', 'cuisine'],
        'Real Estate': ['property', 'real estate', 'home', 'house', 'apartment', 'rent', 'listing', 'realty'],
        'Entertainment': ['entertainment', 'music', 'movie', 'film', 'game', 'play', 'stream', 'watch', 'listen'],
        'Sustainability': ['eco', 'green', 'environment', 'sustainable', 'recycle', 'renewable', 'organic']
    }
    
    try:
        # Lowercase content for easier matching
        text = html_content.lower()
        
        # Count keyword matches for each industry
        counts = {}
        for industry, keywords in industry_keywords.items():
            count = sum(1 for keyword in keywords if keyword.lower() in text)
            counts[industry] = count
        
        # Get the industry with the most matches
        if counts:
            max_industry = max(counts.items(), key=lambda x: x[1])
            if max_industry[1] > 0:
                return max_industry[0]
        
        # Default if no matches
        return 'Technology'
    except Exception as e:
        logging.error(f"Error determining industry: {str(e)}")
        return 'Technology'

async def fetch_website(url: str) -> str:
    """Fetch website content with timeout and error handling."""
    try:
        # Validate URL format
        parsed_url = urlparse(url)
        if not all([parsed_url.scheme, parsed_url.netloc]):
            raise ValueError("Invalid URL format")
        
        # Set user agent to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Make the request with timeout
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise exception for 4XX/5XX errors
        
        # Return the HTML content
        return response.text
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching website {url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to access website: {str(e)}"
        )
    except Exception as e:
        logging.error(f"Unexpected error fetching website {url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing website: {str(e)}"
        )

# Website Analysis Endpoint
@router.post("/analyze-website", response_model=WebsiteAnalysisResult)
async def analyze_website(request: WebsiteAnalysisRequest, current_user = Depends(get_current_user)):
    """Analyze a website URL to extract brand information"""
    try:
        url = str(request.url)
        
        # Fetch the website content
        html_content = await fetch_website(url)
        
        # Extract information in parallel
        name, description, logo = await extract_website_metadata(html_content, url)
        industry = await determine_website_industry(html_content)
        colors = await extract_website_colors(html_content, url)
        fonts = await extract_website_fonts(html_content)
        contact_info = await extract_contact_info(html_content)
        social_media = await extract_social_media(html_content)
        
        # Generate content strategy recommendations based on industry
        if industry == 'Technology':
            content_types = ['Blog Posts', 'Case Studies', 'Whitepapers', 'Video Tutorials']
            topics = ['Product Updates', 'Industry Trends', 'Technical Guides', 'Success Stories']
            audience = ['IT Professionals', 'Developers', 'Business Decision Makers', 'Tech Enthusiasts']
            hashtags = ['#Tech', '#Innovation', '#DigitalTransformation', '#SoftwareDev']
            goals = ['Increase Brand Awareness', 'Generate Qualified Leads', 'Establish Thought Leadership']
        elif industry == 'E-commerce':
            content_types = ['Product Descriptions', 'Customer Reviews', 'Shopping Guides', 'Sales Announcements']
            topics = ['Product Showcases', 'Buying Guides', 'Seasonal Collections', 'Customer Stories']
            audience = ['Online Shoppers', 'Deal Seekers', 'Fashion Enthusiasts', 'Homeowners']
            hashtags = ['#ShopNow', '#Sale', '#NewArrival', '#MustHave']
            goals = ['Increase Online Sales', 'Improve Customer Retention', 'Build Social Media Following']
        else:
            # Default content strategy
            content_types = ['Blog Posts', 'Social Media Content', 'Email Newsletters', 'Infographics']
            topics = ['Industry Insights', 'Company News', 'How-to Guides', 'Customer Spotlights']
            audience = ['Industry Professionals', 'Decision Makers', 'Current Customers', 'Potential Clients']
            hashtags = ['#' + name.replace(' ', ''), '#' + industry.replace(' & ', '').replace(' ', ''), '#BestPractices', '#Innovation']
            goals = ['Increase Brand Awareness', 'Generate Leads', 'Improve Customer Engagement', 'Boost Website Traffic']
        
        # Generate realistic posting schedule
        schedule = PostingSchedule(
            frequency="Weekly",
            bestTimes=["Tuesday 10:00 AM", "Thursday 2:00 PM"]
        )
        
        # Create response object
        return WebsiteAnalysisResult(
            name=name,
            description=description,
            logo=logo,
            industry=industry,
            website=url,
            colors=colors,
            fonts=fonts,
            contentTone="Professional" if industry in ['Technology', 'Finance', 'Healthcare'] else "Friendly",
            products=['Product or Service 1', 'Product or Service 2'],  # Would need more specific extraction
            contactInfo=contact_info,
            socialMedia=social_media,
            topics=topics,
            contentTypes=content_types,
            schedule=schedule,
            targetAudience=audience,
            hashtags=hashtags,
            marketingGoals=goals
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error analyzing website: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze website: {str(e)}"
        )

# Brand Endpoints
@router.post("/", response_model=BrandDetail, status_code=status.HTTP_201_CREATED)
async def create_brand(brand: BrandCreate, current_user = Depends(get_current_user)):
    """Create a new brand."""
    
    # Normalize and validate website URL
    website_url = None
    if brand.website_url:
        website_url = str(brand.website_url)
        parsed_url = urlparse(website_url)
        if not parsed_url.scheme:
            website_url = f"https://{website_url}"
    
    # Prepare task data
    task_data = {
        "company_name": brand.name,
        "website_url": website_url,
        "brand_guidelines": brand.guidelines or {},
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("onboard_brand", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create brand")
        )
    
    # Return brand data
    brand_data = result.get("brand_data", {})
    brand_id = result.get("brand_id")
    
    return {
        "id": brand_id,
        "name": brand_data.get("name"),
        "website_url": brand_data.get("website_url"),
        "description": brand_data.get("description"),
        "logo_url": brand_data.get("logo_url"),
        "guidelines": brand_data.get("brand_guidelines"),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

@router.get("/", response_model=List[Brand])
async def get_brands(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """Get all brands for the current user."""
    try:
        with get_db() as db:
            brands = db.query(Brand).offset(skip).limit(limit).all()
            return brands
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve brands: {str(e)}"
        )

@router.get("/{brand_id}", response_model=BrandDetail)
async def get_brand(brand_id: int = Path(...), current_user = Depends(get_current_user)):
    """Get a specific brand by ID."""
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "include_guidelines": True,
        "include_projects": False,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("get_brand_info", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"Brand with ID {brand_id} not found")
        )
    
    # Return brand data
    return result.get("brand")

@router.put("/{brand_id}", response_model=Brand)
async def update_brand(
    updates: BrandUpdate,
    brand_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Update a specific brand."""
    
    # Prepare update dictionary (only include non-None fields)
    update_dict = {}
    if updates.name is not None:
        update_dict["name"] = updates.name
    if updates.website_url is not None:
        update_dict["website_url"] = str(updates.website_url)
    if updates.description is not None:
        update_dict["description"] = updates.description
    if updates.logo_url is not None:
        update_dict["logo_url"] = str(updates.logo_url)
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "updates": update_dict,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("update_brand", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to update brand with ID {brand_id}")
        )
    
    # Return updated brand data
    return result.get("brand_data")

@router.put("/{brand_id}/guidelines", response_model=Dict[str, Any])
async def update_brand_guidelines(
    guidelines: Dict[str, Any],
    brand_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Update guidelines for a specific brand."""
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "updates": {"guidelines": guidelines},
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("update_brand", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to update brand guidelines for brand with ID {brand_id}")
        )
    
    # Return updated guidelines
    return guidelines

# Project Types Endpoints
@router.get("/project-types", response_model=List[ProjectType])
async def get_project_types(current_user = Depends(get_current_user)):
    """Get all available project types."""
    
    # Prepare task data
    task_data = {
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("get_project_types", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to retrieve project types")
        )
    
    # Return project types
    return result.get("project_types", [])

@router.post("/project-types", response_model=ProjectType, status_code=status.HTTP_201_CREATED)
async def create_project_type(
    project_type: ProjectTypeBase,
    current_user = Depends(get_current_user)
):
    """Create a new project type."""
    
    # Prepare task data
    task_data = {
        "name": project_type.name,
        "description": project_type.description,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("create_project_type", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create project type")
        )
    
    # Return created project type
    return result.get("project_type")

# Project Endpoints
@router.post("/{brand_id}/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    brand_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Create a new project for a brand."""
    
    # Ensure brand_id in path matches brand_id in body
    if project.brand_id != brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand ID in path does not match brand ID in request body"
        )
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "project_type_id": project.project_type_id,
        "name": project.name,
        "description": project.description,
        "user_id": current_user.id,
        "due_date": project.due_date.isoformat() if project.due_date else None
    }
    
    # Send task to agent
    result = await send_agent_task("create_project", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", "Failed to create project")
        )
    
    # Return created project
    project_data = result.get("project_data", {})
    
    return {
        "id": result.get("project_id"),
        "name": project_data.get("name"),
        "description": project_data.get("description"),
        "brand_id": project_data.get("brand_id"),
        "project_type_id": project_data.get("project_type_id"),
        "project_type_name": project_data.get("project_type_name"),
        "status": project_data.get("status"),
        "created_by": project_data.get("created_by"),
        "assigned_to": project_data.get("assigned_to"),
        "due_date": project_data.get("due_date"),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

@router.get("/{brand_id}/projects", response_model=List[Project])
async def get_brand_projects(
    brand_id: int = Path(...),
    status: Optional[str] = Query(None),
    project_type_id: Optional[int] = Query(None),
    current_user = Depends(get_current_user)
):
    """Get all projects for a brand with optional filters."""
    
    # Prepare task data
    task_data = {
        "brand_id": brand_id,
        "user_id": current_user.id
    }
    
    # Add optional filters
    if status:
        task_data["status"] = status
    if project_type_id:
        task_data["project_type_id"] = project_type_id
    
    # Send task to agent
    result = await send_agent_task("get_brand_projects", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"Failed to retrieve projects for brand with ID {brand_id}")
        )
    
    # Return projects
    projects = result.get("projects", [])
    
    # Add datetime objects for created_at and updated_at
    now = datetime.now()
    for project in projects:
        project["created_at"] = now
        project["updated_at"] = now
    
    return projects

@router.get("/{brand_id}/projects/{project_id}", response_model=Project)
async def get_project(
    brand_id: int = Path(...),
    project_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Get a specific project for a brand."""
    
    # Prepare task data
    task_data = {
        "project_id": project_id,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("get_project_info", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"Project with ID {project_id} not found")
        )
    
    # Return project
    project = result.get("project", {})
    
    # Verify project belongs to the specified brand
    if project.get("brand_id") != brand_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with ID {project_id} does not belong to brand with ID {brand_id}"
        )
    
    return project

@router.put("/{brand_id}/projects/{project_id}", response_model=Project)
async def update_project(
    updates: ProjectUpdate,
    brand_id: int = Path(...),
    project_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Update a specific project for a brand."""
    
    # Prepare update dictionary (only include non-None fields)
    update_dict = {}
    if updates.name is not None:
        update_dict["name"] = updates.name
    if updates.description is not None:
        update_dict["description"] = updates.description
    if updates.project_type_id is not None:
        update_dict["project_type_id"] = updates.project_type_id
    if updates.status is not None:
        update_dict["status"] = updates.status
    if updates.due_date is not None:
        update_dict["due_date"] = updates.due_date.isoformat()
    
    # Prepare task data
    task_data = {
        "project_id": project_id,
        "updates": update_dict,
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("update_project", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to update project with ID {project_id}")
        )
    
    # Get updated project
    project_data = result.get("project_data", {})
    
    # Verify project belongs to the specified brand
    if project_data.get("brand_id") != brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project with ID {project_id} does not belong to brand with ID {brand_id}"
        )
    
    return project_data

@router.post("/{brand_id}/projects/{project_id}/assign", response_model=Dict[str, Any])
async def assign_project(
    assign_data: Dict[str, Any],
    brand_id: int = Path(...),
    project_id: int = Path(...),
    current_user = Depends(get_current_user)
):
    """Assign a project to a user."""
    
    # Validate assigned_to is provided
    if "assigned_to" not in assign_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="assigned_to field is required"
        )
    
    # Prepare task data
    task_data = {
        "project_id": project_id,
        "assigned_to": assign_data["assigned_to"],
        "user_id": current_user.id
    }
    
    # Send task to agent
    result = await send_agent_task("assign_project", task_data)
    
    if result.get("status") != "success":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result.get("error", f"Failed to assign project with ID {project_id}")
        )
    
    return {
        "project_id": result.get("project_id"),
        "assigned_to": result.get("assigned_to"),
        "message": result.get("message")
    }
