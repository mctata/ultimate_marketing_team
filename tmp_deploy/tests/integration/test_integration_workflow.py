"""Integration tests for the full integration workflow."""

import pytest
import json
import responses
from unittest.mock import patch, MagicMock, call

from src.agents.integrations.social.factory import EnhancedSocialMediaIntegrationFactory
from src.agents.integrations.email_marketing.factory import EmailMarketingIntegrationFactory
from src.agents.integrations.analytics.factory import AnalyticsIntegrationFactory
from src.agents.integrations.cms_integration import CMSIntegrationFactory
from src.agents.integrations.developer.webhook_manager import WebhookManager
from src.agents.integrations.developer.api_key_manager import ApiKeyManager


class TestIntegrationWorkflow:
    """Test suite for the complete integration workflow."""

    @pytest.fixture
    def db_session(self):
        """Mock database session for testing."""
        session = MagicMock()
        return session

    @pytest.fixture
    def social_credentials(self):
        """Sample social media credentials for testing."""
        return {
            "instagram": {
                "access_token": "instagram_token",
                "client_id": "instagram_client_id",
                "client_secret": "instagram_secret",
                "instagram_business_id": "12345678"
            },
            "linkedin": {
                "access_token": "linkedin_token",
                "client_id": "linkedin_client_id",
                "client_secret": "linkedin_secret",
                "profile_type": "company"
            }
        }

    @pytest.fixture
    def email_credentials(self):
        """Sample email marketing credentials for testing."""
        return {
            "mailchimp": {
                "api_key": "mailchimp_api_key-us1",
                "server": "us1"
            }
        }

    @pytest.fixture
    def analytics_credentials(self):
        """Sample analytics credentials for testing."""
        return {
            "google_analytics": {
                "view_id": "12345678",
                "client_email": "test-service-account@project.iam.gserviceaccount.com",
                "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEtest\n-----END PRIVATE KEY-----\n",
                "property_id": "properties/1234567"
            }
        }

    @pytest.fixture
    def cms_credentials(self):
        """Sample CMS credentials for testing."""
        return {
            "wordpress": {
                "url": "https://example.com/wp-json/wp/v2",
                "username": "admin",
                "password": "password"
            },
            "webflow": {
                "api_key": "webflow_api_key",
                "site_id": "webflow_site_id"
            }
        }

    @pytest.fixture
    def content_data(self):
        """Sample content data for cross-platform publishing."""
        return {
            "title": "Ultimate Marketing Team Update",
            "body": "<p>Check out our latest marketing insights!</p>",
            "summary": "Latest marketing insights from the Ultimate Marketing Team",
            "publish_date": "2023-06-15T10:00:00Z",
            "categories": ["marketing", "analytics"],
            "tags": ["insights", "trends", "ai"],
            "author": "Marketing Team",
            "image_url": "https://example.com/images/insights.jpg",
            "seo": {
                "meta_title": "Latest Marketing Insights - Ultimate Marketing Team",
                "meta_description": "Discover the latest marketing trends and insights from our team of experts.",
                "keywords": "marketing, insights, trends, analytics"
            }
        }

    @pytest.fixture
    def webhook_config(self):
        """Sample webhook configuration for testing."""
        return {
            "secret_key": "test_webhook_secret",
            "default_timeout": 5,
            "max_retries": 1,
            "retry_delay": 0.1
        }

    @pytest.fixture
    def api_key_config(self):
        """Sample API key configuration for testing."""
        return {
            "secret_key": "test_api_key_secret",
            "hash_algorithm": "sha256",
            "rate_limit": {
                "default": 100,
                "premium": 500,
                "free": 50
            },
            "token_expiry": {
                "default": 30,
                "premium": 90,
                "free": 7
            }
        }

    @responses.activate
    @patch('src.agents.integrations.social.instagram.InstagramIntegration.optimize_image')
    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_cross_platform_content_publishing(self, mock_ga_init, mock_optimize, db_session, social_credentials, 
                                                email_credentials, cms_credentials, content_data, webhook_config):
        """Test publishing content across multiple platform types with webhooks."""
        # 1. Set up the webhook manager for event notifications
        webhook_manager = WebhookManager(db_session, webhook_config)
        
        # Mock webhook registration for content publishing events
        with patch.object(webhook_manager, 'get_webhooks_by_event', return_value=[MagicMock(url="https://example.com/webhook")]):
            with patch.object(webhook_manager, 'deliver_webhook', return_value=True) as mock_deliver:
                
                # 2. Set up the mocks for CMS publishing (WordPress)
                wordpress_integration = CMSIntegrationFactory.get_integration("wordpress", cms_credentials["wordpress"])
                
                # Mock WordPress post creation
                responses.add(
                    responses.POST,
                    "https://example.com/wp-json/wp/v2/posts",
                    json={"id": 12345, "link": "https://example.com/2023/06/15/ultimate-marketing-team-update/"},
                    status=201
                )
                
                # 3. Set up the mocks for social media publishing (Instagram)
                instagram_integration = EnhancedSocialMediaIntegrationFactory.get_integration(
                    "instagram", social_credentials["instagram"]
                )
                
                # Mock image optimization
                mock_buffer = MagicMock()
                mock_optimize.return_value = {
                    "optimized_image": mock_buffer,
                    "original_size": 1000000,
                    "optimized_size": 500000,
                    "aspect_ratio": 1.0
                }
                
                # Mock Instagram media upload
                responses.add(
                    responses.POST,
                    f"https://graph.facebook.com/v17.0/{social_credentials['instagram']['instagram_business_id']}/media",
                    json={"id": "media12345"},
                    status=200
                )
                
                # Mock Instagram media publish
                responses.add(
                    responses.POST,
                    f"https://graph.facebook.com/v17.0/{social_credentials['instagram']['instagram_business_id']}/media_publish",
                    json={"id": "post12345"},
                    status=200
                )
                
                # 4. Set up the mocks for email marketing (Mailchimp)
                mailchimp_integration = EmailMarketingIntegrationFactory.get_integration(
                    "mailchimp", email_credentials["mailchimp"]
                )
                
                # Mock Mailchimp campaign creation
                responses.add(
                    responses.POST,
                    "https://us1.api.mailchimp.com/3.0/campaigns",
                    json={"id": "campaign123"},
                    status=200
                )
                
                # Mock Mailchimp campaign content update
                responses.add(
                    responses.PUT,
                    "https://us1.api.mailchimp.com/3.0/campaigns/campaign123/content",
                    json={"id": "campaign123"},
                    status=200
                )
                
                # 5. Execute the content publishing workflow
                # Step 1: Publish to WordPress
                wp_result = wordpress_integration.create_post({
                    "title": content_data["title"],
                    "content": content_data["body"],
                    "excerpt": content_data["summary"],
                    "status": "publish",
                    "categories": content_data["categories"],
                    "tags": content_data["tags"]
                })
                
                # Step 2: Publish to Instagram with the same content
                instagram_caption = f"{content_data['title']}\n\n{content_data['summary']}\n\n#" + " #".join(content_data["tags"])
                ig_result = instagram_integration.create_post({
                    "caption": instagram_caption,
                    "image_path": content_data["image_url"],
                    "hashtags": content_data["tags"]
                })
                
                # Step 3: Create a Mailchimp campaign about the content
                campaign_data = {
                    "name": content_data["title"],
                    "subject_line": content_data["title"],
                    "from_name": "Ultimate Marketing Team",
                    "reply_to": "marketing@example.com",
                    "list_id": "abc123",
                    "content": {
                        "html": content_data["body"] + f'<p>Read more on our <a href="{wp_result["data"]["link"]}">website</a>.</p>'
                    }
                }
                mc_result = mailchimp_integration.create_campaign(campaign_data)
                
                # Step 4: Trigger a webhook event for the content publishing
                webhook_event_payload = {
                    "event_type": "content.published",
                    "content": {
                        "id": wp_result["data"]["id"],
                        "title": content_data["title"],
                        "platforms": {
                            "wordpress": wp_result["data"]["id"],
                            "instagram": ig_result["data"]["id"],
                            "mailchimp": mc_result["data"]["id"]
                        }
                    }
                }
                webhook_manager.trigger_webhook("content.published", webhook_event_payload)
                
                # 6. Verify the results and workflow integration
                # Check WordPress result
                assert wp_result["success"] is True
                assert wp_result["data"]["id"] == 12345
                
                # Check Instagram result
                assert ig_result["success"] is True
                assert ig_result["data"]["id"] == "post12345"
                
                # Check Mailchimp result
                assert mc_result["success"] is True
                assert mc_result["data"]["id"] == "campaign123"
                
                # Verify webhook was triggered
                mock_deliver.assert_called_once()
                # Verify event type and content was passed correctly
                webhook_call = mock_deliver.call_args[0]
                assert webhook_call[1]["event_type"] == "content.published"
                assert webhook_call[1]["content"]["title"] == content_data["title"]
                assert "platforms" in webhook_call[1]["content"]
                assert webhook_call[1]["content"]["platforms"]["wordpress"] == 12345

    @responses.activate
    @patch('src.agents.integrations.analytics.google_analytics.GoogleAnalyticsIntegration.initialize_client')
    def test_analytics_integration_workflow(self, mock_ga_init, analytics_credentials, api_key_config, db_session):
        """Test analytics data retrieval and API key authorization flow."""
        # 1. Set up the API key manager for authorization
        api_key_manager = ApiKeyManager(db_session, api_key_config)
        
        # 2. Create and mock an API key for analytics access
        with patch.object(api_key_manager, 'generate_key_pair', return_value=("key12345", "key12345.secretpart")):
            with patch.object(api_key_manager, 'hash_key', return_value=("hashedkey", "salt")):
                with patch('src.agents.integrations.developer.api_key_manager.ApiKey', return_value=MagicMock(id=1, key_id="key12345")):
                    api_key_result = api_key_manager.create_api_key({
                        "permissions": ["read:analytics"],
                        "tier": "default",
                        "name": "Analytics API Key"
                    }, "test_user")
        
        # 3. Set up the Google Analytics integration
        ga_integration = AnalyticsIntegrationFactory.get_integration(
            "google_analytics", analytics_credentials["google_analytics"]
        )
        
        # Mock client methods
        mock_client = MagicMock()
        mock_reports = MagicMock()
        ga_integration.client = mock_client
        mock_client.properties.return_value = mock_reports
        
        # Mock GA4 report response
        ga_report_response = {
            "rows": [
                {
                    "dimensionValues": [
                        {"value": "20230101"},
                        {"value": "organic"}
                    ],
                    "metricValues": [
                        {"value": "12000"},
                        {"value": "8000"},
                        {"value": "5000"}
                    ]
                }
            ],
            "dimensionHeaders": [
                {"name": "date"},
                {"name": "channelGrouping"}
            ],
            "metricHeaders": [
                {"name": "screenPageViews"},
                {"name": "sessions"},
                {"name": "totalUsers"}
            ]
        }
        mock_reports.runReport.return_value.execute.return_value = ga_report_response
        
        # 4. Mock API key validation
        mock_api_key = MagicMock(
            id=1,
            key_id="key12345",
            key_hash="hashedkey",
            salt="salt",
            created_by="test_user",
            permissions=["read:analytics"],
            tier="default",
            active=True,
            last_used=None
        )
        
        with patch.object(api_key_manager, 'verify_key_hash', return_value=True):
            with patch.object(db_session, 'query') as mock_query:
                mock_query.return_value.filter.return_value.first.return_value = mock_api_key
                
                # 5. Execute the workflow: validate API key and get analytics data
                # Step 1: Validate the API key
                api_key = api_key_result["api_key"]
                validation_result = api_key_manager.validate_api_key(api_key)
                
                # Step 2: Check permission for reading analytics
                permission_result = api_key_manager.check_permission(api_key, "read:analytics")
                
                # Step 3: If authorized, retrieve analytics data
                if permission_result["has_permission"]:
                    analytics_result = ga_integration.get_report({
                        "date_range": {
                            "start_date": "2023-01-01",
                            "end_date": "2023-01-31"
                        },
                        "metrics": ["screenPageViews", "sessions", "totalUsers"],
                        "dimensions": ["date", "channelGrouping"]
                    })
                
                # 6. Verify the results and workflow integration
                # Check API key validation
                assert validation_result["valid"] is True
                assert validation_result["key_id"] == "key12345"
                assert "permissions" in validation_result
                
                # Check permission validation
                assert permission_result["has_permission"] is True
                
                # Check analytics result
                assert analytics_result["success"] is True
                assert "data" in analytics_result
                assert "rows" in analytics_result["data"]
                assert len(analytics_result["data"]["rows"]) == 1
                
                # Verify the analytics data
                data_row = analytics_result["data"]["rows"][0]
                assert data_row["date"] == "20230101"
                assert data_row["channelGrouping"] == "organic"
                assert data_row["screenPageViews"] == "12000"
                assert data_row["sessions"] == "8000"
                assert data_row["totalUsers"] == "5000"