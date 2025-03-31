"""Unit tests for the enhanced Instagram integration."""

import pytest
import json
import io
import responses
from unittest.mock import patch, MagicMock, call, mock_open

from src.agents.integrations.social.instagram import InstagramIntegration
from src.core.exceptions import IntegrationError


class TestInstagramIntegration:
    """Test suite for the enhanced Instagram integration."""

    @pytest.fixture
    def credentials(self):
        """Sample credentials for testing."""
        return {
            "access_token": "mock_access_token",
            "client_id": "mock_client_id",
            "client_secret": "mock_client_secret",
            "instagram_business_id": "12345678"
        }

    @pytest.fixture
    def integration(self, credentials):
        """Create an Instagram integration instance for testing."""
        return InstagramIntegration(credentials)

    @pytest.fixture
    def post_data(self):
        """Sample post data for testing."""
        return {
            "caption": "Test Instagram post #umt #marketing",
            "image_path": "/path/to/image.jpg",
            "location_id": "12345",
            "user_tags": ["user1", "user2"],
            "hashtags": ["marketing", "analytics"]
        }

    @pytest.fixture
    def story_data(self):
        """Sample story data for testing."""
        return {
            "image_path": "/path/to/story_image.jpg",
            "interactive_elements": {
                "poll": {
                    "question": "Do you like our product?",
                    "options": ["Yes", "No"]
                }
            },
            "links": [{"url": "https://example.com", "text": "Learn More"}]
        }

    @pytest.fixture
    def carousel_data(self):
        """Sample carousel data for testing."""
        return {
            "caption": "Check out our new products!",
            "media": [
                {"type": "image", "path": "/path/to/image1.jpg"},
                {"type": "image", "path": "/path/to/image2.jpg"},
                {"type": "video", "path": "/path/to/video.mp4"}
            ],
            "hashtags": ["products", "new"]
        }

    def test_initialization(self, credentials, integration):
        """Test proper initialization of the integration."""
        assert integration.platform == "instagram"
        assert integration.credentials == credentials
        assert integration.base_url == "https://graph.facebook.com/v17.0"
        assert integration.instagram_business_id == credentials["instagram_business_id"]
        assert hasattr(integration, 'optimize_image')

    @responses.activate
    def test_check_health_success(self, integration):
        """Test the health check with a successful response."""
        # Mock the business account info endpoint
        responses.add(
            responses.GET,
            f"{integration.base_url}/{integration.instagram_business_id}",
            json={"id": "12345678", "username": "test_account", "name": "Test Account"},
            status=200
        )

        health_status = integration.check_health()
        assert health_status["status"] == "ok"
        assert "response_time" in health_status
        assert health_status["message"] == "Instagram API connection successful"
        assert "username" in health_status["details"]

    @responses.activate
    def test_check_health_failure(self, integration):
        """Test the health check with a failed response."""
        # Mock the business account info endpoint with error
        responses.add(
            responses.GET,
            f"{integration.base_url}/{integration.instagram_business_id}",
            json={"error": {"message": "Invalid OAuth access token", "code": 190}},
            status=400
        )

        health_status = integration.check_health()
        assert health_status["status"] == "error"
        assert "response_time" in health_status
        assert "Invalid OAuth access token" in health_status["message"]

    @patch('src.agents.integrations.social.instagram.Image.open')
    @patch('src.agents.integrations.social.instagram.io.BytesIO')
    def test_optimize_image(self, mock_bytesio, mock_image_open, integration):
        """Test image optimization for Instagram."""
        # Mock image object
        mock_img = MagicMock()
        mock_img.size = (2000, 1000)  # Original size
        mock_img.format = "JPEG"
        mock_image_open.return_value = mock_img
        
        # Mock BytesIO
        mock_buffer = MagicMock()
        mock_bytesio.return_value = mock_buffer
        
        # Run the optimization
        result = integration.optimize_image("/path/to/image.jpg", "post")
        
        # Verify image was resized
        mock_img.resize.assert_called_once()
        # Ensure resize dimensions are within Instagram limits
        resize_args = mock_img.resize.call_args[0][0]
        assert 320 <= resize_args[0] <= 1080  # Width constraints
        assert 320 <= resize_args[1] <= 1080  # Height constraints
        
        # Verify image was saved with optimization
        mock_img.save.assert_called_once()
        save_args = mock_img.save.call_args[1]
        assert save_args["format"] == "JPEG"
        assert "quality" in save_args
        assert 70 <= save_args["quality"] <= 95  # Quality in acceptable range
        
        # Verify the optimized image data was returned
        assert result["optimized_image"] == mock_buffer
        assert "original_size" in result
        assert "optimized_size" in result
        assert "aspect_ratio" in result

    @patch('src.agents.integrations.social.instagram.InstagramIntegration.optimize_image')
    @responses.activate
    def test_create_post_success(self, mock_optimize, integration, post_data):
        """Test creating a post successfully."""
        # Mock the image optimization
        mock_buffer = MagicMock()
        mock_optimize.return_value = {
            "optimized_image": mock_buffer,
            "original_size": 1000000,
            "optimized_size": 500000,
            "aspect_ratio": 1.0
        }
        
        # Mock the upload endpoint
        upload_response = {"id": "media12345"}
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media",
            json=upload_response,
            status=200
        )
        
        # Mock the publish endpoint
        publish_response = {"id": "post12345"}
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media_publish",
            json=publish_response,
            status=200
        )
        
        result = integration.create_post(post_data)
        
        assert result["success"] is True
        assert result["data"]["id"] == "post12345"
        assert result["message"] == "Post created successfully"
        assert "optimization_stats" in result["data"]

    @patch('src.agents.integrations.social.instagram.InstagramIntegration.optimize_image')
    @responses.activate
    def test_create_post_failure(self, mock_optimize, integration, post_data):
        """Test creating a post with a failure."""
        # Mock the image optimization
        mock_buffer = MagicMock()
        mock_optimize.return_value = {
            "optimized_image": mock_buffer,
            "original_size": 1000000,
            "optimized_size": 500000,
            "aspect_ratio": 1.0
        }
        
        # Mock the upload endpoint with error
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media",
            json={"error": {"message": "Invalid image format", "code": 100}},
            status=400
        )
        
        result = integration.create_post(post_data)
        
        assert result["success"] is False
        assert "Invalid image format" in result["message"]
        assert "error" in result

    @patch('src.agents.integrations.social.instagram.InstagramIntegration.optimize_image')
    @responses.activate
    def test_create_story_success(self, mock_optimize, integration, story_data):
        """Test creating a story successfully."""
        # Mock the image optimization
        mock_buffer = MagicMock()
        mock_optimize.return_value = {
            "optimized_image": mock_buffer,
            "original_size": 1000000,
            "optimized_size": 500000,
            "aspect_ratio": 1.0
        }
        
        # Mock the upload endpoint
        upload_response = {"id": "media12345"}
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media",
            json=upload_response,
            status=200
        )
        
        # Mock the publish endpoint
        publish_response = {"id": "story12345"}
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media_publish",
            json=publish_response,
            status=200
        )
        
        result = integration.create_story(story_data)
        
        assert result["success"] is True
        assert result["data"]["id"] == "story12345"
        assert result["message"] == "Story created successfully"
        assert "optimization_stats" in result["data"]

    @patch('src.agents.integrations.social.instagram.InstagramIntegration.optimize_image')
    @responses.activate
    def test_create_carousel_success(self, mock_optimize, integration, carousel_data):
        """Test creating a carousel post successfully."""
        # Mock the image optimization
        mock_buffer = MagicMock()
        mock_optimize.return_value = {
            "optimized_image": mock_buffer,
            "original_size": 1000000,
            "optimized_size": 500000,
            "aspect_ratio": 1.0
        }
        
        # Mock the upload endpoints for each media item
        for i in range(len(carousel_data["media"])):
            upload_response = {"id": f"media{i}"}
            responses.add(
                responses.POST,
                f"{integration.base_url}/{integration.instagram_business_id}/media",
                json=upload_response,
                status=200
            )
        
        # Mock the carousel creation endpoint
        carousel_response = {"id": "carousel12345"}
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media",
            json=carousel_response,
            status=200
        )
        
        # Mock the publish endpoint
        publish_response = {"id": "post12345"}
        responses.add(
            responses.POST,
            f"{integration.base_url}/{integration.instagram_business_id}/media_publish",
            json=publish_response,
            status=200
        )
        
        result = integration.create_carousel(carousel_data)
        
        assert result["success"] is True
        assert "media_ids" in result["data"]
        assert result["message"] == "Carousel post created successfully"

    @responses.activate
    def test_get_insights_success(self, integration):
        """Test retrieving post insights successfully."""
        post_id = "post12345"
        metrics = ["impressions", "reach", "engagement"]
        
        # Mock the insights endpoint
        insights_response = {
            "data": [
                {
                    "name": "impressions",
                    "period": "lifetime",
                    "values": [{"value": 1500}]
                },
                {
                    "name": "reach",
                    "period": "lifetime",
                    "values": [{"value": 1200}]
                },
                {
                    "name": "engagement",
                    "period": "lifetime",
                    "values": [{"value": 300}]
                }
            ],
            "paging": {"cursors": {"before": "xxx", "after": "yyy"}}
        }
        
        responses.add(
            responses.GET,
            f"{integration.base_url}/{post_id}/insights",
            json=insights_response,
            status=200
        )
        
        result = integration.get_insights(post_id, metrics)
        
        assert result["success"] is True
        assert result["data"]["impressions"] == 1500
        assert result["data"]["reach"] == 1200
        assert result["data"]["engagement"] == 300
        assert result["message"] == "Insights retrieved successfully"

    @responses.activate
    def test_get_comments_success(self, integration):
        """Test retrieving post comments successfully."""
        post_id = "post12345"
        
        # Mock the comments endpoint
        comments_response = {
            "data": [
                {
                    "id": "comment1",
                    "text": "Great post!",
                    "from": {"id": "user1", "username": "user1"}
                },
                {
                    "id": "comment2",
                    "text": "Love this!",
                    "from": {"id": "user2", "username": "user2"}
                }
            ],
            "paging": {"cursors": {"before": "xxx", "after": "yyy"}}
        }
        
        responses.add(
            responses.GET,
            f"{integration.base_url}/{post_id}/comments",
            json=comments_response,
            status=200
        )
        
        result = integration.get_comments(post_id)
        
        assert result["success"] is True
        assert len(result["data"]) == 2
        assert result["data"][0]["text"] == "Great post!"
        assert result["message"] == "Comments retrieved successfully"

    @responses.activate
    def test_refresh_token_success(self, integration):
        """Test refreshing the access token successfully."""
        # Mock the token refresh endpoint
        refresh_response = {
            "access_token": "new_access_token",
            "token_type": "bearer",
            "expires_in": 5183944  # 60 days in seconds
        }
        
        responses.add(
            responses.GET,
            "https://graph.facebook.com/v17.0/oauth/access_token",
            json=refresh_response,
            status=200
        )
        
        result = integration.refresh_token()
        
        assert result["success"] is True
        assert result["access_token"] == "new_access_token"
        assert "expires_in" in result
        assert result["message"] == "Access token refreshed successfully"
        
        # Verify credentials were updated
        assert integration.credentials["access_token"] == "new_access_token"

    @patch('src.agents.integrations.social.instagram.logging')
    def test_logging(self, mock_logging, integration):
        """Test that operations are properly logged."""
        with patch.object(integration, 'safe_request', return_value=MagicMock(status_code=200, json=lambda: {"id": "12345678", "username": "test_account"})):
            integration.check_health()
        
        # Verify logging occurred
        assert mock_logging.info.call_count >= 1
        assert any("instagram" in str(call_args) for call_args in mock_logging.info.call_args_list)

    @responses.activate
    def test_exception_handling(self, integration):
        """Test handling of exceptions during API calls."""
        # Mock a connection error
        responses.add(
            responses.GET,
            f"{integration.base_url}/{integration.instagram_business_id}",
            body=ConnectionError("Connection refused")
        )

        health_status = integration.check_health()
        assert health_status["status"] == "error"
        assert "Connection error" in health_status["message"]