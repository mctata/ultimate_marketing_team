"""
Integration tests for Content Analytics API endpoints
"""

import pytest
import json
from datetime import date, datetime, timedelta
from unittest.mock import patch, MagicMock, AsyncMock

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.main import app
from src.core.content_metrics import ContentMetricsService
from src.core.security import get_current_user_with_permissions

# Create test client
client = TestClient(app)

# Mock user for authentication
@pytest.fixture
def mock_current_user():
    user = MagicMock()
    user.id = 123
    user.username = "testuser"
    user.email = "test@example.com"
    user.is_active = True
    user.is_superuser = False
    return user

# Override auth dependency
@pytest.fixture(autouse=True)
def override_auth_dependency(mock_current_user):
    """Replace the auth dependency with our mock user"""
    app.dependency_overrides[get_current_user_with_permissions("content:view")] = lambda: mock_current_user
    app.dependency_overrides[get_current_user_with_permissions("analytics:view")] = lambda: mock_current_user
    app.dependency_overrides[get_current_user_with_permissions("analytics:create_dashboard")] = lambda: mock_current_user
    app.dependency_overrides[get_current_user_with_permissions("analytics:edit_dashboard")] = lambda: mock_current_user
    app.dependency_overrides[get_current_user_with_permissions("analytics:create_report")] = lambda: mock_current_user
    app.dependency_overrides[get_current_user_with_permissions("content:predict")] = lambda: mock_current_user
    yield
    app.dependency_overrides = {}

