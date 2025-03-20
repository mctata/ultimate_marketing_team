from typing import Dict, Any, List, Optional
from loguru import logger
import json
import time
import random
import os
from datetime import datetime, timedelta
import openai

from src.agents.base_agent import BaseAgent

class ContentCreationTestingAgent(BaseAgent):
    """Agent responsible for content creation and testing.
    
    This agent generates multiple content variants using AI technologies,
    implements A/B testing frameworks to evaluate performance, and 
    continuously improves content based on testing results. It ensures
    all content adheres to brand guidelines.
    """
    
    def __init__(self, agent_id: str, name: str, **kwargs):
        super().__init__(agent_id, name)
        self.enable_ai_content_generation = kwargs.get("enable_ai_content_generation", True)
        self.enable_ab_testing = kwargs.get("enable_ab_testing", True)
        self.enable_audit_trails = kwargs.get("enable_audit_trails", True)
        # Default content variation count for A/B testing
        self.default_variation_count = kwargs.get("default_variation_count", 3)
        
        # OpenAI API configuration (to be used in content generation)
        self.openai_model = kwargs.get("openai_model", "gpt-4-turbo")
        self.openai_api_key = kwargs.get("openai_api_key", os.getenv("OPENAI_API_KEY"))
        self.max_tokens = kwargs.get("max_tokens", 4000)
        self.temperature = kwargs.get("temperature", 0.7)
        
        # Initialize the OpenAI client if API key is available
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
            self.openai_client = openai.OpenAI(api_key=self.openai_api_key)
            logger.info(f"OpenAI client initialized with model: {self.openai_model}")
        else:
            logger.warning("OpenAI API key not found. AI content generation will be simulated.")
            self.openai_client = None
            
        # Cache key prefix for storing content variations
        self.content_variations_cache_prefix = "content_variations"
        # Cache key prefix for storing test results
        self.test_results_cache_prefix = "test_results"
    
    def _initialize(self):
        super()._initialize()
        
        # Register task handlers
        self.register_task_handler("ai_content_generation_task", self.handle_ai_content_generation)
        self.register_task_handler("content_testing_task", self.handle_content_testing)
        
        # Register event handlers
        self.register_event_handler("content_performance_update", self._handle_content_performance_update)
    
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a generic task assigned to this agent."""
        task_type = task.get("task_type")
        logger.warning(f"Using generic task processing for task type: {task_type}")
        
        # Return error for unhandled task types
        return {
            "status": "error",
            "error": f"Unhandled task type: {task_type}"
        }
    
    def handle_ai_content_generation(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle AI-powered content generation."""
        brand_id = task.get("brand_id")
        project_id = task.get("project_id")
        project_type = task.get("project_type")
        content_topic = task.get("content_topic")
        content_brief = task.get("content_brief", {})
        brand_guidelines = task.get("brand_guidelines", {})
        variation_count = task.get("variation_count", self.default_variation_count)
        user_id = task.get("user_id")
        
        # Check if AI content generation is enabled
        if not self.enable_ai_content_generation:
            return {
                "status": "error",
                "error": "AI content generation is not enabled"
            }
        
        # Log the content generation request
        logger.info(f"Generating content for brand: {brand_id}, project: {project_id}, type: {project_type}")
        
        # Generate content variations
        try:
            content_variations = self._generate_content_variations(
                brand_id,
                project_type,
                content_topic,
                content_brief,
                brand_guidelines,
                variation_count
            )
            
            # Store variations in cache for testing
            cache_key = f"{self.content_variations_cache_prefix}:{project_id}"
            self.cache.set(cache_key, json.dumps(content_variations))
            
            # Record audit trail if enabled
            if self.enable_audit_trails:
                self._record_audit_trail(
                    action="content_generated",
                    user_id=user_id,
                    details={
                        "brand_id": brand_id,
                        "project_id": project_id,
                        "project_type": project_type,
                        "content_topic": content_topic,
                        "variation_count": len(content_variations)
                    }
                )
            
            return {
                "status": "success",
                "message": f"Generated {len(content_variations)} content variations",
                "project_id": project_id,
                "content_variations": content_variations
            }
        except Exception as e:
            logger.error(f"Error generating content: {e}")
            return {
                "status": "error",
                "error": f"Content generation failed: {str(e)}"
            }
    
    def _generate_content_variations(self, brand_id: Any, project_type: str, content_topic: str,
                                   content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                   variation_count: int) -> List[Dict[str, Any]]:
        """Generate multiple content variations based on project type and brief."""
        logger.info(f"Generating {variation_count} content variations for {project_type} on {content_topic}")
        
        variations = []
        
        # Try to use OpenAI API if available
        if self.enable_ai_content_generation and self.openai_client:
            try:
                # Generate content using OpenAI
                variations = self._generate_content_with_openai(
                    project_type, 
                    content_topic, 
                    content_brief, 
                    brand_guidelines, 
                    variation_count
                )
                logger.info(f"Successfully generated {len(variations)} variations using OpenAI API")
                return variations
            except Exception as e:
                logger.error(f"Error generating content with OpenAI: {e}")
                logger.info("Falling back to mock content generation")
        
        # Fallback to mock implementation
        for i in range(variation_count):
            # Different variation approaches based on project type
            if project_type == "Blog":
                variations.append(self._generate_blog_variation(i, content_topic, content_brief, brand_guidelines))
            elif project_type == "Social Post":
                variations.append(self._generate_social_post_variation(i, content_topic, content_brief, brand_guidelines))
            elif project_type == "Email":
                variations.append(self._generate_email_variation(i, content_topic, content_brief, brand_guidelines))
            elif project_type == "Landing Page":
                variations.append(self._generate_landing_page_variation(i, content_topic, content_brief, brand_guidelines))
            else:
                variations.append(self._generate_generic_variation(i, project_type, content_topic, content_brief, brand_guidelines))
        
        return variations
        
    def _generate_content_with_openai(self, project_type: str, content_topic: str,
                                   content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                   variation_count: int) -> List[Dict[str, Any]]:
        """Generate content variations using the OpenAI API."""
        variations = []
        
        # Format brand guidelines into a string
        brand_guidelines_str = "Brand Guidelines:\n"
        for key, value in brand_guidelines.items():
            brand_guidelines_str += f"- {key}: {value}\n"
            
        # Format content brief into a string
        content_brief_str = "Content Brief:\n"
        for key, value in content_brief.items():
            if isinstance(value, list):
                content_brief_str += f"- {key}:\n"
                for item in value:
                    content_brief_str += f"  - {item}\n"
            else:
                content_brief_str += f"- {key}: {value}\n"
        
        # Define variation approaches based on project type
        approaches = self._get_variation_approaches(project_type)
        
        # Generate each variation with a different approach
        for i in range(variation_count):
            approach_index = i % len(approaches)
            approach = approaches[approach_index]
            
            # Build the prompt based on project type
            if project_type == "Blog":
                variation = self._generate_blog_with_openai(
                    i, content_topic, content_brief, brand_guidelines, approach
                )
            elif project_type == "Social Post":
                variation = self._generate_social_post_with_openai(
                    i, content_topic, content_brief, brand_guidelines, approach
                )
            elif project_type == "Email":
                variation = self._generate_email_with_openai(
                    i, content_topic, content_brief, brand_guidelines, approach
                )
            elif project_type == "Landing Page":
                variation = self._generate_landing_page_with_openai(
                    i, content_topic, content_brief, brand_guidelines, approach
                )
            else:
                variation = self._generate_generic_with_openai(
                    i, project_type, content_topic, content_brief, brand_guidelines, approach
                )
                
            variations.append(variation)
            
        return variations
        
    def _get_variation_approaches(self, project_type: str) -> List[str]:
        """Get list of variation approaches based on project type."""
        if project_type == "Blog":
            return [
                "comprehensive guide",
                "case study focused",
                "how-to tutorial",
                "listicle format",
                "thought leadership"
            ]
        elif project_type == "Social Post":
            return [
                "question-based",
                "statistic highlight",
                "tip or hack",
                "quote format",
                "before and after"
            ]
        elif project_type == "Email":
            return [
                "problem-solution",
                "news announcement",
                "educational series",
                "case study spotlight",
                "exclusive offer"
            ]
        elif project_type == "Landing Page":
            return [
                "problem-agitate-solve",
                "benefits-focused",
                "social proof centered",
                "urgency and scarcity",
                "step-by-step process"
            ]
        else:
            return [
                "educational",
                "promotional",
                "storytelling",
                "data-driven",
                "expert interview"
            ]
            
    def _generate_blog_with_openai(self, variation_index: int, content_topic: str,
                                content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                approach: str) -> Dict[str, Any]:
        """Generate a blog post using OpenAI API."""
        # Format brand guidelines into a string
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Get objective from brief or use default
        objective = content_brief.get("objective", f"Educate audience about {content_topic}")
        
        # Get target audience from brief or use default
        target_audience = content_brief.get("target_audience", "Marketing professionals")
        
        # Get key points from brief or use defaults
        key_points = content_brief.get("key_points", [f"{content_topic} best practices", f"{content_topic} implementation"])
        
        # Prepare the prompt
        prompt = f"""
        Generate a high-quality blog post about {content_topic} using a {approach} approach.
        
        ## Content Brief:
        - Topic: {content_topic}
        - Target Audience: {target_audience}
        - Primary Objective: {objective}
        - Key Points to Cover: {', '.join(key_points)}
        - Call to Action: {content_brief.get('call_to_action', 'Contact us to learn more')}
        
        ## Brand Guidelines:
        - Brand Voice: {brand_voice}
        - Tone: {brand_guidelines.get('tone', 'Professional yet conversational')}
        - Brand Personality: {brand_guidelines.get('personality', 'Knowledgeable, helpful, forward-thinking')}
        
        ## Output Format:
        Return a JSON object with the following structure:
        {{
            "title": "Compelling title for the blog post",
            "meta_description": "SEO-friendly meta description under 160 characters",
            "introduction": "Engaging introduction paragraph",
            "sections": [
                {{
                    "heading": "Section heading",
                    "content": "Section content with paragraphs"
                }}
            ],
            "conclusion": "Strong conclusion paragraph",
            "estimated_word_count": "Number of words in the full article",
            "estimated_reading_time": "Estimated reading time in minutes",
            "keywords": ["keyword1", "keyword2", "keyword3"],
            "call_to_action": "Specific call to action text"
        }}
        
        Create a {approach} style blog post with 3-5 sections.
        """
        
        try:
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": f"You are a professional content writer specializing in creating engaging blog content with a {brand_voice} voice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content_json = json.loads(response.choices[0].message.content)
            
            # Format into our standard blog variation structure
            return {
                "variation_id": f"variation_{variation_index}",
                "variation_approach": approach,
                "project_type": "Blog",
                "content_topic": content_topic,
                "title": content_json.get("title", f"{content_topic} Guide: Key Strategies for Success"),
                "meta_description": content_json.get("meta_description", f"Learn essential {content_topic} strategies to improve your marketing results."),
                "target_audience": target_audience,
                "objective": objective,
                "brand_voice_alignment": brand_voice,
                "word_count": content_json.get("estimated_word_count", random.randint(1200, 2000)),
                "content_structure": {
                    "introduction": content_json.get("introduction", ""),
                    "sections": content_json.get("sections", []),
                    "conclusion": content_json.get("conclusion", "")
                },
                "call_to_action": content_json.get("call_to_action", content_brief.get("call_to_action", "Contact us to learn more")),
                "estimated_reading_time": content_json.get("estimated_reading_time", f"{random.randint(5, 10)} minutes"),
                "keywords": content_json.get("keywords", [content_topic, f"{content_topic} strategies", f"{content_topic} best practices"]),
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating blog with OpenAI: {e}")
            # Fall back to mock generation
            return self._generate_blog_variation(variation_index, content_topic, content_brief, brand_guidelines)
            
    def _generate_social_post_with_openai(self, variation_index: int, content_topic: str,
                                      content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                      approach: str) -> Dict[str, Any]:
        """Generate a social media post using OpenAI API."""
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Select platforms based on variation
        platforms = []
        all_platforms = ["LinkedIn", "Twitter", "Instagram", "Facebook"]
        for i in range(min(3, len(all_platforms))):
            platform_index = (variation_index + i) % len(all_platforms)
            platforms.append(all_platforms[platform_index])
        
        # Prepare the prompt
        prompt = f"""
        Generate a social media post about {content_topic} using a {approach} approach.
        
        ## Content Brief:
        - Topic: {content_topic}
        - Target Audience: {content_brief.get('target_audience', 'Marketing professionals')}
        - Objective: {content_brief.get('objective', f'Increase engagement around {content_topic}')}
        - Platforms: {', '.join(platforms)}
        
        ## Brand Guidelines:
        - Brand Voice: {brand_voice}
        - Tone: {brand_guidelines.get('tone', 'Professional yet conversational')}
        
        ## {approach.title()} Approach Details:
        - {self._get_approach_description('Social Post', approach)}
        
        ## Output Format:
        Return a JSON object with the following structure:
        {{
            "content": "The social media post content",
            "suggested_image": "Description of an image that would work well with this post",
            "suggested_hashtags": ["hashtag1", "hashtag2", "hashtag3"],
            "best_posting_time": "Suggested optimal posting time"
        }}
        
        Keep the post within the character limits for the specified platforms. Make it engaging and shareable.
        """
        
        try:
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": f"You are a social media specialist with expertise in creating engaging {', '.join(platforms)} content with a {brand_voice} voice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content_json = json.loads(response.choices[0].message.content)
            
            # Format into our standard social post variation structure
            return {
                "variation_id": f"variation_{variation_index}",
                "variation_approach": approach,
                "project_type": "Social Post",
                "content_topic": content_topic,
                "platforms": platforms,
                "content": content_json.get("content", f"Check out our latest insights on {content_topic}!"),
                "character_count": len(content_json.get("content", "")),
                "suggested_image": content_json.get("suggested_image", f"{content_topic} infographic with key statistics"),
                "suggested_hashtags": content_json.get("suggested_hashtags", [f"#{content_topic.replace(' ', '')}", "#MarketingTips", "#DigitalMarketing"]),
                "best_posting_time": content_json.get("best_posting_time", "Tuesday 10:00 AM" if variation_index % 2 == 0 else "Thursday 3:00 PM"),
                "target_audience": content_brief.get("target_audience", "Marketing professionals"),
                "objective": content_brief.get("objective", f"Increase engagement around {content_topic}"),
                "brand_voice_alignment": brand_voice,
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating social post with OpenAI: {e}")
            # Fall back to mock generation
            return self._generate_social_post_variation(variation_index, content_topic, content_brief, brand_guidelines)
            
    def _get_approach_description(self, project_type: str, approach: str) -> str:
        """Get a description for a specific content approach."""
        descriptions = {
            "Blog": {
                "comprehensive guide": "Create an in-depth, authoritative piece that covers all aspects of the topic comprehensively",
                "case study focused": "Focus on real-world examples and success stories related to the topic",
                "how-to tutorial": "Provide step-by-step instructions for implementing or achieving something related to the topic",
                "listicle format": "Structure the content as a numbered list of key points, tips, or strategies",
                "thought leadership": "Present forward-thinking perspectives and insights that position the brand as an industry leader"
            },
            "Social Post": {
                "question-based": "Frame the post around a compelling question that encourages engagement",
                "statistic highlight": "Feature a surprising or compelling statistic as the focal point",
                "tip or hack": "Share a useful tip, trick, or shortcut that provides immediate value",
                "quote format": "Use a relevant quote as the centerpiece of the post",
                "before and after": "Showcase a transformation or improvement"
            },
            "Email": {
                "problem-solution": "Identify a common pain point and present the solution",
                "news announcement": "Frame the content as breaking news or an important announcement",
                "educational series": "Position the email as part of a valuable educational series",
                "case study spotlight": "Highlight a specific success story or case study",
                "exclusive offer": "Present the content as an exclusive, limited-time opportunity"
            },
            "Landing Page": {
                "problem-agitate-solve": "Identify a problem, emphasize its impact, then present the solution",
                "benefits-focused": "Highlight the key benefits and advantages rather than features",
                "social proof centered": "Focus on testimonials and social proof as the primary persuasion element",
                "urgency and scarcity": "Create a sense of urgency through limited availability or time constraints",
                "step-by-step process": "Present a clear, simple process for achieving the desired outcome"
            }
        }
        
        if project_type in descriptions and approach in descriptions[project_type]:
            return descriptions[project_type][approach]
        else:
            return f"Create content using a {approach} approach that resonates with the target audience"
            
    def _generate_email_with_openai(self, variation_index: int, content_topic: str,
                                content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                approach: str) -> Dict[str, Any]:
        """Generate an email using OpenAI API."""
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Prepare the prompt
        prompt = f"""
        Generate marketing email content about {content_topic} using a {approach} approach.
        
        ## Content Brief:
        - Topic: {content_topic}
        - Target Audience: {content_brief.get('target_audience', 'Marketing professionals')}
        - Email Purpose: {content_brief.get('email_purpose', f'Educate audience about {content_topic}')}
        - Key Benefit: {content_brief.get('key_benefit', f'Improved {content_topic} results')}
        - Call to Action: {content_brief.get('call_to_action', 'Learn More')}
        
        ## Brand Guidelines:
        - Brand Voice: {brand_voice}
        - Tone: {brand_guidelines.get('tone', 'Professional yet conversational')}
        
        ## {approach.title()} Approach Details:
        - {self._get_approach_description('Email', approach)}
        
        ## Output Format:
        Return a JSON object with the following structure:
        {{
            "subject_line": "Compelling email subject line (max 50 characters)",
            "preview_text": "Email preview text that complements the subject (max 100 characters)",
            "greeting": "Email greeting/salutation",
            "body": "The main email body content with proper formatting",
            "call_to_action": "The primary call-to-action button text",
            "signature": "Email signature",
            "estimated_read_time": "Estimated reading time in minutes"
        }}
        
        Make the email engaging, on-brand, and designed to drive the desired action.
        """
        
        try:
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": f"You are an email marketing specialist with expertise in creating engaging email content with a {brand_voice} voice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content_json = json.loads(response.choices[0].message.content)
            
            # Format into our standard email variation structure
            return {
                "variation_id": f"variation_{variation_index}",
                "variation_approach": approach,
                "project_type": "Email",
                "content_topic": content_topic,
                "subject_line": content_json.get("subject_line", f"Transform Your {content_topic} Strategy with These Proven Methods"),
                "preview_text": content_json.get("preview_text", f"Learn how to optimize your {content_topic} approach and achieve better results."),
                "content_structure": {
                    "greeting": content_json.get("greeting", "Hi [First Name],"),
                    "body": content_json.get("body", f"Are you finding it challenging to get results from your {content_topic} efforts?"),
                    "call_to_action": content_json.get("call_to_action", "Learn More"),
                    "signature": content_json.get("signature", "Best regards,\n[Sender Name]\n[Company]")
                },
                "suggested_sending_time": "Tuesday morning" if variation_index % 2 == 0 else "Thursday afternoon",
                "estimated_read_time": content_json.get("estimated_read_time", f"{random.randint(2, 5)} minutes"),
                "target_audience": content_brief.get("target_audience", "Marketing professionals"),
                "objective": content_brief.get("objective", f"Educate audience about {content_topic}"),
                "brand_voice_alignment": brand_voice,
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating email with OpenAI: {e}")
            # Fall back to mock generation
            return self._generate_email_variation(variation_index, content_topic, content_brief, brand_guidelines)
            
    def _generate_landing_page_with_openai(self, variation_index: int, content_topic: str,
                                       content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                       approach: str) -> Dict[str, Any]:
        """Generate a landing page using OpenAI API."""
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Get brand colors from guidelines or use defaults
        brand_colors = brand_guidelines.get("color_palette", ["#1a73e8", "#34a853", "#fbbc04", "#ea4335"])
        
        # Prepare the prompt
        prompt = f"""
        Generate landing page content for {content_topic} using a {approach} approach.
        
        ## Content Brief:
        - Topic: {content_topic}
        - Target Audience: {content_brief.get('target_audience', 'Marketing professionals')}
        - Landing Page Purpose: {content_brief.get('landing_page_purpose', f'Generate leads for {content_topic} services')}
        - Value Proposition: {content_brief.get('value_proposition', f'Improve {content_topic} results with our proven methodology')}
        - Primary CTA: {content_brief.get('primary_cta', 'Get Started')}
        - Secondary CTA: {content_brief.get('secondary_cta', 'Learn More')}
        
        ## Brand Guidelines:
        - Brand Voice: {brand_voice}
        - Tone: {brand_guidelines.get('tone', 'Professional yet conversational')}
        - Color Palette: {', '.join(brand_colors)}
        
        ## {approach.title()} Approach Details:
        - {self._get_approach_description('Landing Page', approach)}
        
        ## Output Format:
        Return a JSON object with the following structure:
        {{
            "main_headline": "Primary headline for the landing page",
            "subheadline": "Supporting subheadline",
            "hero_content": "Main hero section content",
            "key_benefits": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4"],
            "primary_cta": "Primary call-to-action button text",
            "secondary_cta": "Secondary call-to-action text",
            "testimonials": [
                {{
                    "quote": "Customer testimonial",
                    "author": "Author name",
                    "position": "Author position",
                    "company": "Author company"
                }}
            ],
            "faq_items": [
                {{
                    "question": "Frequently asked question",
                    "answer": "Answer to the question"
                }}
            ],
            "visual_suggestions": {{
                "hero_image": "Description of recommended hero image",
                "recommended_elements": ["Element 1", "Element 2", "Element 3"]
            }}
        }}
        
        Create persuasive landing page content that drives conversions.
        """
        
        try:
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": f"You are a conversion-focused copywriter specializing in creating high-converting landing pages with a {brand_voice} voice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content_json = json.loads(response.choices[0].message.content)
            
            # Get form fields (default or existing)
            form_fields = [
                {"name": "first_name", "label": "First Name", "type": "text", "required": True},
                {"name": "email", "label": "Email Address", "type": "email", "required": True},
                {"name": "company", "label": "Company Name", "type": "text", "required": True},
                {"name": "role", "label": "Job Title", "type": "text", "required": False}
            ]
            
            # Format into our standard landing page variation structure
            return {
                "variation_id": f"variation_{variation_index}",
                "variation_approach": approach,
                "project_type": "Landing Page",
                "content_topic": content_topic,
                "main_headline": content_json.get("main_headline", f"Transform Your {content_topic} Results with Our Proven System"),
                "subheadline": content_json.get("subheadline", f"Discover how our data-driven approach to {content_topic} delivers consistent results for businesses like yours."),
                "hero_content": content_json.get("hero_content", f"Our simple 3-step process makes mastering {content_topic} straightforward and achievable for any business."),
                "key_benefits": content_json.get("key_benefits", [
                    f"Achieve consistent, predictable results from your {content_topic} initiatives",
                    f"Save time with streamlined {content_topic} workflows and templates",
                    f"Increase ROI by focusing on high-impact {content_topic} strategies",
                    f"Stay ahead of competitors with cutting-edge {content_topic} tactics"
                ]),
                "form_fields": form_fields,
                "primary_cta": content_json.get("primary_cta", content_brief.get("primary_cta", "Get Started")),
                "secondary_cta": content_json.get("secondary_cta", content_brief.get("secondary_cta", f"Learn More About {content_topic}")),
                "testimonials": content_json.get("testimonials", [
                    {
                        "quote": f"Implementing this {content_topic} framework transformed our marketing results completely. We've seen a 75% increase in qualified leads within just two months.",
                        "author": "Jane Smith",
                        "position": "Marketing Director",
                        "company": "XYZ Corp"
                    }
                ]),
                "faq_items": content_json.get("faq_items", [
                    {
                        "question": f"How long does it take to see results from this {content_topic} approach?",
                        "answer": f"Most clients begin seeing measurable improvements in their {content_topic} metrics within 2-3 weeks of implementation."
                    }
                ]),
                "visual_suggestions": content_json.get("visual_suggestions", {
                    "hero_image": f"Professional using {content_topic} tools with visible results",
                    "color_scheme": brand_colors,
                    "recommended_elements": [
                        "Results visualization graph",
                        "Step-by-step implementation diagram",
                        "Client logos for social proof"
                    ]
                }),
                "target_audience": content_brief.get("target_audience", "Marketing professionals"),
                "objective": content_brief.get("objective", f"Generate leads for {content_topic} services"),
                "brand_voice_alignment": brand_voice,
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating landing page with OpenAI: {e}")
            # Fall back to mock generation
            return self._generate_landing_page_variation(variation_index, content_topic, content_brief, brand_guidelines)
            
    def _generate_generic_with_openai(self, variation_index: int, project_type: str, content_topic: str,
                                   content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any],
                                   approach: str) -> Dict[str, Any]:
        """Generate generic content using OpenAI API."""
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Prepare the prompt
        prompt = f"""
        Generate content for a {project_type} about {content_topic} using a {approach} approach.
        
        ## Content Brief:
        - Topic: {content_topic}
        - Target Audience: {content_brief.get('target_audience', 'Marketing professionals')}
        - Objective: {content_brief.get('objective', f'Educate audience about {content_topic}')}
        - Call to Action: {content_brief.get('call_to_action', 'Learn More')}
        
        ## Brand Guidelines:
        - Brand Voice: {brand_voice}
        - Tone: {brand_guidelines.get('tone', 'Professional yet conversational')}
        
        ## {approach.title()} Approach Details:
        - Create content using a {approach} approach that resonates with the target audience
        
        ## Output Format:
        Return a JSON object with the following structure:
        {{
            "headline": "Compelling headline for the content",
            "content_summary": "Brief summary of the content",
            "key_points": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
            "call_to_action": "Call-to-action text"
        }}
        
        Create engaging content that meets the project objectives.
        """
        
        try:
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": f"You are a versatile content creator with expertise in producing various types of marketing content with a {brand_voice} voice."},
                    {"role": "user", "content": prompt}
                ],
                temperature=self.temperature,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            content_json = json.loads(response.choices[0].message.content)
            
            # Format into our standard generic variation structure
            return {
                "variation_id": f"variation_{variation_index}",
                "variation_approach": approach,
                "project_type": project_type,
                "content_topic": content_topic,
                "headline": content_json.get("headline", f"{content_topic}: Essential Strategies for Success"),
                "content_summary": content_json.get("content_summary", f"This {project_type} explores key aspects of {content_topic}, providing actionable insights for implementation in your marketing strategy."),
                "key_points": content_json.get("key_points", [
                    f"Understanding the fundamentals of {content_topic}",
                    f"Implementing effective {content_topic} strategies",
                    f"Measuring and optimizing {content_topic} performance",
                    f"Staying ahead of {content_topic} trends and innovations"
                ]),
                "call_to_action": content_json.get("call_to_action", content_brief.get("call_to_action", "Learn More")),
                "target_audience": content_brief.get("target_audience", "Marketing professionals"),
                "objective": content_brief.get("objective", f"Educate audience about {content_topic}"),
                "brand_voice_alignment": brand_voice,
                "created_at": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error generating generic content with OpenAI: {e}")
            # Fall back to mock generation
            return self._generate_generic_variation(variation_index, project_type, content_topic, content_brief, brand_guidelines)
    
    def _generate_blog_variation(self, variation_index: int, content_topic: str, 
                               content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a blog content variation."""
        # Different approaches based on variation index
        approaches = [
            "comprehensive guide",
            "case study focused",
            "how-to tutorial",
            "listicle format",
            "thought leadership"
        ]
        
        approach = approaches[variation_index % len(approaches)]
        
        # Mock heading variations
        heading_variations = [
            f"The Ultimate Guide to {content_topic}: Everything You Need to Know",
            f"{content_topic} Essentials: A Step-by-Step Approach",
            f"How Top Companies Are Leveraging {content_topic} in 2025",
            f"10 Essential {content_topic} Strategies You Can't Ignore",
            f"The Future of {content_topic}: Trends and Predictions"
        ]
        
        # Get objective from brief or use default
        objective = content_brief.get("objective", f"Educate audience about {content_topic}")
        
        # Get target audience from brief or use default
        target_audience = content_brief.get("target_audience", "Marketing professionals")
        
        # Get key points from brief or use defaults
        key_points = content_brief.get("key_points", [f"{content_topic} best practices", f"{content_topic} implementation"])
        
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Mock intro paragraph based on approach
        if approach == "comprehensive guide":
            intro = f"Understanding {content_topic} is essential for success in today's rapidly evolving marketplace. This comprehensive guide will walk you through everything you need to know, from fundamental concepts to advanced strategies that will set you apart from competitors."
        elif approach == "case study focused":
            intro = f"In this analysis, we'll explore how leading companies have successfully implemented {content_topic} strategies to achieve remarkable results. By examining these real-world examples, you'll gain practical insights you can apply to your own business."
        elif approach == "how-to tutorial":
            intro = f"Implementing effective {content_topic} strategies doesn't have to be complicated. This practical tutorial breaks down the process into simple, actionable steps that you can start applying today to see immediate improvements."
        elif approach == "listicle format":
            intro = f"Looking to enhance your {content_topic} approach? We've compiled the 10 most effective strategies used by industry leaders. These proven techniques will help you optimize your efforts and achieve better results with minimal resource investment."
        else:  # thought leadership
            intro = f"As we look toward the future of {content_topic}, several emerging trends are reshaping best practices. This analysis examines how forward-thinking organizations are adapting to these changes and positions your business to stay ahead of the curve."
        
        # Generate mock content structure
        sections = []
        for i, point in enumerate(key_points[:3]):  # Limit to 3 sections for mock
            sections.append({
                "heading": f"Section {i+1}: {point}",
                "content": f"This section explores {point} in detail, providing actionable insights and practical examples. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
            })
        
        # Generate mock conclusion
        conclusion = f"By implementing these {content_topic} strategies, you'll be well-positioned to achieve your business objectives and stay ahead of the competition. Remember that consistency and ongoing optimization are key to long-term success."
        
        return {
            "variation_id": f"variation_{variation_index}",
            "variation_approach": approach,
            "project_type": "Blog",
            "content_topic": content_topic,
            "title": heading_variations[variation_index % len(heading_variations)],
            "meta_description": f"Learn essential {content_topic} strategies to improve your marketing results in 2025 and beyond.",
            "target_audience": target_audience,
            "objective": objective,
            "brand_voice_alignment": brand_voice,
            "word_count": random.randint(1200, 2000),
            "content_structure": {
                "introduction": intro,
                "sections": sections,
                "conclusion": conclusion
            },
            "call_to_action": content_brief.get("call_to_action", "Contact us to learn more"),
            "estimated_reading_time": f"{random.randint(5, 10)} minutes",
            "keywords": [content_topic, f"{content_topic} strategies", f"{content_topic} best practices"],
            "created_at": datetime.now().isoformat()
        }
    
    def _generate_social_post_variation(self, variation_index: int, content_topic: str,
                                     content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a social media post content variation."""
        # Different approaches based on variation index
        approaches = [
            "question-based",
            "statistic highlight",
            "tip or hack",
            "quote format",
            "before and after"
        ]
        
        approach = approaches[variation_index % len(approaches)]
        
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Generate content based on approach
        if approach == "question-based":
            content = f"Are you struggling to optimize your {content_topic} strategy? Most businesses see a 40% improvement when they implement these three key changes. [Link in bio] #MarketingTips #{content_topic.replace(' ', '')}"
        elif approach == "statistic highlight":
            content = f"📊 DID YOU KNOW? 78% of companies that prioritize {content_topic} report higher customer engagement rates. Learn how to join them with our latest guide. #MarketingInsights #{content_topic.replace(' ', '')}"
        elif approach == "tip or hack":
            content = f"💡 PRO TIP: Enhance your {content_topic} performance with this 5-minute daily practice that top marketers swear by. Try it for one week and watch your results transform! #MarketingHacks #{content_topic.replace(' ', '')}"
        elif approach == "quote format":
            content = f"\"The most successful {content_topic} strategies focus on customer value first, metrics second.\" - Marketing wisdom that transformed our approach. Learn how at the link. #MarketingWisdom #{content_topic.replace(' ', '')}"
        else:  # before and after
            content = f"BEFORE: Struggling with {content_topic} and seeing minimal results.\n\nAFTER: Implementing our 3-step framework and achieving 2x the engagement.\n\nWant to know how? Check out our latest guide! #MarketingTransformation #{content_topic.replace(' ', '')}"
        
        # Mock image options
        image_options = [
            f"{content_topic} infographic with key statistics",
            f"Person implementing {content_topic} strategy with visible results",
            f"Before/after comparison showing {content_topic} impact",
            f"Quote overlay on branded background related to {content_topic}",
            f"Step-by-step visual guide for {content_topic} implementation"
        ]
        
        # Select platforms based on variation
        platforms = []
        all_platforms = ["LinkedIn", "Twitter", "Instagram", "Facebook"]
        for i in range(min(3, len(all_platforms))):
            platform_index = (variation_index + i) % len(all_platforms)
            platforms.append(all_platforms[platform_index])
        
        return {
            "variation_id": f"variation_{variation_index}",
            "variation_approach": approach,
            "project_type": "Social Post",
            "content_topic": content_topic,
            "platforms": platforms,
            "content": content,
            "character_count": len(content),
            "suggested_image": image_options[variation_index % len(image_options)],
            "suggested_hashtags": [f"#{content_topic.replace(' ', '')}", "#MarketingTips", "#DigitalMarketing"],
            "best_posting_time": "Tuesday 10:00 AM" if variation_index % 2 == 0 else "Thursday 3:00 PM",
            "target_audience": content_brief.get("target_audience", "Marketing professionals"),
            "objective": content_brief.get("objective", f"Increase engagement around {content_topic}"),
            "brand_voice_alignment": brand_voice,
            "created_at": datetime.now().isoformat()
        }
    
    def _generate_email_variation(self, variation_index: int, content_topic: str,
                                content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any]) -> Dict[str, Any]:
        """Generate an email content variation."""
        # Different approaches based on variation index
        approaches = [
            "problem-solution",
            "news announcement",
            "educational series",
            "case study spotlight",
            "exclusive offer"
        ]
        
        approach = approaches[variation_index % len(approaches)]
        
        # Subject line variations
        subject_variations = [
            f"Transform Your {content_topic} Strategy with These Proven Methods",
            f"[New Guide] Essential {content_topic} Tactics for 2025",
            f"{content_topic} Masterclass: Week 1 of 5",
            f"How Company X Increased ROI by 150% Using Our {content_topic} Framework",
            f"Exclusive: {content_topic} Assessment Tool (Limited Time Access)"
        ]
        
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Generate preview text
        preview_text = f"Learn how to optimize your {content_topic} approach and achieve better results."
        
        # Generate greeting
        greeting = "Hi [First Name],"
        
        # Generate body based on approach
        if approach == "problem-solution":
            body = f"Are you finding it challenging to get results from your {content_topic} efforts?\n\nYou're not alone. Many marketers struggle with this exact issue, often because they're missing three critical components in their strategy.\n\nIn our latest guide, we break down:\n\n• The most common {content_topic} mistakes and how to avoid them\n• A simple framework for optimizing your approach\n• Real examples of successful implementations\n\nDownload the complete guide below to transform your {content_topic} strategy today."
        elif approach == "news announcement":
            body = f"We're excited to announce the release of our comprehensive guide to {content_topic}!\n\nBased on analysis of over 500 successful campaigns and expert interviews, this guide provides actionable insights on:\n\n• Current best practices for {content_topic}\n• Emerging trends to watch in 2025\n• Step-by-step implementation strategies\n\nAs a valued subscriber, you get first access to this resource before we release it publicly next week."
        elif approach == "educational series":
            body = f"Welcome to Week 1 of our {content_topic} Mastery Series!\n\nOver the next 5 weeks, you'll receive a comprehensive education on optimizing your {content_topic} strategy from the ground up.\n\nThis Week's Focus: {content_topic} Fundamentals\n\nIn this email, we'll cover:\n\n• The core principles of effective {content_topic}\n• How to assess your current performance\n• Quick wins you can implement today\n\nLet's get started with the fundamentals..."
        elif approach == "case study spotlight":
            body = f"I wanted to share a remarkable case study that demonstrates the power of an optimized {content_topic} strategy.\n\nCompany X was struggling with low engagement and conversion rates despite significant investment in their marketing efforts.\n\nAfter implementing our {content_topic} framework:\n\n• Engagement rates increased by 85%\n• Conversion rates improved by 40%\n• Overall ROI jumped by 150%\n\nRead the full case study below to discover exactly how they achieved these results and how you can apply the same principles to your business."
        else:  # exclusive offer
            body = f"For a limited time, we're offering exclusive access to our proprietary {content_topic} Assessment Tool.\n\nThis tool has helped hundreds of companies identify critical gaps in their {content_topic} strategy and prioritize high-impact improvements.\n\nWith this assessment, you'll receive:\n\n• A detailed analysis of your current {content_topic} approach\n• Benchmarking against industry standards\n• Personalized recommendations for improvement\n• Priority action items for immediate results\n\nThis offer expires in 48 hours, so act now to secure your access."
        
        # Generate call to action
        cta = content_brief.get("call_to_action", "Click Here to Learn More")
        
        # Generate signature
        signature = "Best regards,\n[Sender Name]\n[Company]"
        
        return {
            "variation_id": f"variation_{variation_index}",
            "variation_approach": approach,
            "project_type": "Email",
            "content_topic": content_topic,
            "subject_line": subject_variations[variation_index % len(subject_variations)],
            "preview_text": preview_text,
            "content_structure": {
                "greeting": greeting,
                "body": body,
                "call_to_action": cta,
                "signature": signature
            },
            "suggested_sending_time": "Tuesday morning" if variation_index % 2 == 0 else "Thursday afternoon",
            "estimated_read_time": f"{random.randint(2, 5)} minutes",
            "target_audience": content_brief.get("target_audience", "Marketing professionals"),
            "objective": content_brief.get("objective", f"Educate audience about {content_topic}"),
            "brand_voice_alignment": brand_voice,
            "created_at": datetime.now().isoformat()
        }
    
    def _generate_landing_page_variation(self, variation_index: int, content_topic: str,
                                      content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a landing page content variation."""
        # Different approaches based on variation index
        approaches = [
            "problem-agitate-solve",
            "benefits-focused",
            "social proof centered",
            "urgency and scarcity",
            "step-by-step process"
        ]
        
        approach = approaches[variation_index % len(approaches)]
        
        # Headline variations
        headline_variations = [
            f"Solve Your Biggest {content_topic} Challenges Once and For All",
            f"Transform Your {content_topic} Results with Our Proven System",
            f"Join 10,000+ Companies Succeeding with Our {content_topic} Framework",
            f"Limited Time: Get Exclusive Access to Our {content_topic} Masterclass",
            f"The Simple 3-Step Process to Master {content_topic}"
        ]
        
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Get brand colors from guidelines or use defaults
        brand_colors = brand_guidelines.get("color_palette", ["#1a73e8", "#34a853", "#fbbc04", "#ea4335"])
        
        # Generate subheadline
        subheadline = f"Discover how our data-driven approach to {content_topic} delivers consistent results for businesses like yours."
        
        # Generate hero section based on approach
        if approach == "problem-agitate-solve":
            hero_content = f"Are you tired of unpredictable results from your {content_topic} efforts? Most businesses waste thousands of dollars on ineffective strategies because they're missing key insights. Our framework solves this problem with a systematic approach that's been proven to work across industries."
        elif approach == "benefits-focused":
            hero_content = f"Imagine achieving predictable, scalable results from your {content_topic} initiatives. Our clients typically see 40% higher engagement, 25% better conversion rates, and significant time savings within the first 30 days of implementing our framework."
        elif approach == "social proof centered":
            hero_content = f"Join over 10,000 successful companies that have transformed their {content_topic} results using our methodology. From startups to Fortune 500 companies, our framework has delivered consistent results across industries and company sizes."
        elif approach == "urgency and scarcity":
            hero_content = f"For a limited time, we're offering exclusive access to our {content_topic} Masterclass. Only 50 spots are available in this cohort, and previous sessions have sold out within 48 hours. Secure your spot now to avoid missing this opportunity."
        else:  # step-by-step process
            hero_content = f"Our simple 3-step process makes mastering {content_topic} straightforward and achievable for any business. No complicated systems or technical expertise required—just follow our proven methodology to see results within weeks, not months."
        
        # Generate key benefits
        benefits = [
            f"Achieve consistent, predictable results from your {content_topic} initiatives",
            f"Save time with streamlined {content_topic} workflows and templates",
            f"Increase ROI by focusing on high-impact {content_topic} strategies",
            f"Stay ahead of competitors with cutting-edge {content_topic} tactics"
        ]
        
        # Generate form fields
        form_fields = [
            {"name": "first_name", "label": "First Name", "type": "text", "required": True},
            {"name": "email", "label": "Email Address", "type": "email", "required": True},
            {"name": "company", "label": "Company Name", "type": "text", "required": True},
            {"name": "role", "label": "Job Title", "type": "text", "required": False}
        ]
        
        # Generate CTA
        primary_cta = content_brief.get("call_to_action", f"Get Your Free {content_topic} Assessment")
        
        # Generate testimonials
        testimonials = [
            {
                "quote": f"Implementing this {content_topic} framework transformed our marketing results completely. We've seen a 75% increase in qualified leads within just two months.",
                "author": "Jane Smith",
                "position": "Marketing Director",
                "company": "XYZ Corp"
            },
            {
                "quote": f"The step-by-step approach to {content_topic} made implementation easy. Our team was able to execute quickly and we started seeing improvements almost immediately.",
                "author": "Michael Johnson",
                "position": "CEO",
                "company": "Startup Innovations"
            }
        ]
        
        # Generate FAQ items
        faq_items = [
            {
                "question": f"How long does it take to see results from this {content_topic} approach?",
                "answer": f"Most clients begin seeing measurable improvements in their {content_topic} metrics within 2-3 weeks of implementation."
            },
            {
                "question": f"Will this {content_topic} framework work for my specific industry?",
                "answer": f"Yes, our approach has been successfully implemented across dozens of industries with consistent results. The framework adapts to your specific market context."
            },
            {
                "question": f"Do I need technical expertise to implement this {content_topic} strategy?",
                "answer": f"No technical expertise is required. Our step-by-step implementation guides are designed for marketers of all skill levels."
            }
        ]
        
        return {
            "variation_id": f"variation_{variation_index}",
            "variation_approach": approach,
            "project_type": "Landing Page",
            "content_topic": content_topic,
            "main_headline": headline_variations[variation_index % len(headline_variations)],
            "subheadline": subheadline,
            "hero_content": hero_content,
            "key_benefits": benefits,
            "form_fields": form_fields,
            "primary_cta": primary_cta,
            "secondary_cta": f"Learn More About {content_topic}",
            "testimonials": testimonials,
            "faq_items": faq_items,
            "visual_suggestions": {
                "hero_image": f"Professional using {content_topic} tools with visible results",
                "color_scheme": brand_colors,
                "recommended_elements": [
                    "Results visualization graph",
                    "Step-by-step implementation diagram",
                    "Client logos for social proof"
                ]
            },
            "target_audience": content_brief.get("target_audience", "Marketing professionals"),
            "objective": content_brief.get("objective", f"Generate leads for {content_topic} services"),
            "brand_voice_alignment": brand_voice,
            "created_at": datetime.now().isoformat()
        }
    
    def _generate_generic_variation(self, variation_index: int, project_type: str, content_topic: str,
                                  content_brief: Dict[str, Any], brand_guidelines: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a generic content variation for unknown project types."""
        # Different approaches based on variation index
        approaches = [
            "educational",
            "promotional",
            "storytelling",
            "data-driven",
            "expert interview"
        ]
        
        approach = approaches[variation_index % len(approaches)]
        
        # Get brand voice from guidelines or use default
        brand_voice = brand_guidelines.get("voice", "Professional and friendly")
        
        # Generate headline
        headline = f"{content_topic}: Essential Strategies for Success in 2025"
        
        # Generate content summary
        content_summary = f"This {project_type} explores key aspects of {content_topic}, providing actionable insights for implementation in your marketing strategy."
        
        # Generate key points
        key_points = [
            f"Understanding the fundamentals of {content_topic}",
            f"Implementing effective {content_topic} strategies",
            f"Measuring and optimizing {content_topic} performance",
            f"Staying ahead of {content_topic} trends and innovations"
        ]
        
        # Generate call to action
        cta = content_brief.get("call_to_action", "Learn More")
        
        return {
            "variation_id": f"variation_{variation_index}",
            "variation_approach": approach,
            "project_type": project_type,
            "content_topic": content_topic,
            "headline": headline,
            "content_summary": content_summary,
            "key_points": key_points,
            "call_to_action": cta,
            "target_audience": content_brief.get("target_audience", "Marketing professionals"),
            "objective": content_brief.get("objective", f"Educate audience about {content_topic}"),
            "brand_voice_alignment": brand_voice,
            "created_at": datetime.now().isoformat()
        }
    
    def handle_content_testing(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle A/B testing for content variations."""
        brand_id = task.get("brand_id")
        project_id = task.get("project_id")
        test_type = task.get("test_type", "A/B test")
        metrics = task.get("metrics", ["engagement", "conversion"])
        duration = task.get("duration", 7)  # Default: 7 days
        user_id = task.get("user_id")
        
        # Check if A/B testing is enabled
        if not self.enable_ab_testing:
            return {
                "status": "error",
                "error": "A/B testing is not enabled"
            }
        
        # Log the testing request
        logger.info(f"Setting up {test_type} for project: {project_id} with metrics: {metrics}")
        
        # Get content variations from cache
        cache_key = f"{self.content_variations_cache_prefix}:{project_id}"
        content_variations_json = self.cache.get(cache_key)
        
        if not content_variations_json:
            return {
                "status": "error",
                "error": "No content variations found for this project"
            }
        
        try:
            content_variations = json.loads(content_variations_json)
            
            # Design the test
            test_design = self._design_content_test(
                project_id,
                test_type,
                content_variations,
                metrics,
                duration
            )
            
            # Store test design in cache
            test_cache_key = f"{self.test_results_cache_prefix}:{project_id}"
            self.cache.set(test_cache_key, json.dumps(test_design))
            
            # Schedule test completion
            self._schedule_test_completion(project_id, duration)
            
            # Record audit trail if enabled
            if self.enable_audit_trails:
                self._record_audit_trail(
                    action="test_initiated",
                    user_id=user_id,
                    details={
                        "brand_id": brand_id,
                        "project_id": project_id,
                        "test_type": test_type,
                        "metrics": metrics,
                        "duration": duration,
                        "variation_count": len(content_variations)
                    }
                )
            
            return {
                "status": "success",
                "message": f"{test_type} initiated for project {project_id}",
                "test_id": test_design["test_id"],
                "test_design": test_design
            }
        except Exception as e:
            logger.error(f"Error setting up content test: {e}")
            return {
                "status": "error",
                "error": f"Test setup failed: {str(e)}"
            }
    
    def _design_content_test(self, project_id: Any, test_type: str, content_variations: List[Dict[str, Any]],
                           metrics: List[str], duration: int) -> Dict[str, Any]:
        """Design an A/B or multivariate test for content variations."""
        # TODO: Implement actual test design logic
        # Mock implementation for testing
        logger.info(f"Designing {test_type} for project {project_id} with {len(content_variations)} variations")
        
        # Generate test ID
        test_id = f"test_{project_id}_{int(time.time())}"
        
        # Determine audience segments
        audience_size = 1000  # Mock audience size
        segments = []
        
        if test_type == "A/B test" and len(content_variations) == 2:
            # Simple A/B test with 50/50 split
            segments = [
                {"name": "Variation A", "variation_id": content_variations[0]["variation_id"], "allocation": 50, "size": audience_size // 2},
                {"name": "Variation B", "variation_id": content_variations[1]["variation_id"], "allocation": 50, "size": audience_size // 2}
            ]
        else:
            # Multivariate test with equal distribution
            segment_size = audience_size // len(content_variations)
            allocation = 100 // len(content_variations)
            segments = [
                {"name": f"Variation {i+1}", "variation_id": variation["variation_id"], "allocation": allocation, "size": segment_size}
                for i, variation in enumerate(content_variations)
            ]
        
        # Define success metrics configuration
        metrics_config = {}
        for metric in metrics:
            if metric == "engagement":
                metrics_config["engagement"] = {
                    "primary_kpi": "click_through_rate",
                    "secondary_kpis": ["time_on_page", "scroll_depth", "social_shares"],
                    "measurement_method": "event tracking"
                }
            elif metric == "conversion":
                metrics_config["conversion"] = {
                    "primary_kpi": "conversion_rate",
                    "secondary_kpis": ["form_completions", "cta_clicks", "goal_completions"],
                    "measurement_method": "goal tracking"
                }
            elif metric == "retention":
                metrics_config["retention"] = {
                    "primary_kpi": "return_visits",
                    "secondary_kpis": ["subscription_rate", "account_creation"],
                    "measurement_method": "user tracking"
                }
        
        # Define statistical parameters
        statistical_parameters = {
            "confidence_level": 95,
            "minimum_detectable_effect": 10,  # 10% improvement
            "power": 80,
            "sample_size_per_variation": audience_size // len(content_variations),
            "estimated_runtime": f"{duration} days"
        }
        
        return {
            "test_id": test_id,
            "project_id": project_id,
            "test_type": test_type,
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=duration)).isoformat(),
            "duration_days": duration,
            "status": "running",
            "variations": [{"variation_id": v["variation_id"], "approach": v.get("variation_approach")} for v in content_variations],
            "audience_segments": segments,
            "metrics": metrics_config,
            "statistical_parameters": statistical_parameters,
            "initial_recommendations": {
                "sample_size_rationale": "Based on industry standard conversion rates of 2-5%",
                "test_duration_rationale": f"{duration} days provides sufficient data collection while accounting for day-of-week effects"
            }
        }
    
    def _schedule_test_completion(self, project_id: Any, duration: int):
        """Schedule test completion and results generation."""
        # In a real implementation, this would set up a delayed task
        # For now, we'll just log the scheduled completion
        completion_date = datetime.now() + timedelta(days=duration)
        logger.info(f"Test for project {project_id} scheduled for completion on {completion_date.isoformat()}")
        
        # In a real system, you would use a task scheduler or cron job
        # For demo purposes, we'll just simulate immediate results
        self._generate_test_results(project_id)
    
    def _generate_test_results(self, project_id: Any):
        """Generate mock test results for demo purposes."""
        # Get test design from cache
        test_cache_key = f"{self.test_results_cache_prefix}:{project_id}"
        test_design_json = self.cache.get(test_cache_key)
        
        if not test_design_json:
            logger.error(f"No test design found for project {project_id}")
            return
        
        try:
            test_design = json.loads(test_design_json)
            
            # Generate mock results for each variation
            variations_results = []
            winning_variation = None
            highest_score = 0
            
            for i, variation in enumerate(test_design.get("variations", [])):
                # Generate random performance metrics
                engagement_rate = round(random.uniform(2.0, 8.0), 2)
                conversion_rate = round(random.uniform(1.0, 4.0), 2)
                
                # Add some variance to make one variation clearly better
                if i == 0:  # Make first variation a bit better for demo
                    engagement_rate += 1.5
                    conversion_rate += 0.8
                
                # Calculate composite score
                score = engagement_rate * 0.6 + conversion_rate * 0.4
                
                # Check if this is the winner so far
                if score > highest_score:
                    highest_score = score
                    winning_variation = variation["variation_id"]
                
                # Store results
                variations_results.append({
                    "variation_id": variation["variation_id"],
                    "approach": variation.get("approach", ""),
                    "metrics": {
                        "engagement": {
                            "rate": engagement_rate,
                            "raw_count": int(engagement_rate * 100),
                            "statistical_significance": random.choice([True, False])
                        },
                        "conversion": {
                            "rate": conversion_rate,
                            "raw_count": int(conversion_rate * 50),
                            "statistical_significance": random.choice([True, False])
                        }
                    },
                    "composite_score": score
                })
            
            # Generate overall results
            results = {
                "test_id": test_design["test_id"],
                "project_id": project_id,
                "status": "completed",
                "start_date": test_design["start_date"],
                "end_date": datetime.now().isoformat(),
                "actual_duration_days": test_design["duration_days"],
                "variations_results": variations_results,
                "winning_variation": winning_variation,
                "statistical_confidence": 95,
                "insights": [
                    "The winning variation had a 22% higher engagement rate",
                    "Conversions improved significantly with the more direct call-to-action",
                    "Mobile users responded better to the shorter content format"
                ],
                "recommendations": [
                    "Implement the winning variation across all channels",
                    "Further optimize the call-to-action placement and wording",
                    "Consider developing a mobile-specific version with more concise content"
                ]
            }
            
            # Update test results in cache
            self.cache.set(test_cache_key, json.dumps({**test_design, "results": results}))
            
            # Broadcast result event
            self.broadcast_event({
                "event_type": "content_test_completed",
                "test_id": test_design["test_id"],
                "project_id": project_id,
                "winning_variation": winning_variation
            })
            
            logger.info(f"Generated test results for project {project_id}, winner: {winning_variation}")
            
        except Exception as e:
            logger.error(f"Error generating test results: {e}")
    
    def _handle_content_performance_update(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle content performance update events."""
        content_id = event.get("content_id")
        performance_data = event.get("performance_data", {})
        
        logger.info(f"Received performance update for content: {content_id}")
        
        # Process performance data
        # TODO: Implement actual performance processing
        
        # Return confirmation of processing
        return {
            "status": "processed",
            "content_id": content_id,
            "message": "Performance data processed successfully"
        }
    
    def _record_audit_trail(self, action: str, user_id: Any, details: Dict[str, Any]):
        """Record an audit trail entry."""
        # TODO: Implement actual audit trail recording in database
        logger.info(f"AUDIT: {action} by user {user_id} - {details}")