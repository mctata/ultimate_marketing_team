"""Mailchimp Integration Module.

This module provides integration with the Mailchimp email marketing platform,
supporting lists/audiences, campaigns, templates, and automation.
"""

import hashlib
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import requests

from src.agents.integrations.email_marketing.base import EmailMarketingIntegration, IntegrationError

logger = logging.getLogger(__name__)

class MailchimpIntegration(EmailMarketingIntegration):
    """Mailchimp email marketing integration using the Mailchimp API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the Mailchimp integration.
        
        Args:
            credentials: Mailchimp authentication credentials
        """
        super().__init__("mailchimp", credentials)
        # Mailchimp requires a data center suffix (us1, us2, etc.)
        self.data_center = self.data_center or "us1"
        self.api_url = f"https://{self.data_center}.api.mailchimp.com/3.0"
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for Mailchimp API calls."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        if self.api_key:
            headers["Authorization"] = f"apikey {self.api_key}"
        
        return headers
    
    def _get_subscriber_hash(self, email: str) -> str:
        """Get MD5 hash of lowercased email for Mailchimp API.
        
        Args:
            email: Email address to hash
            
        Returns:
            MD5 hash of the email address
        """
        return hashlib.md5(email.lower().encode()).hexdigest()
    
    def get_lists(self) -> Dict[str, Any]:
        """Get available Mailchimp lists/audiences.
        
        Returns:
            Dict containing lists with their details
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            response = requests.get(
                f"{self.api_url}/lists",
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                lists_data = response.json()
                
                # Format the response to normalize it across providers
                formatted_lists = []
                for list_item in lists_data.get("lists", []):
                    formatted_lists.append({
                        "id": list_item.get("id"),
                        "name": list_item.get("name"),
                        "member_count": list_item.get("stats", {}).get("member_count", 0),
                        "created_at": list_item.get("created_at"),
                        "updated_at": list_item.get("updated_at")
                    })
                
                return self.format_success_response(
                    lists=formatted_lists,
                    total_items=lists_data.get("total_items", 0)
                )
            else:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error retrieving Mailchimp lists"
        )
    
    def get_list_members(self, list_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get members of a specific Mailchimp list/audience.
        
        Args:
            list_id: ID of the list/audience
            params: Optional filtering parameters
            
        Returns:
            Dict containing list members with their details
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Build query parameters for filtering
            query_params = params or {}
            
            response = requests.get(
                f"{self.api_url}/lists/{list_id}/members",
                headers=self._get_headers(),
                params=query_params
            )
            
            if response.status_code == 200:
                members_data = response.json()
                
                # Format the response to normalize it across providers
                formatted_members = []
                for member in members_data.get("members", []):
                    formatted_members.append({
                        "id": member.get("id"),
                        "email": member.get("email_address"),
                        "status": member.get("status"),
                        "full_name": f"{member.get('merge_fields', {}).get('FNAME', '')} {member.get('merge_fields', {}).get('LNAME', '')}".strip(),
                        "created_at": member.get("timestamp_signup"),
                        "updated_at": member.get("last_changed")
                    })
                
                return self.format_success_response(
                    list_id=list_id,
                    members=formatted_members,
                    total_items=members_data.get("total_items", 0)
                )
            else:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error retrieving Mailchimp list members"
        )
    
    def add_list_member(self, list_id: str, member_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new member to a Mailchimp list/audience.
        
        Args:
            list_id: ID of the list/audience
            member_data: Member data including email and other fields
            
        Returns:
            Dict containing the result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Check for required email address
            email = member_data.get("email")
            if not email:
                return self.format_error_response("Email address is required")
            
            # Format data for Mailchimp API
            mailchimp_data = {
                "email_address": email,
                "status": member_data.get("status", "subscribed"),
                "merge_fields": {}
            }
            
            # Add merge fields (name, etc.)
            if "first_name" in member_data:
                mailchimp_data["merge_fields"]["FNAME"] = member_data["first_name"]
            
            if "last_name" in member_data:
                mailchimp_data["merge_fields"]["LNAME"] = member_data["last_name"]
            
            # Add any additional merge fields
            for field, value in member_data.get("merge_fields", {}).items():
                mailchimp_data["merge_fields"][field] = value
            
            # Add tags if provided
            if "tags" in member_data:
                mailchimp_data["tags"] = member_data["tags"]
            
            response = requests.post(
                f"{self.api_url}/lists/{list_id}/members",
                headers=self._get_headers(),
                json=mailchimp_data
            )
            
            if response.status_code in (200, 201):
                member_result = response.json()
                return self.format_success_response(
                    list_id=list_id,
                    member_id=member_result.get("id"),
                    email=member_result.get("email_address"),
                    status=member_result.get("status")
                )
            else:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error adding member to Mailchimp list"
        )
    
    def update_list_member(self, list_id: str, email: str, member_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing member in a Mailchimp list/audience.
        
        Args:
            list_id: ID of the list/audience
            email: Email address of the member to update
            member_data: Updated member data
            
        Returns:
            Dict containing the result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Get the subscriber hash for the email
            subscriber_hash = self._get_subscriber_hash(email)
            
            # Format data for Mailchimp API
            mailchimp_data = {}
            
            # Add status if provided
            if "status" in member_data:
                mailchimp_data["status"] = member_data["status"]
            
            # Add merge fields
            if any(key in member_data for key in ("first_name", "last_name")) or "merge_fields" in member_data:
                mailchimp_data["merge_fields"] = {}
                
                if "first_name" in member_data:
                    mailchimp_data["merge_fields"]["FNAME"] = member_data["first_name"]
                
                if "last_name" in member_data:
                    mailchimp_data["merge_fields"]["LNAME"] = member_data["last_name"]
                
                # Add any additional merge fields
                for field, value in member_data.get("merge_fields", {}).items():
                    mailchimp_data["merge_fields"][field] = value
            
            # Add tags if provided
            if "tags" in member_data:
                # Tags require a separate API call in Mailchimp
                tags_response = requests.post(
                    f"{self.api_url}/lists/{list_id}/members/{subscriber_hash}/tags",
                    headers=self._get_headers(),
                    json={
                        "tags": [{"name": tag, "status": "active"} for tag in member_data["tags"]]
                    }
                )
                
                if tags_response.status_code != 204:
                    logger.warning(f"Failed to update tags: {tags_response.status_code} - {tags_response.text}")
            
            response = requests.patch(
                f"{self.api_url}/lists/{list_id}/members/{subscriber_hash}",
                headers=self._get_headers(),
                json=mailchimp_data
            )
            
            if response.status_code == 200:
                member_result = response.json()
                return self.format_success_response(
                    list_id=list_id,
                    member_id=member_result.get("id"),
                    email=member_result.get("email_address"),
                    status=member_result.get("status")
                )
            else:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error updating member in Mailchimp list"
        )
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Mailchimp email campaign.
        
        Args:
            campaign_data: Campaign configuration data
            
        Returns:
            Dict containing the campaign result with ID
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Required fields for the campaign
            if "type" not in campaign_data:
                campaign_data["type"] = "regular"
            
            if "list_id" not in campaign_data:
                return self.format_error_response("list_id is required for creating a campaign")
            
            # Format data for Mailchimp API
            mailchimp_campaign = {
                "type": campaign_data["type"],
                "recipients": {
                    "list_id": campaign_data["list_id"]
                },
                "settings": {
                    "subject_line": campaign_data.get("subject_line", ""),
                    "title": campaign_data.get("title", campaign_data.get("subject_line", "New Campaign")),
                    "from_name": campaign_data.get("from_name", ""),
                    "reply_to": campaign_data.get("reply_to", "")
                }
            }
            
            # If segment is provided
            if "segment_id" in campaign_data:
                mailchimp_campaign["recipients"]["segment_opts"] = {
                    "saved_segment_id": campaign_data["segment_id"]
                }
            
            # Create the campaign
            response = requests.post(
                f"{self.api_url}/campaigns",
                headers=self._get_headers(),
                json=mailchimp_campaign
            )
            
            if response.status_code not in (200, 201):
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
            
            campaign_result = response.json()
            campaign_id = campaign_result.get("id")
            
            # If content is provided, set the campaign content
            if "content" in campaign_data:
                content_response = requests.put(
                    f"{self.api_url}/campaigns/{campaign_id}/content",
                    headers=self._get_headers(),
                    json={"html": campaign_data["content"]}
                )
                
                if content_response.status_code != 200:
                    return self.format_error_response(
                        f"Campaign created but content update failed: {content_response.status_code}",
                        content_response.text
                    )
            
            return self.format_success_response(
                campaign_id=campaign_id,
                web_id=campaign_result.get("web_id"),
                title=campaign_result.get("settings", {}).get("title"),
                status=campaign_result.get("status")
            )
                
        return self.safe_request(
            execute_request,
            "Error creating Mailchimp campaign"
        )
    
    def send_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Send an existing Mailchimp campaign.
        
        Args:
            campaign_id: ID of the campaign to send
            
        Returns:
            Dict containing the sending result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Check campaign before sending
            check_response = requests.get(
                f"{self.api_url}/campaigns/{campaign_id}",
                headers=self._get_headers()
            )
            
            if check_response.status_code != 200:
                raise IntegrationError(f"Campaign not found: {check_response.status_code} - {check_response.text}")
            
            campaign_data = check_response.json()
            if campaign_data.get("status") != "save":
                return self.format_error_response(
                    f"Campaign is not ready to send. Current status: {campaign_data.get('status')}"
                )
            
            # Send the campaign
            response = requests.post(
                f"{self.api_url}/campaigns/{campaign_id}/actions/send",
                headers=self._get_headers()
            )
            
            if response.status_code == 204:
                return self.format_success_response(
                    campaign_id=campaign_id,
                    status="sent",
                    sent_time=datetime.now().isoformat()
                )
            else:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error sending Mailchimp campaign"
        )
    
    def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Get performance metrics for a Mailchimp campaign.
        
        Args:
            campaign_id: ID of the campaign
            
        Returns:
            Dict containing performance metrics
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Get campaign report
            response = requests.get(
                f"{self.api_url}/reports/{campaign_id}",
                headers=self._get_headers()
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
            
            report_data = response.json()
            
            # Format performance data
            performance = {
                "campaign_id": campaign_id,
                "sends": report_data.get("emails_sent", 0),
                "opens": report_data.get("opens", {}).get("opens_total", 0),
                "unique_opens": report_data.get("opens", {}).get("unique_opens", 0),
                "open_rate": report_data.get("opens", {}).get("open_rate", 0),
                "clicks": report_data.get("clicks", {}).get("clicks_total", 0),
                "unique_clicks": report_data.get("clicks", {}).get("unique_clicks", 0),
                "click_rate": report_data.get("clicks", {}).get("click_rate", 0),
                "bounces": report_data.get("bounces", {}).get("hard_bounces", 0) + report_data.get("bounces", {}).get("soft_bounces", 0),
                "unsubscribes": report_data.get("unsubscribes", 0),
                "campaign_title": report_data.get("campaign_title", ""),
                "subject_line": report_data.get("subject_line", ""),
                "delivery_date": report_data.get("send_time", "")
            }
            
            return self.format_success_response(
                campaign_id=campaign_id,
                performance=performance
            )
                
        return self.safe_request(
            execute_request,
            "Error getting Mailchimp campaign performance"
        )
    
    def create_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new Mailchimp email template.
        
        Args:
            template_data: Template configuration data
            
        Returns:
            Dict containing the template result with ID
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Check required fields
            if "name" not in template_data:
                return self.format_error_response("Template name is required")
            
            if "html" not in template_data:
                return self.format_error_response("Template HTML is required")
            
            # Format data for Mailchimp API
            mailchimp_template = {
                "name": template_data["name"],
                "html": template_data["html"]
            }
            
            # Create the template
            response = requests.post(
                f"{self.api_url}/templates",
                headers=self._get_headers(),
                json=mailchimp_template
            )
            
            if response.status_code in (200, 201):
                template_result = response.json()
                return self.format_success_response(
                    template_id=template_result.get("id"),
                    name=template_result.get("name"),
                    type=template_result.get("type"),
                    created_at=template_result.get("date_created")
                )
            else:
                raise IntegrationError(f"Mailchimp API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error creating Mailchimp template"
        )
    
    def send_transactional_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send a transactional email through Mailchimp Transactional (Mandrill).
        
        Note: This requires a separate Mandrill API key.
        
        Args:
            email_data: Email configuration data
            
        Returns:
            Dict containing the sending result
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return credentials_check
        
        def execute_request():
            # Note: Mailchimp Transactional (formerly Mandrill) is a separate API
            # We're using their /messages/send-template API here
            mandrill_api_key = email_data.get("mandrill_api_key") or self.credentials.get("mandrill_api_key")
            if not mandrill_api_key:
                return self.format_error_response("Mandrill API key is required for transactional emails")
            
            # Required fields
            if "to" not in email_data:
                return self.format_error_response("Recipient(s) are required")
            
            if "subject" not in email_data:
                return self.format_error_response("Subject is required")
            
            if "from_email" not in email_data:
                return self.format_error_response("From email is required")
            
            # Check for either HTML content or template
            if "html" not in email_data and "template_id" not in email_data:
                return self.format_error_response("Either HTML content or template ID is required")
            
            # Format recipients
            recipients = []
            if isinstance(email_data["to"], list):
                for recipient in email_data["to"]:
                    if isinstance(recipient, str):
                        recipients.append({"email": recipient})
                    else:
                        recipients.append(recipient)
            else:
                recipients.append({"email": email_data["to"]})
            
            # Base message data
            message = {
                "subject": email_data["subject"],
                "from_email": email_data["from_email"],
                "from_name": email_data.get("from_name", ""),
                "to": recipients
            }
            
            # If we're using a template
            if "template_id" in email_data:
                mandrill_data = {
                    "key": mandrill_api_key,
                    "template_name": email_data["template_id"],
                    "template_content": email_data.get("template_content", []),
                    "message": message,
                    "async": email_data.get("async", False)
                }
                
                # Add merge variables if provided
                if "merge_vars" in email_data:
                    mandrill_data["message"]["merge_vars"] = email_data["merge_vars"]
                
                response = requests.post(
                    "https://mandrillapp.com/api/1.0/messages/send-template",
                    json=mandrill_data
                )
            else:
                # Direct HTML send
                message["html"] = email_data["html"]
                if "text" in email_data:
                    message["text"] = email_data["text"]
                
                mandrill_data = {
                    "key": mandrill_api_key,
                    "message": message,
                    "async": email_data.get("async", False)
                }
                
                response = requests.post(
                    "https://mandrillapp.com/api/1.0/messages/send",
                    json=mandrill_data
                )
            
            if response.status_code == 200:
                result = response.json()
                
                # Mandrill returns an array of results for each recipient
                sent_count = sum(1 for item in result if item.get("status") in ("sent", "queued", "scheduled"))
                rejected_count = sum(1 for item in result if item.get("status") == "rejected")
                
                return self.format_success_response(
                    sent=sent_count,
                    rejected=rejected_count,
                    total=len(result),
                    results=result
                )
            else:
                raise IntegrationError(f"Mandrill API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error sending transactional email"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check Mailchimp API health.
        
        Returns:
            Dict containing health status information
        """
        # Check required credentials
        credentials_check = self.check_credentials(['api_key'])
        if credentials_check:
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": "Missing API key",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            response, response_time = self.measure_response_time(
                requests.get,
                f"{self.api_url}/ping",
                headers=self._get_headers()
            )
            
            if response.status_code == 200:
                return {
                    "status": "healthy",
                    "platform": self.platform,
                    "response_time_ms": response_time,
                    "details": "API is responding normally",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "status": "unhealthy",
                    "platform": self.platform,
                    "response_time_ms": response_time,
                    "error": f"API Error: {response.status_code}",
                    "details": response.text,
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Error checking {self.platform} API health: {e}")
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": str(e),
                "details": f"Exception while checking API health",
                "timestamp": datetime.now().isoformat()
            }