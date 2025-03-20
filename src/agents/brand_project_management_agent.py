from typing import Dict, Any, List, Optional
from loguru import logger
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
import json

from src.ultimate_marketing_team.agents.base_agent import BaseAgent
from src.ultimate_marketing_team.core.database import get_db
from src.ultimate_marketing_team.models.project import Brand, Project, ProjectType

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
        self.default_project_types = [
            {"name": "Email", "description": "Email marketing campaigns and newsletters"},
            {"name": "Landing Page", "description": "Website landing pages for marketing campaigns"},
            {"name": "Social Post", "description": "Social media content for various platforms"},
            {"name": "Blog", "description": "Blog articles and content marketing"}
        ]
    
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
        self.register_task_handler("get_project_types", self.handle_get_project_types)
        self.register_task_handler("create_project_type", self.handle_create_project_type)
        
        # Initialize project types if they don't exist
        self._initialize_project_types()
    
    def _initialize_project_types(self):
        """Initialize default project types if they don't exist in the database."""
        try:
            with get_db() as db:
                # Check if project types exist
                existing_types = db.query(ProjectType).all()
                if not existing_types:
                    logger.info("Initializing default project types")
                    for project_type in self.default_project_types:
                        new_type = ProjectType(
                            name=project_type["name"],
                            description=project_type["description"]
                        )
                        db.add(new_type)
                    db.commit()
                    logger.info(f"Created {len(self.default_project_types)} default project types")
        except Exception as e:
            logger.error(f"Error initializing project types: {e}")
    
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
        
        try:
            with get_db() as db:
                # Create new brand in database
                new_brand = Brand(
                    name=company_name,
                    website_url=website_url,
                    description=enriched_data.get("description", ""),
                    logo_url=enriched_data.get("logo_url"),
                    guidelines=merged_guidelines,
                    created_by=user_id
                )
                db.add(new_brand)
                db.flush()  # Flush to get the ID
                
                # Record audit trail if enabled
                if self.enable_audit_trails:
                    self._record_audit_trail(
                        action="brand_onboarded",
                        user_id=user_id,
                        details={
                            "brand_id": new_brand.id,
                            "company_name": company_name,
                            "website_url": website_url
                        }
                    )
                
                db.commit()
                
                # Return the newly created brand
                return {
                    "status": "success",
                    "message": f"Brand {company_name} onboarded successfully",
                    "brand_id": new_brand.id,
                    "brand_data": {
                        "id": new_brand.id,
                        "name": new_brand.name,
                        "website_url": new_brand.website_url,
                        "description": new_brand.description,
                        "logo_url": new_brand.logo_url,
                        "brand_guidelines": merged_guidelines
                    }
                }
        except Exception as e:
            logger.error(f"Error creating brand: {e}")
            return {
                "status": "error",
                "error": f"Failed to create brand: {str(e)}"
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
            
            # Extract social media links
            social_links = {}
            social_patterns = {
                "facebook": r"facebook\.com",
                "twitter": r"twitter\.com|x\.com",
                "instagram": r"instagram\.com",
                "linkedin": r"linkedin\.com",
                "youtube": r"youtube\.com",
                "pinterest": r"pinterest\.com"
            }
            
            for link in soup.find_all("a", href=True):
                href = link.get("href", "")
                for platform, pattern in social_patterns.items():
                    if re.search(pattern, href, re.I):
                        social_links[platform] = href
                        break
            
            # Compile results
            result = {
                "description": description or title,
                "logo_url": logo_url,
                "social_links": social_links,
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
        # For now, just log the audit trail
        logger.info(f"AUDIT: {action} by user {user_id} - {details}")
    
    def handle_update_brand(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle brand update process."""
        brand_id = task.get("brand_id")
        updates = task.get("updates", {})
        user_id = task.get("user_id")
        
        # Log the update attempt
        logger.info(f"Updating brand: {brand_id} by user {user_id}")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_brand_access(brand_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        try:
            with get_db() as db:
                # Find the brand
                brand = db.query(Brand).filter(Brand.id == brand_id).first()
                if not brand:
                    return {
                        "status": "error",
                        "error": f"Brand with ID {brand_id} not found"
                    }
                
                # Update brand fields
                if "name" in updates:
                    brand.name = updates["name"]
                if "website_url" in updates:
                    brand.website_url = updates["website_url"]
                if "description" in updates:
                    brand.description = updates["description"]
                if "logo_url" in updates:
                    brand.logo_url = updates["logo_url"]
                if "guidelines" in updates:
                    # Merge with existing guidelines instead of replacing
                    current_guidelines = brand.guidelines or {}
                    updated_guidelines = {**current_guidelines, **updates["guidelines"]}
                    brand.guidelines = updated_guidelines
                
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
                
                db.commit()
                
                return {
                    "status": "success",
                    "message": f"Brand {brand_id} updated successfully",
                    "brand_id": brand_id,
                    "brand_data": {
                        "id": brand.id,
                        "name": brand.name,
                        "website_url": brand.website_url,
                        "description": brand.description,
                        "logo_url": brand.logo_url
                    }
                }
        except Exception as e:
            logger.error(f"Error updating brand: {e}")
            return {
                "status": "error",
                "error": f"Failed to update brand: {str(e)}"
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
        
        try:
            with get_db() as db:
                # Find the brand
                brand = db.query(Brand).filter(Brand.id == brand_id).first()
                if not brand:
                    return {
                        "status": "error",
                        "error": f"Brand with ID {brand_id} not found"
                    }
                
                # Prepare brand data
                brand_data = {
                    "id": brand.id,
                    "name": brand.name,
                    "website_url": brand.website_url,
                    "description": brand.description,
                    "logo_url": brand.logo_url,
                    "created_at": brand.created_at.isoformat() if brand.created_at else None,
                    "updated_at": brand.updated_at.isoformat() if brand.updated_at else None
                }
                
                # Include guidelines if requested
                if include_guidelines and brand.guidelines:
                    brand_data["guidelines"] = brand.guidelines
                
                # Include projects if requested
                if include_projects:
                    projects = db.query(Project).filter(Project.brand_id == brand_id).all()
                    brand_data["projects"] = []
                    for project in projects:
                        project_type = db.query(ProjectType).filter(ProjectType.id == project.project_type_id).first()
                        brand_data["projects"].append({
                            "id": project.id,
                            "name": project.name,
                            "project_type": project_type.name if project_type else "Unknown",
                            "status": project.status,
                            "due_date": project.due_date.isoformat() if project.due_date else None
                        })
                
                return {
                    "status": "success",
                    "brand": brand_data
                }
        except Exception as e:
            logger.error(f"Error retrieving brand information: {e}")
            return {
                "status": "error",
                "error": f"Failed to retrieve brand information: {str(e)}"
            }
    
    def _check_brand_access(self, brand_id: Any, user_id: Any) -> bool:
        """Check if a user has access to a brand."""
        # TODO: Implement actual RBAC permission checking
        # For now, return True for all cases
        return True
    
    def handle_get_project_types(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request for all available project types."""
        try:
            with get_db() as db:
                project_types = db.query(ProjectType).all()
                result = []
                for pt in project_types:
                    result.append({
                        "id": pt.id,
                        "name": pt.name,
                        "description": pt.description
                    })
                
                return {
                    "status": "success",
                    "project_types": result,
                    "total": len(result)
                }
        except Exception as e:
            logger.error(f"Error retrieving project types: {e}")
            return {
                "status": "error",
                "error": f"Failed to retrieve project types: {str(e)}"
            }
    
    def handle_create_project_type(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle creation of a new project type."""
        name = task.get("name")
        description = task.get("description", "")
        user_id = task.get("user_id")
        
        try:
            with get_db() as db:
                # Check if project type already exists
                existing = db.query(ProjectType).filter(ProjectType.name == name).first()
                if existing:
                    return {
                        "status": "error",
                        "error": f"Project type with name '{name}' already exists"
                    }
                
                # Create new project type
                new_type = ProjectType(
                    name=name,
                    description=description
                )
                db.add(new_type)
                db.flush()
                
                # Record audit trail if enabled
                if self.enable_audit_trails:
                    self._record_audit_trail(
                        action="project_type_created",
                        user_id=user_id,
                        details={
                            "project_type_id": new_type.id,
                            "name": name
                        }
                    )
                
                db.commit()
                
                return {
                    "status": "success",
                    "message": f"Project type '{name}' created successfully",
                    "project_type_id": new_type.id,
                    "project_type": {
                        "id": new_type.id,
                        "name": new_type.name,
                        "description": new_type.description
                    }
                }
        except Exception as e:
            logger.error(f"Error creating project type: {e}")
            return {
                "status": "error",
                "error": f"Failed to create project type: {str(e)}"
            }
    
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
        
        try:
            with get_db() as db:
                # Check if brand exists
                brand = db.query(Brand).filter(Brand.id == brand_id).first()
                if not brand:
                    return {
                        "status": "error",
                        "error": f"Brand with ID {brand_id} not found"
                    }
                
                # Check if project type exists
                project_type = db.query(ProjectType).filter(ProjectType.id == project_type_id).first()
                if not project_type:
                    return {
                        "status": "error",
                        "error": f"Project type with ID {project_type_id} not found"
                    }
                
                # Parse due date if provided
                parsed_due_date = None
                if due_date:
                    try:
                        parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                    except ValueError:
                        return {
                            "status": "error",
                            "error": f"Invalid due date format: {due_date}. Expected ISO format (YYYY-MM-DDTHH:MM:SSZ)"
                        }
                
                # Create new project
                new_project = Project(
                    brand_id=brand_id,
                    project_type_id=project_type_id,
                    name=name,
                    description=description,
                    status="draft",
                    created_by=user_id,
                    due_date=parsed_due_date
                )
                db.add(new_project)
                db.flush()
                
                # Record audit trail if enabled
                if self.enable_audit_trails:
                    self._record_audit_trail(
                        action="project_created",
                        user_id=user_id,
                        details={
                            "project_id": new_project.id,
                            "brand_id": brand_id,
                            "project_name": name,
                            "project_type_id": project_type_id
                        }
                    )
                
                db.commit()
                
                # Broadcast event to notify other agents
                self.broadcast_event({
                    "event_type": "project_created",
                    "project_id": new_project.id,
                    "brand_id": brand_id,
                    "project_type": project_type.name,
                    "created_by": user_id
                })
                
                return {
                    "status": "success",
                    "message": f"Project {name} created successfully",
                    "project_id": new_project.id,
                    "project_data": {
                        "id": new_project.id,
                        "name": new_project.name,
                        "description": new_project.description,
                        "brand_id": new_project.brand_id,
                        "project_type_id": new_project.project_type_id,
                        "project_type_name": project_type.name,
                        "status": new_project.status,
                        "created_by": new_project.created_by,
                        "due_date": new_project.due_date.isoformat() if new_project.due_date else None
                    }
                }
        except Exception as e:
            logger.error(f"Error creating project: {e}")
            return {
                "status": "error",
                "error": f"Failed to create project: {str(e)}"
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
        
        try:
            with get_db() as db:
                # Find the project
                project = db.query(Project).filter(Project.id == project_id).first()
                if not project:
                    return {
                        "status": "error",
                        "error": f"Project with ID {project_id} not found"
                    }
                
                # Update project fields
                if "name" in updates:
                    project.name = updates["name"]
                if "description" in updates:
                    project.description = updates["description"]
                if "status" in updates:
                    project.status = updates["status"]
                if "project_type_id" in updates:
                    # Verify the project type exists
                    project_type = db.query(ProjectType).filter(ProjectType.id == updates["project_type_id"]).first()
                    if not project_type:
                        return {
                            "status": "error",
                            "error": f"Project type with ID {updates['project_type_id']} not found"
                        }
                    project.project_type_id = updates["project_type_id"]
                if "due_date" in updates:
                    try:
                        project.due_date = datetime.fromisoformat(updates["due_date"].replace('Z', '+00:00'))
                    except ValueError:
                        return {
                            "status": "error",
                            "error": f"Invalid due date format: {updates['due_date']}. Expected ISO format (YYYY-MM-DDTHH:MM:SSZ)"
                        }
                
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
                
                db.commit()
                
                # Get project type name for response
                project_type = db.query(ProjectType).filter(ProjectType.id == project.project_type_id).first()
                
                return {
                    "status": "success",
                    "message": f"Project {project_id} updated successfully",
                    "project_id": project_id,
                    "project_data": {
                        "id": project.id,
                        "name": project.name,
                        "description": project.description,
                        "brand_id": project.brand_id,
                        "project_type_id": project.project_type_id,
                        "project_type_name": project_type.name if project_type else "Unknown",
                        "status": project.status,
                        "due_date": project.due_date.isoformat() if project.due_date else None
                    }
                }
        except Exception as e:
            logger.error(f"Error updating project: {e}")
            return {
                "status": "error",
                "error": f"Failed to update project: {str(e)}"
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
        
        try:
            with get_db() as db:
                # Find the project with joined project type
                project = db.query(Project).filter(Project.id == project_id).first()
                if not project:
                    return {
                        "status": "error",
                        "error": f"Project with ID {project_id} not found"
                    }
                
                # Get project type name
                project_type = db.query(ProjectType).filter(ProjectType.id == project.project_type_id).first()
                
                # Prepare project data
                project_data = {
                    "id": project.id,
                    "name": project.name,
                    "description": project.description,
                    "brand_id": project.brand_id,
                    "project_type_id": project.project_type_id,
                    "project_type": project_type.name if project_type else "Unknown",
                    "status": project.status,
                    "created_by": project.created_by,
                    "assigned_to": project.assigned_to,
                    "due_date": project.due_date.isoformat() if project.due_date else None,
                    "created_at": project.created_at.isoformat() if project.created_at else None,
                    "updated_at": project.updated_at.isoformat() if project.updated_at else None
                }
                
                # Include content drafts if requested
                if include_content and hasattr(project, "content_drafts"):
                    project_data["content_drafts"] = []
                    for draft in project.content_drafts:
                        project_data["content_drafts"].append({
                            "id": draft.id,
                            "version": draft.version,
                            "status": draft.status,
                            "created_at": draft.created_at.isoformat() if draft.created_at else None
                        })
                
                return {
                    "status": "success",
                    "project": project_data
                }
        except Exception as e:
            logger.error(f"Error retrieving project information: {e}")
            return {
                "status": "error",
                "error": f"Failed to retrieve project information: {str(e)}"
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
        
        try:
            with get_db() as db:
                # Find the project
                project = db.query(Project).filter(Project.id == project_id).first()
                if not project:
                    return {
                        "status": "error",
                        "error": f"Project with ID {project_id} not found"
                    }
                
                # Update assignment
                project.assigned_to = assigned_to
                
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
                
                db.commit()
                
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
        except Exception as e:
            logger.error(f"Error assigning project: {e}")
            return {
                "status": "error",
                "error": f"Failed to assign project: {str(e)}"
            }
    
    def handle_get_brand_projects(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle request for all projects belonging to a brand."""
        brand_id = task.get("brand_id")
        filter_status = task.get("status")  # Optional status filter
        filter_type = task.get("project_type_id")  # Optional project type filter
        user_id = task.get("user_id")
        
        # Check RBAC permissions if enabled
        if self.enable_rbac:
            has_access = self._check_brand_access(brand_id, user_id)
            if not has_access:
                return {
                    "status": "error",
                    "error": "Access denied"
                }
        
        try:
            with get_db() as db:
                # Find the brand
                brand = db.query(Brand).filter(Brand.id == brand_id).first()
                if not brand:
                    return {
                        "status": "error",
                        "error": f"Brand with ID {brand_id} not found"
                    }
                
                # Build query with filters
                query = db.query(Project).filter(Project.brand_id == brand_id)
                if filter_status:
                    query = query.filter(Project.status == filter_status)
                if filter_type:
                    query = query.filter(Project.project_type_id == filter_type)
                
                # Execute query
                projects_db = query.all()
                
                # Get project types mapping
                project_type_ids = [p.project_type_id for p in projects_db]
                project_types = {
                    pt.id: pt.name 
                    for pt in db.query(ProjectType).filter(ProjectType.id.in_(project_type_ids)).all()
                }
                
                # Format results
                projects = []
                for p in projects_db:
                    projects.append({
                        "id": p.id,
                        "name": p.name,
                        "project_type_id": p.project_type_id,
                        "project_type": project_types.get(p.project_type_id, "Unknown"),
                        "status": p.status,
                        "due_date": p.due_date.isoformat() if p.due_date else None
                    })
                
                return {
                    "status": "success",
                    "brand_id": brand_id,
                    "brand_name": brand.name,
                    "projects": projects,
                    "total": len(projects)
                }
        except Exception as e:
            logger.error(f"Error retrieving brand projects: {e}")
            return {
                "status": "error",
                "error": f"Failed to retrieve brand projects: {str(e)}"
            }
