from typing import Dict, Any, List
from loguru import logger
import requests
from bs4 import BeautifulSoup
import re

from src.ultimate_marketing_team.agents.base_agent import BaseAgent

class BrandProjectManagementAgent(BaseAgent):
    """Agent responsible for brand and project management.
    
    This agent handles onboarding brands by capturing company information and brand guidelines,
    and sets up multiple project types per brand. It automatically enriches data from website URLs
    and implements role-based access control (RBAC) and audit trails for enhanced security.
    """
    
    def __init__(self, agent_id: str, name: str, **kwargs):
        super().__init__(agent_id, name)
        self.enable_web_scraping = kwargs.get("enable_web_scraping", True)
        self.enable_rbac = kwargs.get("enable_rbac", True)
        self.enable_audit_trails = kwargs.get("enable_audit_trails", True)
    
    def _initialize(self):
        super()._initialize()
        
        # Register task handlers
        self.register_task_handler("onboard_brand", self.handle_onboard_brand)
        self.register_task_handler("update_brand", self.handle_update_brand)
        self.register_task_handler("get_brand_info", self.handle_get_brand_info)
        self.register_task_handler("create_project", self.handle_create_project)
        self.register_task_handler("update_project", self.handle_update_project)
        self.register_task_handler("get_project_info", self.handle_get_project_info)
        self.register_task_handler("assign_project", self.handle_assign_project)
        self.register_task_handler("get_brand_projects", self.handle_get_brand_projects)
    
    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a generic task assigned to this agent."""
        task_type = task.get("task_type")
        logger.warning(f"Using generic task processing for task type: {task_type}")
        
        # Return error for unhandled task types
        return {
            "status": "error",
            "error": f"Unhandled task type: {task_type}"
        }
    
    def handle_onboard_brand(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle brand onboarding process."""
        company_name = task.get("company_name")
        website_url = task.get("website_url")
        brand_guidelines = task.get("brand_guidelines", {})
        user_id = task.get("user_id")
        
        # Log the onboarding attempt
        logger.info(f"Onboarding brand: {company_name} ({website_url}) by user {user_id}")
        
        # Enrich data from website if enabled and URL provided
        enriched_data = {}
        if self.enable_web_scraping and website_url:
            try:
                enriched_data = self._scrape_website_data(website_url)
                logger.info(f"Enriched brand data from website: {website_url}")
            except Exception as e:
                logger.error(f"Error scraping website data: {e}")
        
        # Merge provided guidelines with enriched data
        merged_guidelines = {**enriched_data.get("brand_guidelines", {}), **brand_guidelines}
        
        # TODO: Implement actual brand creation in database
        # For now, return a mock response with the enriched data
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="brand_onboarded",
                user_id=user_id,
                details={
                    "company_name": company_name,
                    "website_url": website_url
                }
            )
        
        return {
            "status": "success",
            "message": f"Brand {company_name} onboarded successfully",
            "brand_id": 123,  # Mock ID
            "brand_data": {
                "name": company_name,
                "website_url": website_url,
                "description": enriched_data.get("description", ""),
                "logo_url": enriched_data.get("logo_url"),
                "brand_guidelines": merged_guidelines
            }
        }
    
    def _scrape_website_data(self, url: str) -> Dict[str, Any]:
        """Scrape website to extract company information and brand elements."""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract basic information
            title = soup.title.string if soup.title else ""
            description = ""
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc:
                description = meta_desc.get("content", "")
            
            # Find logo
            logo_url = None
            logo_candidates = soup.find_all("img", {"src": re.compile(r"logo", re.I)})
            if logo_candidates:
                logo_src = logo_candidates[0].get("src", "")
                if logo_src.startswith("http"):
                    logo_url = logo_src
                else:
                    # Handle relative URLs
                    from urllib.parse import urljoin
                    logo_url = urljoin(url, logo_src)
            
            # Extract colors
            color_palette = []
            style_tags = soup.find_all("style")
            for style in style_tags:
                if style.string:
                    # Extract hex and rgb colors
                    hex_colors = re.findall(r"#(?:[0-9a-fA-F]{3}){1,2}", style.string)
                    rgb_colors = re.findall(r"rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)", style.string)
                    color_palette.extend(hex_colors)
                    color_palette.extend(rgb_colors)
            
            # Extract typography
            typography = {}
            font_families = re.findall(r"font-family:\s*([^;]+);", str(soup))
            if font_families:
                # Clean up and deduplicate
                fonts = []
                for font in font_families:
                    fonts.extend([f.strip().strip('\'"') for f in font.split(",")])
                typography["font_families"] = list(set(fonts))
            
            # Compile results
            result = {
                "description": description or title,
                "logo_url": logo_url,
                "brand_guidelines": {
                    "color_palette": list(set(color_palette))[:10],  # Limit to top 10 unique colors
                    "typography": typography
                }
            }
            
            return result
        except Exception as e:
            logger.error(f"Error scraping website {url}: {e}")
            return {}
    
    def _record_audit_trail(self, action: str, user_id: Any, details: Dict[str, Any]):
        """Record an audit trail entry."""
        # TODO: Implement actual audit trail recording in database
        logger.info(f"AUDIT: {action} by user {user_id} - {details}")
    
    def handle_update_brand(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle brand update process."""
        brand_id = task.get("brand_id")
        updates = task.get("updates", {})
        user_id = task.get("user_id")
        
        # Log the update attempt
        logger.info(f"Updating brand: {brand_id} by user {user_id}")
        
        # TODO: Implement actual brand update in database
        # For now, return a mock response
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="brand_updated",
                user_id=user_id,
                details={
                    "brand_id": brand_id,
                    "fields_updated": list(updates.keys())
                }
            )
        
        return {
            "status": "success",
            "message": f"Brand {brand_id} updated successfully",
            "brand_id": brand_id
        }
    
    def handle_get_brand_info(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request for brand information."""
        brand_id = task.get("brand_id")
        include_guidelines = task.get("include_guidelines", True)
        include_projects = task.get("include_projects", False)
        user_id = task.get("user_id")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_brand_access(brand_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        # TODO: Implement actual brand retrieval from database
        # For now, return a mock response
        
        brand_data = {
            "id": brand_id,
            "name": "Example Brand",
            "website_url": "https://example.com",
            "description": "An example brand for testing",
            "logo_url": "https://example.com/logo.png",
        }
        
        if include_guidelines:
            brand_data["guidelines"] = {
                "voice": "Professional and friendly",
                "tone": "Conversational",
                "color_palette": ["#1a73e8", "#34a853", "#fbbc04", "#ea4335"],
                "typography": {"font_families": ["Roboto", "Open Sans"]}
            }
        
        if include_projects:
            brand_data["projects"] = [
                {"id": 1, "name": "Email Campaign", "project_type": "Email"},
                {"id": 2, "name": "Website Redesign", "project_type": "Landing Page"}
            ]
        
        return {
            "status": "success",
            "brand": brand_data
        }
    
    def _check_brand_access(self, brand_id: Any, user_id: Any) -> bool:
        """Check if a user has access to a brand."""
        # TODO: Implement actual RBAC permission checking
        # For now, return True for all cases
        return True
    
    def handle_create_project(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle project creation process."""
        brand_id = task.get("brand_id")
        project_type_id = task.get("project_type_id")
        name = task.get("name")
        description = task.get("description", "")
        user_id = task.get("user_id")
        due_date = task.get("due_date")
        
        # Log the project creation attempt
        logger.info(f"Creating project: {name} for brand {brand_id} by user {user_id}")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_brand_access(brand_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        # TODO: Implement actual project creation in database
        # For now, return a mock response
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="project_created",
                user_id=user_id,
                details={
                    "brand_id": brand_id,
                    "project_name": name,
                    "project_type_id": project_type_id
                }
            )
        
        return {
            "status": "success",
            "message": f"Project {name} created successfully",
            "project_id": 456,  # Mock ID
            "project_data": {
                "name": name,
                "description": description,
                "brand_id": brand_id,
                "project_type_id": project_type_id,
                "status": "draft",
                "created_by": user_id,
                "due_date": due_date
            }
        }
    
    def handle_update_project(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle project update process."""
        project_id = task.get("project_id")
        updates = task.get("updates", {})
        user_id = task.get("user_id")
        
        # Log the update attempt
        logger.info(f"Updating project: {project_id} by user {user_id}")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_project_access(project_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        # TODO: Implement actual project update in database
        # For now, return a mock response
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="project_updated",
                user_id=user_id,
                details={
                    "project_id": project_id,
                    "fields_updated": list(updates.keys())
                }
            )
        
        return {
            "status": "success",
            "message": f"Project {project_id} updated successfully",
            "project_id": project_id
        }
    
    def _check_project_access(self, project_id: Any, user_id: Any) -> bool:
        """Check if a user has access to a project."""
        # TODO: Implement actual RBAC permission checking
        # For now, return True for all cases
        return True
    
    def handle_get_project_info(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request for project information."""
        project_id = task.get("project_id")
        include_content = task.get("include_content", False)
        user_id = task.get("user_id")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_project_access(project_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        # TODO: Implement actual project retrieval from database
        # For now, return a mock response
        
        project_data = {
            "id": project_id,
            "name": "Example Project",
            "description": "An example project for testing",
            "brand_id": 123,
            "project_type": "Email",
            "status": "in_progress",
            "created_by": 789,
            "assigned_to": 456,
            "due_date": "2025-04-15T00:00:00Z",
            "created_at": "2025-03-20T06:30:00Z",
            "updated_at": "2025-03-20T06:30:00Z"
        }
        
        if include_content:
            project_data["content_drafts"] = [
                {
                    "id": 1,
                    "version": 1,
                    "status": "draft",
                    "created_at": "2025-03-20T06:35:00Z"
                }
            ]
        
        return {
            "status": "success",
            "project": project_data
        }
    
    def handle_assign_project(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle project assignment to a user."""
        project_id = task.get("project_id")
        assigned_to = task.get("assigned_to")
        user_id = task.get("user_id")  # User performing the assignment
        
        # Log the assignment attempt
        logger.info(f"Assigning project: {project_id} to user {assigned_to} by user {user_id}")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_project_access(project_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        # TODO: Implement actual project assignment in database
        # For now, return a mock response
        
        # Record audit trail if enabled
        if self.enable_audit_trails:
            self._record_audit_trail(
                action="project_assigned",
                user_id=user_id,
                details={
                    "project_id": project_id,
                    "assigned_to": assigned_to
                }
            )
        
        # Notify the assigned user via an event
        self.broadcast_event({
            "event_type": "project_assigned",
            "project_id": project_id,
            "assigned_to": assigned_to,
            "assigned_by": user_id
        })
        
        return {
            "status": "success",
            "message": f"Project {project_id} assigned to user {assigned_to}",
            "project_id": project_id,
            "assigned_to": assigned_to
        }
    
    def handle_get_brand_projects(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request for all projects belonging to a brand."""
        brand_id = task.get("brand_id")
        filter_status = task.get("status")  # Optional status filter
        user_id = task.get("user_id")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_brand_access(brand_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        # TODO: Implement actual project retrieval from database
        # For now, return a mock response
        
        projects = [
            {
                "id": 1,
                "name": "Email Campaign",
                "project_type": "Email",
                "status": "draft",
                "due_date": "2025-04-10T00:00:00Z"
            },
            {
                "id": 2,
                "name": "Website Redesign",
                "project_type": "Landing Page",
                "status": "in_progress",
                "due_date": "2025-05-15T00:00:00Z"
            },
            {
                "id": 3,
                "name": "Social Media Campaign",
                "project_type": "Social Post",
                "status": "completed",
                "due_date": "2025-03-01T00:00:00Z"
            }
        ]
        
        # Apply status filter if provided
        if filter_status:
            projects = [p for p in projects if p["status"] == filter_status]
        
        return {
            "status": "success",
            "brand_id": brand_id,
            "projects": projects,
            "total": len(projects)
        }
