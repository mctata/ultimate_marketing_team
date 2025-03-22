"""
Unit tests for the ContentMetricsService
"""

import pytest
import json
from datetime import datetime, date, timedelta
from unittest.mock import patch, MagicMock, AsyncMock

from src.core.content_metrics import ContentMetricsService
from src.models.system import (
    ContentMetric, ContentAttributionPath, CustomDashboard, 
    AnalyticsReport, ContentPredictionModel, ContentPerformancePrediction
)

# Mock data for tests
@pytest.fixture
def sample_metrics():
    return {
        'views': 100,
        'unique_visitors': 80,
        'likes': 25,
        'shares': 10,
        'comments': 5,
        'clicks': 30,
        'click_through_rate': 0.3,
        'avg_time_on_page': 120,
        'bounce_rate': 0.25,
        'scroll_depth': 0.8,
        'conversions': 5,
        'conversion_rate': 0.05,
        'leads_generated': 3,
        'revenue_generated': 5000,  # cents = $50
        'demographics': {
            'age_groups': {'18-24': 0.2, '25-34': 0.5, '35-44': 0.2, '45+': 0.1},
            'gender': {'male': 0.6, 'female': 0.4}
        },
        'sources': {
            'social': 0.4, 'search': 0.3, 'direct': 0.2, 'referral': 0.1
        },
        'devices': {
            'mobile': 0.6, 'desktop': 0.3, 'tablet': 0.1
        }
    }

@pytest.fixture
def mock_content_metric():
    metric = MagicMock(spec=ContentMetric)
    metric.id = 1
    metric.content_id = 123
    metric.date = datetime(2025, 3, 1)
    metric.platform = 'website'
    metric.views = 100
    metric.unique_visitors = 80
    metric.likes = 25
    metric.shares = 10
    metric.comments = 5
    metric.clicks = 30
    metric.click_through_rate = 0.3
    metric.avg_time_on_page = 120
    metric.bounce_rate = 0.25
    metric.scroll_depth = 0.8
    metric.conversions = 5
    metric.conversion_rate = 0.05
    metric.leads_generated = 3
    metric.revenue_generated = 5000
    metric.serp_position = 3.5
    metric.organic_traffic = 50
    metric.backlinks = 10
    metric.demographics = {
        'age_groups': {'18-24': 0.2, '25-34': 0.5, '35-44': 0.2, '45+': 0.1},
        'gender': {'male': 0.6, 'female': 0.4}
    }
    metric.sources = {
        'social': 0.4, 'search': 0.3, 'direct': 0.2, 'referral': 0.1
    }
    metric.devices = {
        'mobile': 0.6, 'desktop': 0.3, 'tablet': 0.1
    }
    metric.created_at = datetime(2025, 3, 1, 12, 0, 0)
    metric.updated_at = datetime(2025, 3, 1, 12, 0, 0)
    return metric

@pytest.fixture
def mock_attribution_path():
    path = MagicMock(spec=ContentAttributionPath)
    path.id = 1
    path.user_identifier = 'user123'
    path.conversion_id = 'conv456'
    path.conversion_type = 'purchase'
    path.conversion_value = 10000  # $100.00
    path.path = [
        {'content_id': 1, 'timestamp': '2025-03-01T08:00:00', 'platform': 'facebook'},
        {'content_id': 2, 'timestamp': '2025-03-01T09:30:00', 'platform': 'website'},
        {'content_id': 3, 'timestamp': '2025-03-01T10:45:00', 'platform': 'website'}
    ]
    path.first_touch_content_id = 1
    path.last_touch_content_id = 3
    path.conversion_date = datetime(2025, 3, 1, 11, 0, 0)
    path.created_at = datetime(2025, 3, 1, 11, 0, 0)
    return path

