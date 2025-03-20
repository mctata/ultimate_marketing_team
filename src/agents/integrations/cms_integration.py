"""CMS Integration Module for the Content & Ad Management Agent.

This module provides integrations with common CMS platforms including WordPress, 
Shopify, and other content management systems. It handles the publishing, scheduling,
and management of content on these platforms.
"""

import os
import json
import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime
import time

logger = logging.getLogger(__name__)

class CMSIntegration:
    """Base class for CMS integrations."""
    
    def __init__(self, platform: str, credentials: Dict[str, Any]):
        """Initialize the CMS integration.
        
        Args:
            platform: The CMS platform name
            credentials: Authentication credentials for the platform
        """
        self.platform = platform
        self.credentials = credentials
        self.base_url = credentials.get('site_url')
        self.api_key = credentials.get('api_key')
        self.api_secret = credentials.get('api_secret')
        self.username = credentials.get('username')
        self.password = credentials.get('password')
        
    def publish_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to the CMS platform.
        
        This is a base method that should be implemented by specific CMS integrations.
        
        Args:
            content_data: Formatted content data to be published
            
        Returns:
            Dict containing the publishing result with status and platform-specific details
        """
        raise NotImplementedError("Subclasses must implement publish_content")
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future publishing.
        
        Args:
            content_data: Formatted content data to be published
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing the scheduling result with status and platform-specific details
        """
        raise NotImplementedError("Subclasses must implement schedule_content")
    
    def update_content(self, content_id: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing content on the CMS platform.
        
        Args:
            content_id: Platform-specific ID of the content to update
            content_data: Updated content data
            
        Returns:
            Dict containing the update result with status and platform-specific details
        """
        raise NotImplementedError("Subclasses must implement update_content")
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get the status of published content.
        
        Args:
            content_id: Platform-specific ID of the content
            
        Returns:
            Dict containing content status information
        """
        raise NotImplementedError("Subclasses must implement get_content_status")
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete content from the CMS platform.
        
        Args:
            content_id: Platform-specific ID of the content to delete
            
        Returns:
            Dict containing the deletion result with status
        """
        raise NotImplementedError("Subclasses must implement delete_content")
        
    def check_health(self) -> Dict[str, Any]:
        """Check the health of the CMS integration.
        
        Returns:
            Dict containing health status information
        """
        raise NotImplementedError("Subclasses must implement check_health")


class WordPressIntegration(CMSIntegration):
    """WordPress CMS integration using the WordPress REST API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the WordPress integration.
        
        Args:
            credentials: WordPress authentication credentials
        """
        super().__init__("wordpress", credentials)
        self.api_url = f"{self.base_url}/wp-json/wp/v2"
        self.auth = None
        
        # Setup authentication
        if self.username and self.password:
            self.auth = (self.username, self.password)
        
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for WordPress API calls."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            
        return headers
    
    def publish_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish content to WordPress.
        
        Args:
            content_data: WordPress post data including title, content, etc.
            
        Returns:
            Dict containing publishing result with post ID and URL
        """
        try:
            wp_post = {
                "title": content_data.get("title", ""),
                "content": content_data.get("content", ""),
                "status": "publish",
                "excerpt": content_data.get("meta_description", ""),
                "categories": content_data.get("category_ids", []),
                "tags": content_data.get("tag_ids", []),
                "featured_media": content_data.get("featured_image_id"),
                "meta": {
                    "description": content_data.get("meta_description", ""),
                    "keywords": ",".join(content_data.get("keywords", []))
                }
            }
            
            # Add SEO data if using Yoast plugin
            if content_data.get("seo_title"):
                wp_post["yoast_meta"] = {
                    "yoast_wpseo_title": content_data["seo_title"],
                    "yoast_wpseo_metadesc": content_data.get("meta_description", ""),
                    "yoast_wpseo_focuskw": content_data.get("focus_keyword", "")
                }
            
            response = requests.post(
                f"{self.api_url}/posts",
                json=wp_post,
                headers=self._get_headers(),
                auth=self.auth
            )
            
            if response.status_code in (200, 201):
                post_data = response.json()
                return {
                    "status": "success",
                    "platform": "wordpress",
                    "platform_content_id": str(post_data["id"]),
                    "url": post_data["link"],
                    "publish_time": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "platform": "wordpress",
                    "error": f"WordPress API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error publishing to WordPress: {e}")
            return {
                "status": "error",
                "platform": "wordpress",
                "error": str(e),
                "details": "Exception while publishing to WordPress"
            }
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule content for future publishing on WordPress.
        
        Args:
            content_data: WordPress post data
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing scheduling result
        """
        try:
            wp_post = {
                "title": content_data.get("title", ""),
                "content": content_data.get("content", ""),
                "status": "future",
                "date": publish_time,  # WordPress expects ISO format
                "excerpt": content_data.get("meta_description", ""),
                "categories": content_data.get("category_ids", []),
                "tags": content_data.get("tag_ids", []),
                "featured_media": content_data.get("featured_image_id")
            }
            
            response = requests.post(
                f"{self.api_url}/posts",
                json=wp_post,
                headers=self._get_headers(),
                auth=self.auth
            )
            
            if response.status_code in (200, 201):
                post_data = response.json()
                return {
                    "status": "success",
                    "platform": "wordpress",
                    "platform_content_id": str(post_data["id"]),
                    "url": post_data["link"],
                    "scheduled_time": publish_time
                }
            else:
                return {
                    "status": "error",
                    "platform": "wordpress",
                    "error": f"WordPress API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error scheduling to WordPress: {e}")
            return {
                "status": "error",
                "platform": "wordpress",
                "error": str(e),
                "details": "Exception while scheduling to WordPress"
            }
    
    def update_content(self, content_id: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing WordPress post.
        
        Args:
            content_id: WordPress post ID
            content_data: Updated post data
            
        Returns:
            Dict containing update result
        """
        try:
            wp_post = {
                "title": content_data.get("title"),
                "content": content_data.get("content"),
                "excerpt": content_data.get("meta_description"),
                "categories": content_data.get("category_ids"),
                "tags": content_data.get("tag_ids"),
                "featured_media": content_data.get("featured_image_id")
            }
            
            # Remove None values
            wp_post = {k: v for k, v in wp_post.items() if v is not None}
            
            response = requests.post(
                f"{self.api_url}/posts/{content_id}",
                json=wp_post,
                headers=self._get_headers(),
                auth=self.auth
            )
            
            if response.status_code in (200, 201):
                post_data = response.json()
                return {
                    "status": "success",
                    "platform": "wordpress",
                    "platform_content_id": str(post_data["id"]),
                    "url": post_data["link"],
                    "updated_time": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "platform": "wordpress",
                    "error": f"WordPress API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error updating WordPress post: {e}")
            return {
                "status": "error",
                "platform": "wordpress",
                "error": str(e),
                "details": "Exception while updating WordPress post"
            }
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get WordPress post status.
        
        Args:
            content_id: WordPress post ID
            
        Returns:
            Dict containing post status information
        """
        try:
            response = requests.get(
                f"{self.api_url}/posts/{content_id}",
                headers=self._get_headers(),
                auth=self.auth
            )
            
            if response.status_code == 200:
                post_data = response.json()
                return {
                    "status": "success",
                    "platform": "wordpress",
                    "platform_content_id": str(post_data["id"]),
                    "url": post_data["link"],
                    "content_status": post_data["status"],
                    "published": post_data.get("date"),
                    "modified": post_data.get("modified")
                }
            else:
                return {
                    "status": "error",
                    "platform": "wordpress",
                    "error": f"WordPress API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting WordPress post status: {e}")
            return {
                "status": "error",
                "platform": "wordpress",
                "error": str(e),
                "details": "Exception while getting WordPress post status"
            }
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete WordPress post.
        
        Args:
            content_id: WordPress post ID
            
        Returns:
            Dict containing deletion result
        """
        try:
            response = requests.delete(
                f"{self.api_url}/posts/{content_id}",
                headers=self._get_headers(),
                auth=self.auth,
                params={"force": True}  # Permanently delete
            )
            
            if response.status_code in (200, 204):
                return {
                    "status": "success",
                    "platform": "wordpress",
                    "platform_content_id": content_id,
                    "message": "Post deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "wordpress",
                    "error": f"WordPress API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error deleting WordPress post: {e}")
            return {
                "status": "error",
                "platform": "wordpress",
                "error": str(e),
                "details": "Exception while deleting WordPress post"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check WordPress API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            response = requests.get(
                f"{self.api_url}",
                headers=self._get_headers(),
                auth=self.auth
            )
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": "wordpress",
                    "response_time_ms": response_time,
                    "details": "WordPress API is responding normally"
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": "wordpress",
                    "response_time_ms": response_time,
                    "error": f"WordPress API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking WordPress API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "wordpress",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking WordPress API health"
            }


class ShopifyIntegration(CMSIntegration):
    """Shopify CMS integration using the Shopify Admin API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Shopify integration.
        
        Args:
            credentials: Shopify authentication credentials
        """
        super().__init__("shopify", credentials)
        self.shop_url = self.base_url
        # Remove https:// if present
        if self.shop_url.startswith("https://"):
            self.shop_url = self.shop_url[8:]
        self.api_url = f"https://{self.api_key}:{self.api_secret}@{self.shop_url}/admin/api/2023-07"
    
    def publish_content(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Publish blog article to Shopify.
        
        Args:
            content_data: Blog article data
            
        Returns:
            Dict containing publishing result
        """
        try:
            # Shopify expects blog articles in a specific format
            shopify_article = {
                "article": {
                    "title": content_data.get("title", ""),
                    "body_html": content_data.get("content", ""),
                    "blog_id": content_data.get("blog_id"),
                    "author": content_data.get("author", ""),
                    "tags": ",".join(content_data.get("tags", [])),
                    "published": True,
                    "image": {
                        "src": content_data.get("featured_image", "")
                    } if content_data.get("featured_image") else None,
                    "seo": {
                        "title": content_data.get("seo_title", ""),
                        "description": content_data.get("meta_description", "")
                    }
                }
            }
            
            # Remove None values
            if shopify_article["article"]["image"] is None:
                del shopify_article["article"]["image"]
            
            blog_id = content_data.get("blog_id")
            if not blog_id:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": "Missing blog_id parameter"
                }
            
            response = requests.post(
                f"{self.api_url}/blogs/{blog_id}/articles.json",
                json=shopify_article,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in (200, 201):
                article_data = response.json()["article"]
                return {
                    "status": "success",
                    "platform": "shopify",
                    "platform_content_id": str(article_data["id"]),
                    "url": f"https://{self.shop_url}/blogs/{blog_id}/articles/{article_data['id']}",
                    "publish_time": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": f"Shopify API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error publishing to Shopify: {e}")
            return {
                "status": "error",
                "platform": "shopify",
                "error": str(e),
                "details": "Exception while publishing to Shopify"
            }
    
    def schedule_content(self, content_data: Dict[str, Any], publish_time: str) -> Dict[str, Any]:
        """Schedule blog article for future publishing on Shopify.
        
        Args:
            content_data: Blog article data
            publish_time: ISO format datetime for scheduled publishing
            
        Returns:
            Dict containing scheduling result
        """
        try:
            # Shopify expects blog articles in a specific format
            shopify_article = {
                "article": {
                    "title": content_data.get("title", ""),
                    "body_html": content_data.get("content", ""),
                    "blog_id": content_data.get("blog_id"),
                    "author": content_data.get("author", ""),
                    "tags": ",".join(content_data.get("tags", [])),
                    "published": False,
                    "published_at": publish_time,
                    "image": {
                        "src": content_data.get("featured_image", "")
                    } if content_data.get("featured_image") else None,
                    "seo": {
                        "title": content_data.get("seo_title", ""),
                        "description": content_data.get("meta_description", "")
                    }
                }
            }
            
            # Remove None values
            if shopify_article["article"]["image"] is None:
                del shopify_article["article"]["image"]
            
            blog_id = content_data.get("blog_id")
            if not blog_id:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": "Missing blog_id parameter"
                }
            
            response = requests.post(
                f"{self.api_url}/blogs/{blog_id}/articles.json",
                json=shopify_article,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in (200, 201):
                article_data = response.json()["article"]
                return {
                    "status": "success",
                    "platform": "shopify",
                    "platform_content_id": str(article_data["id"]),
                    "url": f"https://{self.shop_url}/blogs/{blog_id}/articles/{article_data['id']}",
                    "scheduled_time": publish_time
                }
            else:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": f"Shopify API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error scheduling to Shopify: {e}")
            return {
                "status": "error",
                "platform": "shopify",
                "error": str(e),
                "details": "Exception while scheduling to Shopify"
            }
    
    def update_content(self, content_id: str, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update existing Shopify blog article.
        
        Args:
            content_id: Shopify article ID
            content_data: Updated article data
            
        Returns:
            Dict containing update result
        """
        try:
            # Shopify expects blog articles in a specific format
            shopify_article = {
                "article": {
                    "id": content_id
                }
            }
            
            # Only include fields that need to be updated
            if "title" in content_data:
                shopify_article["article"]["title"] = content_data["title"]
            if "content" in content_data:
                shopify_article["article"]["body_html"] = content_data["content"]
            if "author" in content_data:
                shopify_article["article"]["author"] = content_data["author"]
            if "tags" in content_data:
                shopify_article["article"]["tags"] = ",".join(content_data["tags"])
            if "featured_image" in content_data:
                shopify_article["article"]["image"] = {
                    "src": content_data["featured_image"]
                }
            if "seo_title" in content_data or "meta_description" in content_data:
                shopify_article["article"]["seo"] = {}
                if "seo_title" in content_data:
                    shopify_article["article"]["seo"]["title"] = content_data["seo_title"]
                if "meta_description" in content_data:
                    shopify_article["article"]["seo"]["description"] = content_data["meta_description"]
            
            blog_id = content_data.get("blog_id")
            if not blog_id:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": "Missing blog_id parameter"
                }
            
            response = requests.put(
                f"{self.api_url}/blogs/{blog_id}/articles/{content_id}.json",
                json=shopify_article,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                article_data = response.json()["article"]
                return {
                    "status": "success",
                    "platform": "shopify",
                    "platform_content_id": str(article_data["id"]),
                    "url": f"https://{self.shop_url}/blogs/{blog_id}/articles/{article_data['id']}",
                    "updated_time": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": f"Shopify API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error updating Shopify article: {e}")
            return {
                "status": "error",
                "platform": "shopify",
                "error": str(e),
                "details": "Exception while updating Shopify article"
            }
    
    def get_content_status(self, content_id: str) -> Dict[str, Any]:
        """Get Shopify article status.
        
        Args:
            content_id: Shopify article ID
            
        Returns:
            Dict containing article status information
        """
        try:
            # Need blog ID for Shopify - this implementation requires it to be passed as part of content_id
            # Format expected: "blog_id:article_id"
            if ":" in content_id:
                blog_id, article_id = content_id.split(":")
            else:
                # Try to get blog ID from first blog
                response = requests.get(
                    f"{self.api_url}/blogs.json?limit=1",
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code != 200:
                    return {
                        "status": "error",
                        "platform": "shopify",
                        "error": "Missing blog ID and unable to fetch one"
                    }
                blog_id = response.json()["blogs"][0]["id"]
                article_id = content_id
            
            response = requests.get(
                f"{self.api_url}/blogs/{blog_id}/articles/{article_id}.json",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                article_data = response.json()["article"]
                return {
                    "status": "success",
                    "platform": "shopify",
                    "platform_content_id": str(article_data["id"]),
                    "url": f"https://{self.shop_url}/blogs/{blog_id}/articles/{article_data['id']}",
                    "content_status": "published" if article_data.get("published_at") else "draft",
                    "published": article_data.get("published_at"),
                    "modified": article_data.get("updated_at")
                }
            else:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": f"Shopify API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error getting Shopify article status: {e}")
            return {
                "status": "error",
                "platform": "shopify",
                "error": str(e),
                "details": "Exception while getting Shopify article status"
            }
    
    def delete_content(self, content_id: str) -> Dict[str, Any]:
        """Delete Shopify article.
        
        Args:
            content_id: Shopify article ID
            
        Returns:
            Dict containing deletion result
        """
        try:
            # Need blog ID for Shopify - this implementation requires it to be passed as part of content_id
            # Format expected: "blog_id:article_id"
            if ":" in content_id:
                blog_id, article_id = content_id.split(":")
            else:
                # Try to get blog ID from first blog
                response = requests.get(
                    f"{self.api_url}/blogs.json?limit=1",
                    headers={"Content-Type": "application/json"}
                )
                if response.status_code != 200:
                    return {
                        "status": "error",
                        "platform": "shopify",
                        "error": "Missing blog ID and unable to fetch one"
                    }
                blog_id = response.json()["blogs"][0]["id"]
                article_id = content_id
            
            response = requests.delete(
                f"{self.api_url}/blogs/{blog_id}/articles/{article_id}.json",
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code in (200, 204):
                return {
                    "status": "success",
                    "platform": "shopify",
                    "platform_content_id": article_id,
                    "message": "Article deleted successfully"
                }
            else:
                return {
                    "status": "error",
                    "platform": "shopify",
                    "error": f"Shopify API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            logger.error(f"Error deleting Shopify article: {e}")
            return {
                "status": "error",
                "platform": "shopify",
                "error": str(e),
                "details": "Exception while deleting Shopify article"
            }
    
    def check_health(self) -> Dict[str, Any]:
        """Check Shopify API health.
        
        Returns:
            Dict containing health status information
        """
        start_time = time.time()
        try:
            response = requests.get(
                f"{self.api_url}/shop.json",
                headers={"Content-Type": "application/json"}
            )
            
            response_time = int((time.time() - start_time) * 1000)  # ms
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": "shopify",
                    "response_time_ms": response_time,
                    "details": "Shopify API is responding normally"
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": "shopify",
                    "response_time_ms": response_time,
                    "error": f"Shopify API Error: {response.status_code}",
                    "details": response.text
                }
                
        except Exception as e:
            response_time = int((time.time() - start_time) * 1000)  # ms
            logger.error(f"Error checking Shopify API health: {e}")
            return {
                "status": "unhealthy",
                "platform": "shopify",
                "response_time_ms": response_time,
                "error": str(e),
                "details": "Exception while checking Shopify API health"
            }


class CMSIntegrationFactory:
    """Factory for creating CMS integrations based on platform name."""
    
    @staticmethod
    def get_integration(platform: str, credentials: Dict[str, Any]) -> CMSIntegration:
        """Get an appropriate CMS integration based on the platform name.
        
        Args:
            platform: The CMS platform name (wordpress, shopify, etc.)
            credentials: Authentication credentials for the platform
            
        Returns:
            An instance of a CMSIntegration subclass
            
        Raises:
            ValueError: If the platform is unsupported
        """
        platform = platform.lower()
        
        if platform == "wordpress":
            return WordPressIntegration(credentials)
        elif platform == "shopify":
            return ShopifyIntegration(credentials)
        else:
            raise ValueError(f"Unsupported CMS platform: {platform}")