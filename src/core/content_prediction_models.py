"""
Content Performance Prediction Models

This module implements machine learning models for predicting content performance
metrics such as views, clicks, conversions, and revenue.

Models are trained on historical content performance data and can predict
future performance based on content attributes.
"""

import os
import pickle
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union, Any, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

from loguru import logger
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from src.core.database import get_db
from src.models.system import (
    ContentMetric, ContentPredictionModel, ContentPerformancePrediction
)

# Directory to save models
MODELS_DIR = os.path.join('models', 'content_prediction')
os.makedirs(MODELS_DIR, exist_ok=True)

class ContentPredictionService:
    """Service for training and using content performance prediction models"""

    @staticmethod
    async def train_model(
        target_metric: str,
        features: List[str],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        model_type: str = "random_forest",
        model_params: Optional[Dict] = None
    ) -> Dict:
        """Train a new prediction model on historical content data.
        
        Args:
            target_metric: Metric to predict (views, clicks, conversions, etc.)
            features: List of content features to use
            start_date: Start date for training data
            end_date: End date for training data
            model_type: Type of model to train
            model_params: Optional parameters for the model
            
        Returns:
            Dict with model information
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=180)
        if not end_date:
            end_date = datetime.utcnow()
            
        try:
            # Get training data
            training_data = await ContentPredictionService.get_training_data(
                target_metric=target_metric,
                features=features,
                start_date=start_date,
                end_date=end_date
            )
            
            if training_data.empty:
                return {"error": "No training data available"}
                
            # Convert date features
            for col in training_data.columns:
                if pd.api.types.is_datetime64_any_dtype(training_data[col]):
                    training_data[f"{col}_month"] = training_data[col].dt.month
                    training_data[f"{col}_day"] = training_data[col].dt.day
                    training_data[f"{col}_weekday"] = training_data[col].dt.weekday
                    training_data = training_data.drop(col, axis=1)
            
            # Split features and target
            X = training_data.drop(target_metric, axis=1)
            y = training_data[target_metric]
            
            # Split data for training and validation
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
            
            # Identify numeric and categorical features
            numeric_features = X.select_dtypes(include=['int64', 'float64']).columns.tolist()
            categorical_features = X.select_dtypes(include=['object', 'category']).columns.tolist()
            
            # Create preprocessing pipeline
            preprocessor = ColumnTransformer(
                transformers=[
                    ('num', StandardScaler(), numeric_features),
                    ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
                ]
            )
            
            # Select model based on model_type
            if model_type == "random_forest":
                model_params = model_params or {"n_estimators": 100, "max_depth": 10}
                model = RandomForestRegressor(**model_params)
            elif model_type == "gradient_boosting":
                model_params = model_params or {"n_estimators": 100, "learning_rate": 0.1}
                model = GradientBoostingRegressor(**model_params)
            elif model_type == "linear":
                model_params = model_params or {}
                model = LinearRegression(**model_params)
            elif model_type == "ridge":
                model_params = model_params or {"alpha": 1.0}
                model = Ridge(**model_params)
            elif model_type == "lasso":
                model_params = model_params or {"alpha": 1.0}
                model = Lasso(**model_params)
            else:
                model_type = "random_forest"
                model_params = {"n_estimators": 100, "max_depth": 10}
                model = RandomForestRegressor(**model_params)
            
            # Create pipeline with preprocessing and model
            pipeline = Pipeline([
                ('preprocessor', preprocessor),
                ('model', model)
            ])
            
            # Train model
            pipeline.fit(X_train, y_train)
            
            # Evaluate model
            y_pred = pipeline.predict(X_test)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            r2 = r2_score(y_test, y_pred)
            mae = mean_absolute_error(y_test, y_pred)
            
            # Create model metadata
            model_name = f"{target_metric}_{model_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            model_path = os.path.join(MODELS_DIR, f"{model_name}.pkl")
            
            # Save model
            with open(model_path, 'wb') as f:
                pickle.dump(pipeline, f)
            
            # Store model in database
            with get_db() as session:
                model_record = ContentPredictionModel(
                    name=model_name,
                    description=f"Prediction model for {target_metric} using {model_type}",
                    model_type=model_type,
                    target_metric=target_metric,
                    features=features,
                    model_path=model_path,
                    performance_metrics={
                        "mse": mse,
                        "rmse": rmse,
                        "r2": r2,
                        "mae": mae,
                        "samples": len(X)
                    },
                    training_date=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                session.add(model_record)
                session.commit()
                session.refresh(model_record)
                
                return {
                    "id": model_record.id,
                    "name": model_record.name,
                    "target_metric": model_record.target_metric,
                    "model_type": model_record.model_type,
                    "features": model_record.features,
                    "performance_metrics": model_record.performance_metrics,
                    "training_date": model_record.training_date.isoformat() if model_record.training_date else None
                }
                
        except Exception as e:
            logger.error(f"Error training prediction model: {str(e)}")
            return {"error": str(e)}

    @staticmethod
    async def get_training_data(
        target_metric: str,
        features: List[str],
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """Get training data for model creation.
        
        Args:
            target_metric: Metric to predict
            features: List of features to include
            start_date: Start date for data
            end_date: End date for data
            
        Returns:
            DataFrame with training data
        """
        try:
            with get_db() as session:
                # Get content metrics data
                stmt = select(ContentMetric).where(
                    and_(
                        ContentMetric.date >= start_date,
                        ContentMetric.date <= end_date
                    )
                )
                
                result = session.execute(stmt)
                metrics = result.scalars().all()
                
                if not metrics:
                    return pd.DataFrame()
                
                # Convert to dataframe
                metrics_data = []
                for metric in metrics:
                    metric_dict = {
                        'content_id': metric.content_id,
                        'date': metric.date,
                        'platform': metric.platform,
                        'views': metric.views,
                        'unique_visitors': metric.unique_visitors,
                        'likes': metric.likes,
                        'shares': metric.shares,
                        'comments': metric.comments,
                        'clicks': metric.clicks,
                        'click_through_rate': metric.click_through_rate,
                        'avg_time_on_page': metric.avg_time_on_page,
                        'bounce_rate': metric.bounce_rate,
                        'scroll_depth': metric.scroll_depth,
                        'conversions': metric.conversions,
                        'conversion_rate': metric.conversion_rate,
                        'revenue_generated': metric.revenue_generated / 100  # Convert cents to dollars
                    }
                    
                    # Extract demographics if available
                    if metric.demographics:
                        for age_group, percentage in metric.demographics.get('age_groups', {}).items():
                            metric_dict[f'age_group_{age_group}'] = percentage
                        for gender, percentage in metric.demographics.get('gender', {}).items():
                            metric_dict[f'gender_{gender}'] = percentage
                    
                    # Extract sources if available
                    if metric.sources:
                        for source, percentage in metric.sources.items():
                            metric_dict[f'source_{source}'] = percentage
                    
                    # Extract devices if available
                    if metric.devices:
                        for device, percentage in metric.devices.items():
                            metric_dict[f'device_{device}'] = percentage
                    
                    metrics_data.append(metric_dict)
                
                df = pd.DataFrame(metrics_data)
                
                # TODO: In a full implementation, we'd join with content data
                # to get actual content features (title, type, author, etc.)
                # For now, we'll simulate this by creating random features
                # In production, this would be replaced with actual content data
                
                # Ensure target metric exists in the dataframe
                if target_metric not in df.columns:
                    raise ValueError(f"Target metric {target_metric} not found in data")
                
                # Filter to relevant columns
                valid_columns = [col for col in features if col in df.columns]
                valid_columns.append(target_metric)
                
                return df[valid_columns]
                
        except Exception as e:
            logger.error(f"Error getting training data: {str(e)}")
            return pd.DataFrame()

    @staticmethod
    async def predict(
        model_id: int,
        content_data: Dict[str, Any],
        prediction_horizon: int = 30
    ) -> Dict:
        """Generate prediction for content performance.
        
        Args:
            model_id: ID of the prediction model to use
            content_data: Content features for prediction
            prediction_horizon: Number of days to predict into the future
            
        Returns:
            Dict with prediction results
        """
        try:
            with get_db() as session:
                # Get model
                stmt = select(ContentPredictionModel).where(
                    ContentPredictionModel.id == model_id
                )
                
                result = session.execute(stmt)
                model_record = result.scalars().first()
                
                if not model_record:
                    return {"error": f"Model with ID {model_id} not found"}
                
                # Check if model file exists
                if not os.path.exists(model_record.model_path):
                    return {"error": f"Model file not found at {model_record.model_path}"}
                
                # Load model
                with open(model_record.model_path, 'rb') as f:
                    pipeline = pickle.load(f)
                
                # Prepare features
                features = pd.DataFrame([content_data])
                
                # Make prediction
                try:
                    predicted_value = pipeline.predict(features)[0]
                    
                    # Calculate confidence interval based on model performance
                    rmse = model_record.performance_metrics.get('rmse', predicted_value * 0.2)
                    confidence_interval_lower = max(0, predicted_value - 1.96 * rmse)
                    confidence_interval_upper = predicted_value + 1.96 * rmse
                    
                    # Record prediction
                    prediction = ContentPerformancePrediction(
                        content_id=content_data.get('content_id'),
                        model_id=model_id,
                        prediction_date=datetime.utcnow() + timedelta(days=prediction_horizon),
                        metric=model_record.target_metric,
                        predicted_value=predicted_value,
                        confidence_interval_lower=confidence_interval_lower,
                        confidence_interval_upper=confidence_interval_upper,
                        features_used=content_data,
                        created_at=datetime.utcnow()
                    )
                    
                    session.add(prediction)
                    session.commit()
                    session.refresh(prediction)
                    
                    # Update model last_used timestamp
                    model_record.last_used = datetime.utcnow()
                    session.commit()
                    
                    return {
                        "content_id": content_data.get('content_id'),
                        "model_id": model_id,
                        "target_metric": model_record.target_metric,
                        "prediction_date": prediction.prediction_date.isoformat(),
                        "predicted_value": predicted_value,
                        "confidence_interval_lower": confidence_interval_lower,
                        "confidence_interval_upper": confidence_interval_upper,
                        "features_used": list(content_data.keys()),
                        "model": {
                            "name": model_record.name,
                            "type": model_record.model_type,
                            "performance": model_record.performance_metrics
                        }
                    }
                    
                except Exception as e:
                    logger.error(f"Error making prediction: {str(e)}")
                    return {"error": f"Prediction error: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Error predicting content performance: {str(e)}")
            return {"error": str(e)}

    @staticmethod
    async def get_model_by_metric(target_metric: str) -> Optional[Dict]:
        """Get the best model for a specific metric.
        
        Args:
            target_metric: Target metric to predict
            
        Returns:
            Dict with model information or None if not found
        """
        try:
            with get_db() as session:
                # Get the best model for this metric (highest R²)
                stmt = select(ContentPredictionModel).where(
                    ContentPredictionModel.target_metric == target_metric
                ).order_by(
                    # Order by R² (higher is better)
                    desc(func.json_extract(
                        ContentPredictionModel.performance_metrics, '$.r2'
                    ).cast(float))
                ).limit(1)
                
                result = session.execute(stmt)
                model = result.scalars().first()
                
                if not model:
                    return None
                
                return {
                    "id": model.id,
                    "name": model.name,
                    "description": model.description,
                    "model_type": model.model_type,
                    "target_metric": model.target_metric,
                    "features": model.features,
                    "performance_metrics": model.performance_metrics,
                    "training_date": model.training_date.isoformat() if model.training_date else None,
                    "last_used": model.last_used.isoformat() if model.last_used else None
                }
                
        except Exception as e:
            logger.error(f"Error getting model for metric {target_metric}: {str(e)}")
            return None

# Create service instance
content_prediction_service = ContentPredictionService()