class TestContentMetricsEndpoints:
    """Test cases for Content Metrics API endpoints"""
    
    @patch.object(ContentMetricsService, 'record_content_metric')
    def test_record_content_metric(self, mock_record_metric):
        """Test recording content metric endpoint"""
        # Setup mock
        mock_record_metric.return_value = None
        
        # Test data
        data = {
            "content_id": 123,
            "date": "2025-03-01",
            "platform": "website",
            "metrics": {
                "views": 100,
                "likes": 25,
                "shares": 10
            }
        }
        
        # Make request
        response = client.post("/content-analytics/metrics", json=data)
        
        # Assert response
        assert response.status_code == 200
        assert response.json() == {"status": "success"}
        
        # Assert service method was called correctly
        mock_record_metric.assert_called_once()
        args, kwargs = mock_record_metric.call_args
        assert kwargs["content_id"] == 123
        assert isinstance(kwargs["date"], datetime)
        assert kwargs["platform"] == "website"
        assert kwargs["metrics"]["views"] == 100

    @patch.object(ContentMetricsService, 'get_content_metrics')
    def test_get_content_metrics(self, mock_get_metrics):
        """Test getting content metrics endpoint"""
        # Setup mock
        metrics_response = [
            {
                "id": 1,
                "content_id": 123,
                "date": "2025-03-01",
                "platform": "website",
                "views": 100,
                "unique_visitors": 80,
                "likes": 25,
                "shares": 10,
                "comments": 5,
                "clicks": 30,
                "click_through_rate": 0.3,
                "avg_time_on_page": 120,
                "bounce_rate": 0.25,
                "scroll_depth": 0.8,
                "conversions": 5,
                "conversion_rate": 0.05,
                "leads_generated": 3,
                "revenue_generated": 50.0,
                "serp_position": 3.5,
                "organic_traffic": 50,
                "backlinks": 10
            }
        ]
        mock_get_metrics.return_value = metrics_response
        
        # Make request
        response = client.get("/content-analytics/metrics?content_id=123&platform=website&metrics=views,likes,shares")
        
        # Assert response
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["content_id"] == 123
        assert response.json()[0]["views"] == 100
        
        # Assert service method was called correctly
        mock_get_metrics.assert_called_once()
        args, kwargs = mock_get_metrics.call_args
        assert kwargs["content_id"] == 123
        assert kwargs["platform"] == "website"
        assert set(kwargs["metrics"]) == set(["views", "likes", "shares"])

    @patch.object(ContentMetricsService, 'get_content_performance_summary')
    def test_get_content_performance_summary(self, mock_get_summary):
        """Test getting content performance summary endpoint"""
        # Setup mock
        summary_response = {
            "summary": {
                "total_views": 1000,
                "total_unique_visitors": 800,
                "total_likes": 250,
                "total_shares": 100,
                "total_comments": 50,
                "total_clicks": 300,
                "avg_click_through_rate": 0.3,
                "avg_time_on_page": 120,
                "avg_bounce_rate": 0.25,
                "total_conversions": 50,
                "avg_conversion_rate": 0.05,
                "total_revenue": 500.0,
                "content_count": 10
            }
        }
        mock_get_summary.return_value = summary_response
        
        # Make request
        response = client.get("/content-analytics/performance?content_ids=1,2,3")
        
        # Assert response
        assert response.status_code == 200
        assert "summary" in response.json()
        assert response.json()["summary"]["total_views"] == 1000
        
        # Assert service method was called correctly
        mock_get_summary.assert_called_once()
        args, kwargs = mock_get_summary.call_args
        assert kwargs["content_ids"] == [1, 2, 3]

    @patch.object(ContentMetricsService, 'get_top_performing_content')
    def test_get_top_performing_content(self, mock_get_top):
        """Test getting top performing content endpoint"""
        # Setup mock
        top_content = [
            {
                "content_id": 1,
                "views_value": 500,
                "views": 500,
                "conversions": 25,
                "revenue": 250.0
            },
            {
                "content_id": 2,
                "views_value": 450,
                "views": 450,
                "conversions": 22,
                "revenue": 220.0
            }
        ]
        mock_get_top.return_value = top_content
        
        # Make request
        response = client.get("/content-analytics/top-performing?metric=views&limit=5")
        
        # Assert response
        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.json()[0]["content_id"] == 1
        assert response.json()[0]["views"] == 500
        
        # Assert service method was called correctly
        mock_get_top.assert_called_once()
        args, kwargs = mock_get_top.call_args
        assert kwargs["metric"] == "views"
        assert kwargs["limit"] == 5

    @patch.object(ContentMetricsService, 'get_content_comparison')
    def test_get_content_comparison(self, mock_get_comparison):
        """Test getting content comparison endpoint"""
        # Setup mock
        comparison_response = {
            "comparison": [
                {
                    "content_id": 1,
                    "metrics": {
                        "views": 500,
                        "likes": 125,
                        "shares": 50,
                        "comments": 25,
                        "clicks": 150,
                        "conversions": 25,
                        "revenue": 250.0
                    }
                },
                {
                    "content_id": 2,
                    "metrics": {
                        "views": 450,
                        "likes": 110,
                        "shares": 45,
                        "comments": 22,
                        "clicks": 135,
                        "conversions": 22,
                        "revenue": 220.0
                    }
                }
            ]
        }
        mock_get_comparison.return_value = comparison_response
        
        # Make request
        response = client.get("/content-analytics/comparison?content_ids=1,2&metrics=views,likes,revenue")
        
        # Assert response
        assert response.status_code == 200
        assert "comparison" in response.json()
        assert len(response.json()["comparison"]) == 2
        
        # Get content by ID
        content1 = next((c for c in response.json()["comparison"] if c["content_id"] == 1), None)
        assert content1 is not None
        assert content1["metrics"]["views"] == 500
        assert content1["metrics"]["revenue"] == 250.0
        
        # Assert service method was called correctly
        mock_get_comparison.assert_called_once()
        args, kwargs = mock_get_comparison.call_args
        assert kwargs["content_ids"] == [1, 2]
        assert set(kwargs["metrics"]) == set(["views", "likes", "revenue"])

    @patch.object(ContentMetricsService, 'get_content_attribution')
    def test_get_content_attribution(self, mock_get_attribution):
        """Test getting content attribution endpoint"""
        # Setup mock
        attribution_response = {
            "model": "last_touch",
            "total_conversions": 100,
            "total_value": 5000.0,
            "content_attribution": [
                {
                    "content_id": 1,
                    "attributed_conversions": 40,
                    "attributed_value": 2000.0
                },
                {
                    "content_id": 2,
                    "attributed_conversions": 35,
                    "attributed_value": 1750.0
                },
                {
                    "content_id": 3,
                    "attributed_conversions": 25,
                    "attributed_value": 1250.0
                }
            ]
        }
        mock_get_attribution.return_value = attribution_response
        
        # Make request
        response = client.get("/content-analytics/attribution?attribution_model=last_touch")
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["model"] == "last_touch"
        assert response.json()["total_conversions"] == 100
        assert response.json()["total_value"] == 5000.0
        assert len(response.json()["content_attribution"]) == 3
        
        # Assert service method was called correctly
        mock_get_attribution.assert_called_once()
        args, kwargs = mock_get_attribution.call_args
        assert kwargs["attribution_model"] == "last_touch"

