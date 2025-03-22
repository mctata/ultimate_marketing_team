"""
Integration tests for the complete analytics workflow.

Tests the end-to-end flow from recording metrics to generating reports
and predictions.
"""

import pytest
import json
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from unittest.mock import patch, MagicMock, AsyncMock

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete

from src.api.main import app
from src.core.database import get_db
from src.core.content_metrics import ContentMetricsService
from src.core.content_prediction_models import ContentPredictionService
from src.models.system import (
    ContentMetric, ContentAttributionPath, CustomDashboard, 
    AnalyticsReport, ContentPredictionModel, ContentPerformancePrediction
)

# Test client
client = TestClient(app)

# Test data
@pytest.fixture
def content_metrics_data():
    return {
        "content_id": 123,
        "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "platform": "website",
        "metrics": {
            "views": 1000,
            "unique_visitors": 800,
            "likes": 50,
            "shares": 20,
            "comments": 10,
            "clicks": 150,
            "click_through_rate": 0.15,
            "avg_time_on_page": 120,
            "bounce_rate": 0.25,
            "scroll_depth": 0.7,
            "conversions": 5,
            "conversion_rate": 0.005,
            "leads_generated": 3,
            "revenue_generated": 5000,
            "demographics": {
                "age_groups": {"18-24": 0.2, "25-34": 0.4, "35-44": 0.3, "45+": 0.1},
                "gender": {"male": 0.6, "female": 0.4}
            },
            "sources": {
                "social": 0.3, "search": 0.4, "direct": 0.2, "referral": 0.1
            },
            "devices": {
                "mobile": 0.6, "desktop": 0.3, "tablet": 0.1
            }
        }
    }

@pytest.fixture
def content_attribution_data():
    return {
        "user_identifier": "user123",
        "conversion_id": "conv456",
        "conversion_type": "purchase",
        "conversion_value": 10000,  # $100.00
        "path": [
            {"content_id": 123, "timestamp": datetime.now() - timedelta(hours=5), "platform": "facebook"},
            {"content_id": 456, "timestamp": datetime.now() - timedelta(hours=3), "platform": "website"},
            {"content_id": 789, "timestamp": datetime.now() - timedelta(hours=1), "platform": "website"}
        ],
        "first_touch_content_id": 123,
        "last_touch_content_id": 789,
        "conversion_date": datetime.now()
    }

@pytest.fixture
def prediction_model_data():
    return {
        "name": "Test Views Predictor",
        "description": "Test model for predicting views",
        "model_type": "random_forest",
        "target_metric": "views",
        "features": ["content_type", "word_count", "has_image", "publish_time"],
        "model_path": "/tmp/test_model.pkl",
        "performance_metrics": {
            "mse": 10000,
            "rmse": 100,
            "r2": 0.75,
            "mae": 80
        },
        "training_date": datetime.now()
    }

@pytest.fixture
def mock_session():
    """Create a mock database session."""
    session = MagicMock()
    session.execute.return_value.scalars.return_value.all.return_value = []
    session.execute.return_value.scalars.return_value.first.return_value = None
    return session

@pytest.fixture
def mock_auth():
    """Mock authentication for API endpoints."""
    patcher = patch('src.core.security.get_current_user_with_permissions')
    mock_get_user = patcher.start()
    
    # Mock user
    user = MagicMock()
    user.id = 999
    user.username = "testuser"
    user.email = "test@example.com"
    user.is_active = True
    
    mock_get_user.return_value = lambda: user
    yield mock_get_user
    patcher.stop()

