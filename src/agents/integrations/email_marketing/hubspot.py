"""HubSpot Integration Module.

This module provides integration with the HubSpot marketing platform,
supporting contacts, lists, email campaigns, and automation.
"""

import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import requests

from src.agents.integrations.email_marketing.base import EmailMarketingIntegration, IntegrationError

logger = logging.getLogger(__name__)

class HubSpotIntegration(EmailMarketingIntegration):
    """HubSpot email marketing integration using the HubSpot API."""
    
    def __init__(self, credentials: Dict[str, Any]):
        """Initialize the HubSpot integration.
        
        Args:
            credentials: HubSpot authentication credentials
        """
        super().__init__("hubspot", credentials)
        self.api_url = "https://api.hubapi.com"
    
    def _get_headers(self) -> Dict[str, str]:
        """Get request headers for HubSpot API calls."""
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        # Use API key or access token based on what's available
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            # The hapikey parameter is officially deprecated, but still working
            # In newer code, API key should be passed as a query parameter
            headers["Authorization"] = f"Bearer {self.api_key}"
        
        return headers
    
    def _get_api_key_param(self) -> Dict[str, str]:
        """Get API key parameter for HubSpot API calls."""
        if self.api_key and not self.access_token:
            return {"hapikey": self.api_key}
        return {}
    
    def _refresh_token_if_needed(self) -> None:
        """Refresh the access token if it's expired and we have a refresh token."""
        if not self.access_token or not self.refresh_token:
            return
        
        # Check if token is expired
        # Simplified implementation - in production, you would check expiry time
        # For now, we assume the token is valid if it exists
        # Add actual token expiry checking using the token_expires_at field
        
        # If token is expired, refresh it
        # client_id and client_secret would be needed for refreshing
        # This is a simplified implementation
    
    def get_lists(self) -> Dict[str, Any]:
        """Get available HubSpot lists.
        
        Returns:
            Dict containing lists with their details
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            response = requests.get(
                f"{self.api_url}/contacts/v1/lists",
                headers=self._get_headers(),
                params=self._get_api_key_param()
            )
            
            if response.status_code == 200:
                lists_data = response.json()
                
                # Format the response to normalize it across providers
                formatted_lists = []
                for list_item in lists_data.get("lists", []):
                    formatted_lists.append({
                        "id": list_item.get("listId"),
                        "name": list_item.get("name"),
                        "member_count": list_item.get("metaData", {}).get("size", 0),
                        "created_at": list_item.get("createDate"),
                        "updated_at": list_item.get("lastUpdatedAt"),
                        "dynamic": list_item.get("dynamic", False)
                    })
                
                return self.format_success_response(
                    lists=formatted_lists,
                    total_items=len(formatted_lists)
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error retrieving HubSpot lists"
        )
    
    def get_list_members(self, list_id: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get members of a specific HubSpot list.
        
        Args:
            list_id: ID of the list
            params: Optional filtering parameters
            
        Returns:
            Dict containing list members with their details
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # Default parameters
            query_params = {
                "count": 20,
                "vidOffset": 0
            }
            
            # Update with any provided parameters
            if params:
                query_params.update(params)
                
            # Add API key if needed
            query_params.update(self._get_api_key_param())
            
            response = requests.get(
                f"{self.api_url}/contacts/v1/lists/{list_id}/contacts/all",
                headers=self._get_headers(),
                params=query_params
            )
            
            if response.status_code == 200:
                members_data = response.json()
                
                # Format the response to normalize it across providers
                formatted_members = []
                for contact in members_data.get("contacts", []):
                    properties = contact.get("properties", {})
                    email = contact.get("identity", {}).get("primary-email", "")
                    
                    formatted_members.append({
                        "id": contact.get("vid"),
                        "email": email,
                        "status": "subscribed",  # HubSpot doesn't have this concept in the same way
                        "full_name": f"{properties.get('firstname', {}).get('value', '')} {properties.get('lastname', {}).get('value', '')}".strip(),
                        "created_at": properties.get("createdate", {}).get("value"),
                        "updated_at": contact.get("properties", {}).get("lastmodifieddate", {}).get("value")
                    })
                
                return self.format_success_response(
                    list_id=list_id,
                    members=formatted_members,
                    has_more=members_data.get("has-more", False),
                    total_items=members_data.get("total", 0)
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error retrieving HubSpot list members"
        )
    
    def add_list_member(self, list_id: str, member_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new member to a HubSpot list.
        
        Args:
            list_id: ID of the list
            member_data: Member data including email and other fields
            
        Returns:
            Dict containing the result
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # Check for required email address
            email = member_data.get("email")
            if not email:
                return self.format_error_response("Email address is required")
            
            # First, we need to upsert the contact
            properties = []
            
            # Add basic properties
            properties.append({"property": "email", "value": email})
            
            if "first_name" in member_data:
                properties.append({"property": "firstname", "value": member_data["first_name"]})
            
            if "last_name" in member_data:
                properties.append({"property": "lastname", "value": member_data["last_name"]})
            
            # Add any additional properties
            for prop, value in member_data.get("properties", {}).items():
                properties.append({"property": prop, "value": value})
            
            contact_data = {
                "properties": properties
            }
            
            # Create or update the contact
            contact_response = requests.post(
                f"{self.api_url}/contacts/v1/contact/createOrUpdate/email/{email}",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json=contact_data
            )
            
            if contact_response.status_code not in (200, 201, 204):
                raise IntegrationError(f"HubSpot API Error: {contact_response.status_code} - {contact_response.text}")
            
            # Get the contact ID (vid)
            vid = contact_response.json().get("vid")
            
            # Now add the contact to the list
            add_response = requests.post(
                f"{self.api_url}/contacts/v1/lists/{list_id}/add",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json={
                    "vids": [vid]
                }
            )
            
            if add_response.status_code in (200, 204):
                return self.format_success_response(
                    list_id=list_id,
                    member_id=vid,
                    email=email
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {add_response.status_code} - {add_response.text}")
                
        return self.safe_request(
            execute_request,
            "Error adding member to HubSpot list"
        )
    
    def update_list_member(self, list_id: str, email: str, member_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing member in a HubSpot list.
        
        Args:
            list_id: ID of the list
            email: Email address of the member to update
            member_data: Updated member data
            
        Returns:
            Dict containing the result
        """
        # For HubSpot, this is essentially the same as adding a member since we use createOrUpdate
        # The only difference is we don't need to add to the list again if the contact already exists
        # But we'll update the properties
        
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # Format properties
            properties = []
            
            if "first_name" in member_data:
                properties.append({"property": "firstname", "value": member_data["first_name"]})
            
            if "last_name" in member_data:
                properties.append({"property": "lastname", "value": member_data["last_name"]})
            
            # Add any additional properties
            for prop, value in member_data.get("properties", {}).items():
                properties.append({"property": prop, "value": value})
            
            # If no properties to update, just return success
            if not properties:
                return self.format_success_response(
                    list_id=list_id,
                    email=email,
                    message="No properties to update"
                )
            
            contact_data = {
                "properties": properties
            }
            
            # Update the contact
            response = requests.post(
                f"{self.api_url}/contacts/v1/contact/email/{email}/profile",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json=contact_data
            )
            
            if response.status_code in (200, 201, 204):
                # Get the vid if available in the response
                vid = None
                if response.text:
                    try:
                        response_data = response.json()
                        vid = response_data.get("vid")
                    except:
                        pass
                
                return self.format_success_response(
                    list_id=list_id,
                    member_id=vid,
                    email=email
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error updating member in HubSpot list"
        )
    
    def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new HubSpot email campaign.
        
        Args:
            campaign_data: Campaign configuration data
            
        Returns:
            Dict containing the campaign result with ID
        """
        # HubSpot's API for creating email campaigns is more complex
        # This is a simplified implementation
        
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # Required fields
            if "name" not in campaign_data:
                return self.format_error_response("Campaign name is required")
            
            if "subject" not in campaign_data:
                return self.format_error_response("Campaign subject is required")
            
            # Create the email campaign
            # For HubSpot, we need to create an email first
            email_data = {
                "name": campaign_data["name"],
                "subject": campaign_data["subject"],
                "fromName": campaign_data.get("from_name", ""),
                "fromEmail": campaign_data.get("from_email", ""),
                "replyTo": campaign_data.get("reply_to", campaign_data.get("from_email", "")),
                "emailBody": campaign_data.get("content", "")
            }
            
            # If using a template
            if "template_id" in campaign_data:
                email_data["templateId"] = campaign_data["template_id"]
            
            # Create the email
            email_response = requests.post(
                f"{self.api_url}/marketing-emails/v1/emails",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json=email_data
            )
            
            if email_response.status_code not in (200, 201):
                raise IntegrationError(f"HubSpot API Error: {email_response.status_code} - {email_response.text}")
            
            email_result = email_response.json()
            email_id = email_result.get("id")
            
            # For a full implementation, you would also need to:
            # 1. Set up the campaign settings
            # 2. Add the email to the campaign
            # 3. Set up list segmentation
            
            # This is a simplified return
            return self.format_success_response(
                campaign_id=email_id,
                name=email_result.get("name"),
                subject=email_result.get("subject"),
                status=email_result.get("state", "DRAFT")
            )
                
        return self.safe_request(
            execute_request,
            "Error creating HubSpot campaign"
        )
    
    def send_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Send an existing HubSpot email campaign.
        
        Args:
            campaign_id: ID of the campaign to send
            
        Returns:
            Dict containing the sending result
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # For HubSpot, sending a campaign involves multiple steps
            # 1. Set the campaign to "ready"
            # 2. Schedule or send the campaign
            
            # First, ensure the campaign is ready to send
            ready_response = requests.post(
                f"{self.api_url}/marketing-emails/v1/emails/{campaign_id}/send-test",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json={"emailId": campaign_id}
            )
            
            if ready_response.status_code not in (200, 201, 204):
                raise IntegrationError(f"HubSpot API Error: {ready_response.status_code} - {ready_response.text}")
            
            # Now send the campaign
            # This is typically done through the Calendar API in HubSpot
            # For simplicity, we're using a direct send method here
            send_response = requests.post(
                f"{self.api_url}/marketing-emails/v1/emails/{campaign_id}/send",
                headers=self._get_headers(),
                params=self._get_api_key_param()
            )
            
            if send_response.status_code in (200, 201, 204):
                return self.format_success_response(
                    campaign_id=campaign_id,
                    status="SENT",
                    sent_time=datetime.now().isoformat()
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {send_response.status_code} - {send_response.text}")
                
        return self.safe_request(
            execute_request,
            "Error sending HubSpot campaign"
        )
    
    def get_campaign_performance(self, campaign_id: str) -> Dict[str, Any]:
        """Get performance metrics for a HubSpot campaign.
        
        Args:
            campaign_id: ID of the campaign
            
        Returns:
            Dict containing performance metrics
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # Get email stats
            response = requests.get(
                f"{self.api_url}/marketing-emails/v1/emails/{campaign_id}/statistics",
                headers=self._get_headers(),
                params=self._get_api_key_param()
            )
            
            if response.status_code != 200:
                raise IntegrationError(f"HubSpot API Error: {response.status_code} - {response.text}")
            
            stats_data = response.json()
            
            # Format performance data
            counters = stats_data.get("counters", {})
            delivered = counters.get("delivered", 0)
            processed = counters.get("processed", 0)
            
            performance = {
                "campaign_id": campaign_id,
                "sends": processed,
                "delivered": delivered,
                "opens": counters.get("open", 0),
                "unique_opens": counters.get("uniqueOpen", 0),
                "open_rate": (counters.get("open", 0) / delivered) * 100 if delivered > 0 else 0,
                "clicks": counters.get("click", 0),
                "unique_clicks": counters.get("uniqueClick", 0),
                "click_rate": (counters.get("click", 0) / delivered) * 100 if delivered > 0 else 0,
                "bounces": counters.get("bounce", 0),
                "unsubscribes": counters.get("unsubscribed", 0),
                "campaign_name": stats_data.get("name", ""),
                "subject_line": stats_data.get("subject", ""),
                "delivery_date": stats_data.get("sentDate", "")
            }
            
            return self.format_success_response(
                campaign_id=campaign_id,
                performance=performance
            )
                
        return self.safe_request(
            execute_request,
            "Error getting HubSpot campaign performance"
        )
    
    def create_template(self, template_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new HubSpot email template.
        
        Args:
            template_data: Template configuration data
            
        Returns:
            Dict containing the template result with ID
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
            # Check required fields
            if "name" not in template_data:
                return self.format_error_response("Template name is required")
            
            if "html" not in template_data:
                return self.format_error_response("Template HTML is required")
            
            # Format data for HubSpot API
            hubspot_template = {
                "name": template_data["name"],
                "source": template_data["html"],
                "folder_id": template_data.get("folder_id", 1),  # Default folder ID
                "is_draft": template_data.get("is_draft", False)
            }
            
            # Create the template
            response = requests.post(
                f"{self.api_url}/design-manager/v1/templates",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json=hubspot_template
            )
            
            if response.status_code in (200, 201):
                template_result = response.json()
                return self.format_success_response(
                    template_id=template_result.get("id"),
                    name=template_result.get("name"),
                    created_at=template_result.get("created_at"),
                    updated_at=template_result.get("updated_at")
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error creating HubSpot template"
        )
    
    def send_transactional_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Send a transactional email through HubSpot.
        
        Args:
            email_data: Email configuration data
            
        Returns:
            Dict containing the sending result
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return self.format_error_response("Missing authentication credentials")
        
        self._refresh_token_if_needed()
        
        def execute_request():
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
            
            # For HubSpot Single Send Email API
            single_email = {
                "emailId": email_data.get("template_id"),
                "message": {
                    "to": [recipient["email"] for recipient in recipients],
                    "from": email_data["from_email"],
                    "subject": email_data["subject"],
                    "cc": email_data.get("cc", []),
                    "bcc": email_data.get("bcc", [])
                },
                "customProperties": email_data.get("properties", [])
            }
            
            if "html" in email_data and not email_data.get("template_id"):
                # If we're sending a custom HTML email without a template
                # Need to go through the Marketing Email API first to create a template
                template_response = self.create_template({
                    "name": f"Transactional Template {datetime.now().isoformat()}",
                    "html": email_data["html"]
                })
                
                if template_response.get("status") != "success":
                    return template_response
                
                single_email["emailId"] = template_response.get("template_id")
            
            # Send the transactional email
            response = requests.post(
                f"{self.api_url}/email/public/v1/singleEmail/send",
                headers=self._get_headers(),
                params=self._get_api_key_param(),
                json=single_email
            )
            
            if response.status_code in (200, 201, 204):
                result = response.json()
                
                return self.format_success_response(
                    sent=len(recipients),
                    rejected=0,
                    total=len(recipients),
                    result=result
                )
            else:
                raise IntegrationError(f"HubSpot API Error: {response.status_code} - {response.text}")
                
        return self.safe_request(
            execute_request,
            "Error sending transactional email"
        )
    
    def check_health(self) -> Dict[str, Any]:
        """Check HubSpot API health.
        
        Returns:
            Dict containing health status information
        """
        # Check required credentials
        if not self.access_token and not self.api_key:
            return {
                "status": "unhealthy",
                "platform": self.platform,
                "error": "Missing authentication credentials",
                "timestamp": datetime.now().isoformat()
            }
        
        try:
            response, response_time = self.measure_response_time(
                requests.get,
                f"{self.api_url}/contacts/v1/lists",
                headers=self._get_headers(),
                params=self._get_api_key_param()
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