class TestCustomDashboardEndpoints:
    """Test cases for Custom Dashboard API endpoints"""
    
    @patch.object(ContentMetricsService, 'create_custom_dashboard')
    def test_create_custom_dashboard(self, mock_create_dashboard, mock_current_user):
        """Test creating a custom dashboard endpoint"""
        # Setup mock
        dashboard_response = {
            "id": 1,
            "user_id": 123,
            "name": "My Dashboard",
            "description": "Test dashboard",
            "layout": {"columns": 12, "rowHeight": 50},
            "widgets": [
                {"id": "widget1", "widget_type": "chart", "title": "Views Over Time"}
            ],
            "is_default": True,
            "role_id": None,
            "created_at": "2025-03-01T12:00:00"
        }
        mock_create_dashboard.return_value = dashboard_response
        
        # Test data
        data = {
            "name": "My Dashboard",
            "description": "Test dashboard",
            "layout": {"columns": 12, "rowHeight": 50, "compactType": "vertical"},
            "widgets": [
                {"id": "widget1", "widget_type": "chart", "title": "Views Over Time", "i": "widget1", "x": 0, "y": 0, "w": 6, "h": 4}
            ],
            "is_default": True
        }
        
        # Make request
        response = client.post("/content-analytics/dashboards", json=data)
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["name"] == "My Dashboard"
        assert response.json()["user_id"] == 123
        assert response.json()["is_default"] is True
        
        # Assert service method was called correctly
        mock_create_dashboard.assert_called_once()
        args, kwargs = mock_create_dashboard.call_args
        assert kwargs["user_id"] == mock_current_user.id
        assert kwargs["name"] == "My Dashboard"
        assert kwargs["is_default"] is True

    @patch.object(ContentMetricsService, 'get_custom_dashboards')
    def test_get_custom_dashboards(self, mock_get_dashboards, mock_current_user):
        """Test getting custom dashboards endpoint"""
        # Setup mock
        dashboards_response = [
            {
                "id": 1,
                "user_id": 123,
                "name": "My Dashboard",
                "description": "Test dashboard",
                "layout": {"columns": 12, "rowHeight": 50},
                "widgets": [
                    {"id": "widget1", "widget_type": "chart", "title": "Views Over Time"}
                ],
                "is_default": True,
                "role_id": None,
                "created_at": "2025-03-01T12:00:00",
                "updated_at": "2025-03-01T12:00:00"
            }
        ]
        mock_get_dashboards.return_value = dashboards_response
        
        # Make request
        response = client.get("/content-analytics/dashboards")
        
        # Assert response
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "My Dashboard"
        
        # Assert service method was called correctly
        mock_get_dashboards.assert_called_once()
        args, kwargs = mock_get_dashboards.call_args
        assert kwargs["user_id"] == mock_current_user.id
        assert kwargs["include_role_dashboards"] is True