@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data after each test."""
    yield
    
    # Use raw SQL delete to clean up test data
    with get_db() as session:
        # Delete test content metrics
        session.execute(delete(ContentMetric).where(ContentMetric.content_id == 123))
        
        # Delete test attribution paths
        session.execute(delete(ContentAttributionPath).where(
            ContentAttributionPath.user_identifier == "user123"
        ))
        
        # Delete test dashboards
        session.execute(delete(CustomDashboard).where(CustomDashboard.user_id == 999))
        
        # Delete test reports
        session.execute(delete(AnalyticsReport).where(AnalyticsReport.created_by == 999))
        
        # Delete test prediction models
        session.execute(delete(ContentPredictionModel).where(
            ContentPredictionModel.name == "Test Views Predictor"
        ))
        
        session.commit()

@pytest.mark.asyncio
async def test_complete_analytics_workflow(content_metrics_data, content_attribution_data, 
                                          prediction_model_data, mock_auth):
    """Test the complete analytics workflow from recording metrics to predictions."""
    
    # Step 1: Record content metrics via API
    response = client.post(
        "/content-analytics/metrics",
        json=content_metrics_data
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Step 2: Record attribution data
    # Use service method directly since there's no direct API endpoint
    await ContentMetricsService.record_attribution_path(**content_attribution_data)
    
    # Step 3: Get content performance summary
    response = client.get(
        f"/content-analytics/performance?content_ids={content_metrics_data['content_id']}"
    )
    assert response.status_code == 200
    summary = response.json()
    assert "summary" in summary
    assert summary["summary"]["total_views"] == content_metrics_data["metrics"]["views"]
    
    # Step 4: Get content attribution data
    response = client.get(
        f"/content-analytics/attribution?content_id={content_metrics_data['content_id']}"
    )
    assert response.status_code == 200
    attribution = response.json()
    assert attribution["model"] == "last_touch"
    # Since the attribution path we created has this content as first touch,
    # it should appear in the attribution data
    content_attribution = next(
        (item for item in attribution["content_attribution"] 
         if item["content_id"] == content_metrics_data["content_id"]),
        None
    )
    assert content_attribution is not None
    
    # Step 5: Create a custom dashboard
    dashboard_data = {
        "name": "Test Dashboard",
        "description": "Integration test dashboard",
        "layout": {
            "columns": 12,
            "rowHeight": 50,
            "compactType": "vertical",
            "is_draggable": True,
            "is_resizable": True
        },
        "widgets": [
            {
                "id": "widget1",
                "widget_type": "chart",
                "title": "Views Over Time",
                "i": "widget1",
                "x": 0,
                "y": 0,
                "w": 6,
                "h": 4,
                "settings": {
                    "metric": "views",
                    "chart_type": "line",
                    "content_ids": [content_metrics_data["content_id"]],
                    "time_range": "last_30_days"
                }
            }
        ],
        "is_default": True
    }
    
    response = client.post(
        "/content-analytics/dashboards",
        json=dashboard_data
    )
    assert response.status_code == 200
    dashboard = response.json()
    assert dashboard["name"] == "Test Dashboard"
    dashboard_id = dashboard["id"]
    
    # Step 6: Get dashboards
    response = client.get("/content-analytics/dashboards")
    assert response.status_code == 200
    dashboards = response.json()
    assert len(dashboards) >= 1
    assert any(d["id"] == dashboard_id for d in dashboards)
    
    # Step 7: Create an analytics report
    report_data = {
        "name": "Test Report",
        "description": "Integration test report",
        "report_type": "content",
        "config": {
            "date_range": {"type": "last_30_days"},
            "metrics": ["views", "conversions", "revenue"],
            "filters": {},
            "grouping": "daily"
        },
        "schedule_type": "weekly",
        "schedule_config": {"day": "monday", "time": "09:00"},
        "recipients": ["test@example.com"]
    }
    
    response = client.post(
        "/content-analytics/reports",
        json=report_data
    )
    assert response.status_code == 200
    report = response.json()
    assert report["name"] == "Test Report"
    report_id = report["id"]
    
    # Step 8: Train a prediction model
    # Patch get_training_data to provide mock training data
    with patch.object(ContentPredictionService, 'get_training_data') as mock_get_training_data:
        # Create mock training dataframe
        df = pd.DataFrame({
            'content_id': list(range(1, 101)),
            'content_type': np.random.choice(['blog', 'social', 'email'], 100),
            'word_count': np.random.randint(100, 3000, 100),
            'has_image': np.random.choice([0, 1], 100),
            'publish_time': np.random.randint(0, 24, 100),
            'views': np.random.randint(100, 5000, 100)
        })
        mock_get_training_data.return_value = df
        
        model = await ContentPredictionService.train_model(
            target_metric='views',
            features=['content_type', 'word_count', 'has_image', 'publish_time'],
            model_type='random_forest',
            model_params={"n_estimators": 10, "max_depth": 3}  # Small model for testing
        )
        
        assert 'id' in model
        assert model['target_metric'] == 'views'
        assert 'performance_metrics' in model
        model_id = model['id']
    
    # Step 9: Generate a prediction
    # Mock the model loading and prediction
    with patch('os.path.exists', return_value=True), \
         patch('pickle.load'), \
         patch('pickle.dump'), \
         patch('builtins.open'):
        
        # Create a mock pipeline that returns a fixed prediction
        mock_pipeline = MagicMock()
        mock_pipeline.predict.return_value = np.array([1500])
        
        # Patch pickle.load to return our mock pipeline
        patch('pickle.load', return_value=mock_pipeline).start()
        
        content_data = {
            "content_id": content_metrics_data["content_id"],
            "content_type": "blog",
            "word_count": 1200,
            "has_image": True,
            "publish_time": 10
        }
        
        prediction_request = {
            "content_id": content_metrics_data["content_id"],
            "content_data": content_data,
            "target_metric": "views",
            "prediction_horizon": 30
        }
        
        response = client.post(
            "/content-analytics/predict",
            json=prediction_request
        )
        
        assert response.status_code == 200
        prediction = response.json()
        assert prediction["content_id"] == content_metrics_data["content_id"]
        assert prediction["target_metric"] == "views"
        assert "predicted_value" in prediction
        assert "confidence_interval_lower" in prediction
        assert "confidence_interval_upper" in prediction
    
    # Step 10: Generate a report
    response = client.post(
        f"/content-analytics/generate-report/{report_id}",
        params={"file_type": "pdf"}
    )
    assert response.status_code == 200
    assert "status" in response.json()
    assert "report_id" in response.json()
    
    # Final step: Ensure data was properly stored and retrieved
    with get_db() as session:
        # Check metrics
        metrics = session.execute(
            f"SELECT * FROM umt.content_metrics WHERE content_id = {content_metrics_data['content_id']}"
        ).fetchall()
        assert len(metrics) > 0
        
        # Check dashboards
        dashboards = session.execute(
            f"SELECT * FROM umt.custom_dashboards WHERE id = {dashboard_id}"
        ).fetchall()
        assert len(dashboards) == 1
        
        # Check reports
        reports = session.execute(
            f"SELECT * FROM umt.analytics_reports WHERE id = {report_id}"
        ).fetchall()
        assert len(reports) == 1