class TestContentMetricsService:
    """Test cases for ContentMetricsService"""

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_record_content_metric_new(self, mock_get_db, sample_metrics):
        """Test recording a new content metric"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.first.return_value = None
        
        # Call function
        await ContentMetricsService.record_content_metric(
            content_id=123,
            date=datetime(2025, 3, 1),
            platform='website',
            metrics=sample_metrics
        )
        
        # Assert session.add was called with correct data
        assert mock_session.add.called
        args, _ = mock_session.add.call_args
        new_metric = args[0]
        assert new_metric.content_id == 123
        assert new_metric.platform == 'website'
        assert new_metric.views == 100
        assert new_metric.unique_visitors == 80
        assert mock_session.commit.called

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_record_content_metric_update(self, mock_get_db, mock_content_metric, sample_metrics):
        """Test updating an existing content metric"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.first.return_value = mock_content_metric
        
        # Update some metrics
        updated_metrics = {
            'views': 150,
            'likes': 30
        }
        
        # Call function
        await ContentMetricsService.record_content_metric(
            content_id=123,
            date=datetime(2025, 3, 1),
            platform='website',
            metrics=updated_metrics
        )
        
        # Assert metric was updated correctly
        assert mock_content_metric.views == 150
        assert mock_content_metric.likes == 30
        assert mock_session.commit.called

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_metrics(self, mock_get_db, mock_content_metric):
        """Test retrieving content metrics"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_content_metric]
        
        # Call function
        metrics = await ContentMetricsService.get_content_metrics(
            content_id=123,
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 2),
            platform='website'
        )
        
        # Assert correct data was returned
        assert len(metrics) == 1
        assert metrics[0]['content_id'] == 123
        assert metrics[0]['platform'] == 'website'
        assert metrics[0]['views'] == 100
        assert metrics[0]['revenue_generated'] == 50.0  # Converted from cents to dollars

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_metrics_with_filter(self, mock_get_db, mock_content_metric):
        """Test retrieving content metrics with specific metrics filter"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_content_metric]
        
        # Call function with metrics filter
        metrics = await ContentMetricsService.get_content_metrics(
            content_id=123,
            metrics=['views', 'clicks', 'conversions']
        )
        
        # Assert only requested metrics were returned (plus required ones)
        assert len(metrics) == 1
        assert set(metrics[0].keys()) == {'id', 'content_id', 'date', 'platform', 'views', 'clicks', 'conversions'}

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_performance_summary(self, mock_get_db):
        """Test retrieving aggregated performance summary"""
        # Setup mock session and result row
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        mock_row = MagicMock()
        mock_row.total_views = 1000
        mock_row.total_unique_visitors = 800
        mock_row.total_likes = 250
        mock_row.total_shares = 100
        mock_row.total_comments = 50
        mock_row.total_clicks = 300
        mock_row.avg_ctr = 0.3
        mock_row.avg_time = 120
        mock_row.avg_bounce_rate = 0.25
        mock_row.total_conversions = 50
        mock_row.avg_conversion_rate = 0.05
        mock_row.total_revenue = 50000  # 500 dollars in cents
        mock_row.content_count = 10
        
        mock_session.execute.return_value.first.return_value = mock_row
        
        # Call function
        summary = await ContentMetricsService.get_content_performance_summary(
            content_ids=[1, 2, 3],
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 31)
        )
        
        # Assert summary data is correct
        assert 'summary' in summary
        assert summary['summary']['total_views'] == 1000
        assert summary['summary']['total_revenue'] == 500.0  # Converted from cents to dollars
        assert summary['summary']['content_count'] == 10

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_performance_summary_with_time_series(self, mock_get_db):
        """Test retrieving performance summary with time series grouping"""
        # Setup mock session and result rows
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Create mock time series data
        mock_row1 = MagicMock()
        mock_row1.period = datetime(2025, 3, 1)
        mock_row1.total_views = 300
        mock_row1.total_unique_visitors = 240
        mock_row1.total_likes = 75
        mock_row1.total_shares = 30
        mock_row1.total_comments = 15
        mock_row1.total_clicks = 90
        mock_row1.avg_ctr = 0.3
        mock_row1.avg_time = 120
        mock_row1.avg_bounce_rate = 0.25
        mock_row1.total_conversions = 15
        mock_row1.avg_conversion_rate = 0.05
        mock_row1.total_revenue = 15000  # $150.00 in cents
        
        mock_row2 = MagicMock()
        mock_row2.period = datetime(2025, 3, 2)
        mock_row2.total_views = 350
        mock_row2.total_unique_visitors = 280
        mock_row2.total_likes = 85
        mock_row2.total_shares = 35
        mock_row2.total_comments = 20
        mock_row2.total_clicks = 105
        mock_row2.avg_ctr = 0.3
        mock_row2.avg_time = 125
        mock_row2.avg_bounce_rate = 0.24
        mock_row2.total_conversions = 18
        mock_row2.avg_conversion_rate = 0.051
        mock_row2.total_revenue = 18000  # $180.00 in cents
        
        mock_session.execute.return_value.__iter__.return_value = [mock_row1, mock_row2]
        
        # Call function with time grouping
        summary = await ContentMetricsService.get_content_performance_summary(
            content_ids=[1, 2, 3],
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 31),
            group_by='daily'
        )
        
        # Assert time series data is correct
        assert 'time_series' in summary
        assert len(summary['time_series']) == 2
        assert summary['time_series'][0]['period'] == '2025-03-01'
        assert summary['time_series'][0]['views'] == 300
        assert summary['time_series'][0]['revenue'] == 150.0  # Converted from cents to dollars
        assert summary['time_series'][1]['period'] == '2025-03-02'
        assert summary['time_series'][1]['views'] == 350

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_top_performing_content(self, mock_get_db):
        """Test retrieving top performing content"""
        # Setup mock session and result rows
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Create mock top content data
        mock_row1 = MagicMock()
        mock_row1.content_id = 1
        mock_row1.metric_value = 500
        mock_row1.total_views = 500
        mock_row1.total_conversions = 25
        mock_row1.total_revenue = 25000  # $250.00 in cents
        
        mock_row2 = MagicMock()
        mock_row2.content_id = 2
        mock_row2.metric_value = 450
        mock_row2.total_views = 450
        mock_row2.total_conversions = 22
        mock_row2.total_revenue = 22000  # $220.00 in cents
        
        mock_session.execute.return_value.__iter__.return_value = [mock_row1, mock_row2]
        
        # Call function
        top_content = await ContentMetricsService.get_top_performing_content(
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 31),
            metric='views',
            limit=10
        )
        
        # Assert top content data is correct
        assert len(top_content) == 2
        assert top_content[0]['content_id'] == 1
        assert top_content[0]['views'] == 500
        assert top_content[0]['revenue'] == 250.0  # Converted from cents to dollars
        assert top_content[1]['content_id'] == 2
        assert top_content[1]['views'] == 450

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_comparison(self, mock_get_db):
        """Test comparing content performance"""
        # Setup mock session and result rows
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Create mock comparison data for first content
        mock_row1 = MagicMock()
        mock_row1.total_views = 500
        mock_row1.total_unique_visitors = 400
        mock_row1.total_likes = 125
        mock_row1.total_shares = 50
        mock_row1.total_comments = 25
        mock_row1.total_clicks = 150
        mock_row1.avg_ctr = 0.3
        mock_row1.avg_time = 120
        mock_row1.avg_bounce_rate = 0.25
        mock_row1.total_conversions = 25
        mock_row1.avg_conversion_rate = 0.05
        mock_row1.total_revenue = 25000  # $250.00 in cents
        
        # Create mock comparison data for second content
        mock_row2 = MagicMock()
        mock_row2.total_views = 450
        mock_row2.total_unique_visitors = 360
        mock_row2.total_likes = 110
        mock_row2.total_shares = 45
        mock_row2.total_comments = 22
        mock_row2.total_clicks = 135
        mock_row2.avg_ctr = 0.3
        mock_row2.avg_time = 115
        mock_row2.avg_bounce_rate = 0.27
        mock_row2.total_conversions = 22
        mock_row2.avg_conversion_rate = 0.049
        mock_row2.total_revenue = 22000  # $220.00 in cents
        
        # Setup execute to return different results for different content_ids
        def side_effect(*args, **kwargs):
            result_mock = MagicMock()
            
            # Extract content_id from the query
            query_str = str(args[0])
            if "content_id = 1" in query_str:
                result_mock.first.return_value = mock_row1
            elif "content_id = 2" in query_str:
                result_mock.first.return_value = mock_row2
            else:
                result_mock.first.return_value = None
                
            return result_mock
            
        mock_session.execute.side_effect = side_effect
        
        # Call function
        comparison = await ContentMetricsService.get_content_comparison(
            content_ids=[1, 2],
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 31)
        )
        
        # Assert comparison data is correct
        assert 'comparison' in comparison
        assert len(comparison['comparison']) == 2
        
        # Check first content
        content1 = next((c for c in comparison['comparison'] if c['content_id'] == 1), None)
        assert content1 is not None
        assert content1['metrics']['views'] == 500
        assert content1['metrics']['revenue'] == 250.0
        
        # Check second content
        content2 = next((c for c in comparison['comparison'] if c['content_id'] == 2), None)
        assert content2 is not None
        assert content2['metrics']['views'] == 450
        assert content2['metrics']['revenue'] == 220.0

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_attribution(self, mock_get_db, mock_attribution_path):
        """Test retrieving content attribution data"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_attribution_path]
        
        # Call function with last_touch attribution model
        attribution = await ContentMetricsService.get_content_attribution(
            content_id=3,  # Last touch content ID
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 2),
            attribution_model='last_touch'
        )
        
        # Assert attribution data is correct
        assert attribution['model'] == 'last_touch'
        assert attribution['total_conversions'] == 1
        assert attribution['total_value'] == 100.0  # Converted from cents to dollars
        
        # Check content attribution
        content_attribution = attribution['content_attribution']
        assert len(content_attribution) == 1
        assert content_attribution[0]['content_id'] == 3  # Last touch content ID
        assert content_attribution[0]['attributed_conversions'] == 1
        assert content_attribution[0]['attributed_value'] == 100.0

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.get_db')
    async def test_get_content_attribution_linear_model(self, mock_get_db, mock_attribution_path):
        """Test retrieving content attribution data with linear attribution model"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_attribution_path]
        
        # Call function with linear attribution model
        attribution = await ContentMetricsService.get_content_attribution(
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 2),
            attribution_model='linear'
        )
        
        # Assert attribution data is correct
        assert attribution['model'] == 'linear'
        assert attribution['total_conversions'] == 1
        assert attribution['total_value'] == 100.0  # Converted from cents to dollars
        
        # Check content attribution (all 3 content pieces should have equal attribution)
        content_attribution = attribution['content_attribution']
        assert len(content_attribution) == 3
        
        # Each content should get 1/3 of the credit
        for attr in content_attribution:
            assert attr['attributed_conversions'] == pytest.approx(1/3)
            assert attr['attributed_value'] == pytest.approx(100.0/3)

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.update')
    @patch('src.core.content_metrics.get_db')
    async def test_create_custom_dashboard(self, mock_get_db, mock_update):
        """Test creating a custom dashboard"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Call function
        dashboard = await ContentMetricsService.create_custom_dashboard(
            user_id=123,
            name="My Dashboard",
            description="Test dashboard",
            layout={"columns": 12, "rowHeight": 50},
            widgets=[
                {"id": "widget1", "widget_type": "chart", "title": "Views Over Time"}
            ],
            is_default=True
        )
        
        # Assert dashboard was created correctly
        assert mock_session.add.called
        args, _ = mock_session.add.call_args
        new_dashboard = args[0]
        assert new_dashboard.user_id == 123
        assert new_dashboard.name == "My Dashboard"
        assert new_dashboard.description == "Test dashboard"
        assert new_dashboard.layout == {"columns": 12, "rowHeight": 50}
        assert new_dashboard.is_default is True
        assert mock_session.commit.called
        
        # If setting as default, should update any existing defaults
        if new_dashboard.is_default:
            assert mock_session.execute.called

    @pytest.mark.asyncio
    @patch('src.core.content_metrics.select')
    @patch('src.core.content_metrics.get_db')
    async def test_predict_content_performance(self, mock_get_db, mock_select):
        """Test predicting content performance"""
        # Setup mock session and model
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        mock_model = MagicMock(spec=ContentPredictionModel)
        mock_model.id = 1
        mock_model.name = "Views Predictor"
        mock_model.model_type = "regression"
        mock_model.target_metric = "views"
        mock_model.performance_metrics = {"r2": 0.85, "rmse": 50}
        mock_model.model_path = "/models/views_predictor.pkl"
        
        mock_session.execute.return_value.scalars.return_value.first.return_value = mock_model
        
        # Call function
        content_data = {
            "title": "Test Content",
            "content_type": "blog_post",
            "word_count": 1200,
            "category": "technology"
        }
        
        prediction = await ContentMetricsService.predict_content_performance(
            content_id=123,
            content_data=content_data,
            target_metric="views",
            prediction_horizon=30
        )
        
        # Assert prediction was created correctly
        assert mock_session.add.called
        args, _ = mock_session.add.call_args
        new_prediction = args[0]
        assert new_prediction.content_id == 123
        assert new_prediction.model_id == 1
        assert new_prediction.metric == "views"
        assert new_prediction.features_used == content_data
        assert mock_session.commit.called
        
        # Assert response has correct data
        assert prediction['content_id'] == 123
        assert prediction['target_metric'] == "views"
        assert 'predicted_value' in prediction
        assert 'confidence_interval_lower' in prediction
        assert 'confidence_interval_upper' in prediction
        assert prediction['model']['id'] == 1
        assert prediction['model']['name'] == "Views Predictor"