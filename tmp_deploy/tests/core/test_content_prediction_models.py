"""
Unit tests for ContentPredictionService
"""

import pytest
import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock, mock_open

from src.core.content_prediction_models import ContentPredictionService
from src.models.system import ContentPredictionModel, ContentPerformancePrediction

class TestContentPredictionService:
    """Test cases for ContentPredictionService"""

    @pytest.mark.asyncio
    @patch('src.core.content_prediction_models.get_db')
    @patch('src.core.content_prediction_models.ContentPredictionService.get_training_data')
    @patch('src.core.content_prediction_models.open', new_callable=mock_open)
    @patch('src.core.content_prediction_models.pickle.dump')
    def test_train_model(self, mock_pickle_dump, mock_file, mock_get_training_data, mock_get_db):
        """Test training a new prediction model"""
        # Setup mock training data
        mock_df = pd.DataFrame({
            'content_id': [1, 2, 3, 4, 5],
            'content_type': ['blog', 'social', 'blog', 'email', 'social'],
            'word_count': [1000, 200, 1500, 300, 150],
            'has_image': [True, True, False, True, True],
            'publish_time': [10, 14, 9, 16, 12],
            'views': [1200, 500, 2000, 300, 450]
        })
        mock_get_training_data.return_value = mock_df
        
        # Setup mock database session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        
        # Call function
        result = await ContentPredictionService.train_model(
            target_metric='views',
            features=['content_type', 'word_count', 'has_image', 'publish_time'],
            model_type='random_forest'
        )
        
        # Assert model was saved
        assert mock_pickle_dump.called
        assert mock_file.called
        
        # Assert model was added to database
        assert mock_session.add.called
        assert mock_session.commit.called
        
        # Assert result contains expected keys
        assert 'id' in result
        assert 'name' in result
        assert 'target_metric' in result
        assert 'model_type' in result
        assert 'features' in result
        assert 'performance_metrics' in result
        assert 'training_date' in result
        
        # Assert correct model type and target
        assert result['target_metric'] == 'views'
        assert result['model_type'] == 'random_forest'

    @pytest.mark.asyncio
    @patch('src.core.content_prediction_models.get_db')
    def test_get_training_data(self, mock_get_db):
        """Test retrieving training data"""
        # Setup mock metrics
        mock_metric1 = MagicMock()
        mock_metric1.content_id = 1
        mock_metric1.date = datetime(2025, 2, 1)
        mock_metric1.platform = 'website'
        mock_metric1.views = 1000
        mock_metric1.unique_visitors = 800
        mock_metric1.likes = 50
        mock_metric1.shares = 20
        mock_metric1.comments = 10
        mock_metric1.clicks = 150
        mock_metric1.click_through_rate = 0.15
        mock_metric1.avg_time_on_page = 120
        mock_metric1.bounce_rate = 0.25
        mock_metric1.scroll_depth = 0.7
        mock_metric1.conversions = 5
        mock_metric1.conversion_rate = 0.005
        mock_metric1.revenue_generated = 5000  # In cents
        mock_metric1.demographics = {
            'age_groups': {'18-24': 0.2, '25-34': 0.4, '35-44': 0.3, '45+': 0.1},
            'gender': {'male': 0.6, 'female': 0.4}
        }
        mock_metric1.sources = {
            'social': 0.3, 'search': 0.4, 'direct': 0.2, 'referral': 0.1
        }
        mock_metric1.devices = {
            'mobile': 0.6, 'desktop': 0.3, 'tablet': 0.1
        }
        
        mock_metric2 = MagicMock()
        mock_metric2.content_id = 2
        mock_metric2.date = datetime(2025, 2, 2)
        mock_metric2.platform = 'facebook'
        mock_metric2.views = 500
        mock_metric2.unique_visitors = 450
        mock_metric2.likes = 100
        mock_metric2.shares = 50
        mock_metric2.comments = 25
        mock_metric2.clicks = 75
        mock_metric2.click_through_rate = 0.15
        mock_metric2.avg_time_on_page = None
        mock_metric2.bounce_rate = None
        mock_metric2.scroll_depth = None
        mock_metric2.conversions = 3
        mock_metric2.conversion_rate = 0.006
        mock_metric2.revenue_generated = 3000  # In cents
        mock_metric2.demographics = {
            'age_groups': {'18-24': 0.3, '25-34': 0.5, '35-44': 0.1, '45+': 0.1},
            'gender': {'male': 0.4, 'female': 0.6}
        }
        mock_metric2.sources = None
        mock_metric2.devices = {
            'mobile': 0.8, 'desktop': 0.15, 'tablet': 0.05
        }
        
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.all.return_value = [mock_metric1, mock_metric2]
        
        # Call function
        df = await ContentPredictionService.get_training_data(
            target_metric='views',
            features=['content_id', 'platform', 'likes', 'shares', 'device_mobile'],
            start_date=datetime(2025, 1, 1),
            end_date=datetime(2025, 3, 1)
        )
        
        # Assert dataframe has expected columns and rows
        assert not df.empty
        assert len(df) == 2
        assert 'content_id' in df.columns
        assert 'platform' in df.columns
        assert 'views' in df.columns  # Target metric
        assert 'likes' in df.columns
        assert 'shares' in df.columns
        
        # Verify values
        assert df.iloc[0]['content_id'] == 1
        assert df.iloc[0]['platform'] == 'website'
        assert df.iloc[0]['views'] == 1000
        assert df.iloc[1]['content_id'] == 2
        assert df.iloc[1]['platform'] == 'facebook'
        assert df.iloc[1]['views'] == 500

    @pytest.mark.asyncio
    @patch('src.core.content_prediction_models.os.path.exists')
    @patch('src.core.content_prediction_models.get_db')
    @patch('src.core.content_prediction_models.open', new_callable=mock_open)
    @patch('src.core.content_prediction_models.pickle.load')
    def test_predict(self, mock_pickle_load, mock_file, mock_get_db, mock_path_exists):
        """Test generating predictions with a trained model"""
        # Setup mock model
        mock_model = MagicMock(spec=ContentPredictionModel)
        mock_model.id = 1
        mock_model.name = "Views Predictor"
        mock_model.description = "Predicts content views"
        mock_model.model_type = "random_forest"
        mock_model.target_metric = "views"
        mock_model.features = ["content_type", "word_count", "has_image", "publish_time"]
        mock_model.model_path = "/path/to/model.pkl"
        mock_model.performance_metrics = {"r2": 0.85, "rmse": 100}
        mock_model.training_date = datetime(2025, 2, 1)
        
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.first.return_value = mock_model
        
        # Setup mock model loading
        mock_path_exists.return_value = True
        mock_pipeline = MagicMock()
        mock_pipeline.predict.return_value = np.array([1200])  # Predicted value
        mock_pickle_load.return_value = mock_pipeline
        
        # Test data
        content_data = {
            "content_id": 123,
            "content_type": "blog",
            "word_count": 1200,
            "has_image": True,
            "publish_time": 10
        }
        
        # Call function
        result = await ContentPredictionService.predict(
            model_id=1,
            content_data=content_data,
            prediction_horizon=30
        )
        
        # Assert model was loaded and used for prediction
        assert mock_pickle_load.called
        assert mock_pipeline.predict.called
        
        # Assert prediction was saved
        assert mock_session.add.called
        
        # Verify prediction result
        assert result["content_id"] == 123
        assert result["model_id"] == 1
        assert result["target_metric"] == "views"
        assert result["predicted_value"] == 1200
        assert "confidence_interval_lower" in result
        assert "confidence_interval_upper" in result
        assert "model" in result
        
        # Verify model in result
        assert result["model"]["name"] == "Views Predictor"
        assert result["model"]["type"] == "random_forest"

    @pytest.mark.asyncio
    @patch('src.core.content_prediction_models.os.path.exists')
    @patch('src.core.content_prediction_models.get_db')
    def test_predict_model_not_found(self, mock_get_db, mock_path_exists):
        """Test prediction with non-existent model"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.first.return_value = None
        
        # Test data
        content_data = {
            "content_id": 123,
            "content_type": "blog",
            "word_count": 1200,
            "has_image": True,
            "publish_time": 10
        }
        
        # Call function
        result = await ContentPredictionService.predict(
            model_id=999,  # Non-existent model
            content_data=content_data
        )
        
        # Verify error result
        assert "error" in result
        assert "not found" in result["error"]

    @pytest.mark.asyncio
    @patch('src.core.content_prediction_models.get_db')
    def test_get_model_by_metric(self, mock_get_db):
        """Test getting the best model for a specific metric"""
        # Setup mock model
        mock_model = MagicMock(spec=ContentPredictionModel)
        mock_model.id = 1
        mock_model.name = "Views Predictor"
        mock_model.description = "Predicts content views"
        mock_model.model_type = "random_forest"
        mock_model.target_metric = "views"
        mock_model.features = ["content_type", "word_count", "has_image", "publish_time"]
        mock_model.model_path = "/path/to/model.pkl"
        mock_model.performance_metrics = {"r2": 0.85, "rmse": 100}
        mock_model.training_date = datetime(2025, 2, 1)
        mock_model.last_used = datetime(2025, 3, 1)
        
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.first.return_value = mock_model
        
        # Call function
        result = await ContentPredictionService.get_model_by_metric("views")
        
        # Verify result
        assert result is not None
        assert result["id"] == 1
        assert result["name"] == "Views Predictor"
        assert result["target_metric"] == "views"
        assert "performance_metrics" in result
        assert "training_date" in result
        assert "last_used" in result

    @pytest.mark.asyncio
    @patch('src.core.content_prediction_models.get_db')
    def test_get_model_by_metric_not_found(self, mock_get_db):
        """Test getting model for metric with no models"""
        # Setup mock session
        mock_session = MagicMock()
        mock_get_db.return_value.__enter__.return_value = mock_session
        mock_session.execute.return_value.scalars.return_value.first.return_value = None
        
        # Call function
        result = await ContentPredictionService.get_model_by_metric("unknown_metric")
        
        # Verify result
        assert result is None