class TestAnalyticsReportEndpoints:
    """Test cases for Analytics Report API endpoints"""
    
    @patch.object(ContentMetricsService, 'create_analytics_report')
    def test_create_analytics_report(self, mock_create_report, mock_current_user):
        """Test creating an analytics report endpoint"""
        # Setup mock
        report_response = {
            "id": 1,
            "name": "Monthly Content Report",
            "description": "Monthly performance summary",
            "created_by": 123,
            "report_type": "content",
            "template_id": "monthly_content",
            "config": {
                "date_range": {"type": "last_30_days"},
                "metrics": ["views", "conversions", "revenue"]
            },
            "schedule_type": "monthly",
            "schedule_config": {"day": 1, "time": "09:00"},
            "recipients": ["user@example.com"],
            "last_generated": None,
            "file_path": None,
            "file_type": None,
            "created_at": "2025-03-01T12:00:00",
            "updated_at": "2025-03-01T12:00:00"
        }
        mock_create_report.return_value = report_response
        
        # Test data
        data = {
            "name": "Monthly Content Report",
            "description": "Monthly performance summary",
            "report_type": "content",
            "template_id": "monthly_content",
            "config": {
                "date_range": {"type": "last_30_days"},
                "metrics": ["views", "conversions", "revenue"],
                "filters": None,
                "grouping": None
            },
            "schedule_type": "monthly",
            "schedule_config": {"day": 1, "time": "09:00"},
            "recipients": ["user@example.com"]
        }
        
        # Make request
        response = client.post("/content-analytics/reports", json=data)
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["name"] == "Monthly Content Report"
        assert response.json()["created_by"] == 123
        
        # Assert service method was called correctly
        mock_create_report.assert_called_once()
        args, kwargs = mock_create_report.call_args
        assert kwargs["user_id"] == mock_current_user.id
        assert kwargs["name"] == "Monthly Content Report"
        assert kwargs["report_type"] == "content"

    @patch.object(ContentMetricsService, 'get_analytics_reports')
    def test_get_analytics_reports(self, mock_get_reports, mock_current_user):
        """Test getting analytics reports endpoint"""
        # Setup mock
        reports_response = [
            {
                "id": 1,
                "name": "Monthly Content Report",
                "description": "Monthly performance summary",
                "created_by": 123,
                "report_type": "content",
                "template_id": "monthly_content",
                "config": {
                    "date_range": {"type": "last_30_days"},
                    "metrics": ["views", "conversions", "revenue"]
                },
                "schedule_type": "monthly",
                "schedule_config": {"day": 1, "time": "09:00"},
                "recipients": ["user@example.com"],
                "last_generated": "2025-03-01T09:00:00",
                "file_path": "/reports/monthly_report_2025-03-01.pdf",
                "file_type": "pdf",
                "created_at": "2025-02-01T12:00:00",
                "updated_at": "2025-03-01T09:00:00"
            }
        ]
        mock_get_reports.return_value = reports_response
        
        # Make request
        response = client.get("/content-analytics/reports?report_type=content")
        
        # Assert response
        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["name"] == "Monthly Content Report"
        assert response.json()[0]["last_generated"] == "2025-03-01T09:00:00"
        
        # Assert service method was called correctly
        mock_get_reports.assert_called_once()
        args, kwargs = mock_get_reports.call_args
        assert kwargs["user_id"] == mock_current_user.id
        assert kwargs["report_type"] == "content"

class TestPredictionEndpoints:
    """Test cases for Prediction API endpoints"""
    
    @patch.object(ContentMetricsService, 'predict_content_performance')
    def test_predict_content_performance(self, mock_predict):
        """Test predicting content performance endpoint"""
        # Setup mock
        prediction_response = {
            "content_id": 123,
            "target_metric": "views",
            "prediction_date": "2025-04-01T00:00:00",
            "predicted_value": 1000,
            "confidence_interval_lower": 800,
            "confidence_interval_upper": 1200,
            "model": {
                "id": 1,
                "name": "Views Predictor",
                "model_type": "regression",
                "performance_metrics": {"r2": 0.85, "rmse": 50}
            }
        }
        mock_predict.return_value = prediction_response
        
        # Test data
        data = {
            "content_id": 123,
            "content_data": {
                "title": "Test Content",
                "content_type": "blog_post",
                "word_count": 1200,
                "category": "technology"
            },
            "target_metric": "views",
            "prediction_horizon": 30
        }
        
        # Make request
        response = client.post("/content-analytics/predict", json=data)
        
        # Assert response
        assert response.status_code == 200
        assert response.json()["content_id"] == 123
        assert response.json()["target_metric"] == "views"
        assert response.json()["predicted_value"] == 1000
        
        # Assert service method was called correctly
        mock_predict.assert_called_once()
        args, kwargs = mock_predict.call_args
        assert kwargs["content_id"] == 123
        assert kwargs["target_metric"] == "views"
        assert kwargs["prediction_horizon"] == 30