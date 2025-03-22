"""
Content Recommendation Engine

This module provides content recommendation functionality based on:
1. Content clustering and similarity
2. User behavior and preferences
3. Performance-based recommendations
"""

import os
import pickle
import json
from typing import Dict, List, Optional, Union, Any, Tuple
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
from sqlalchemy import select, and_, or_, desc, func

from loguru import logger
from src.core.database import get_db
from src.models.system import (
    ContentMetric, ContentAttributionPath
)

# Directory to save recommendation models
MODELS_DIR = os.path.join('models', 'content_recommendations')
os.makedirs(MODELS_DIR, exist_ok=True)

class ContentRecommendationService:
    """Service for generating content recommendations based on various strategies."""
    
    @staticmethod
    async def cluster_similar_content(
        content_features: List[Dict],
        n_clusters: int = 5,
        feature_fields: List[str] = None,
        text_fields: List[str] = None
    ) -> Dict:
        """Cluster content based on features and text similarity.
        
        Args:
            content_features: List of content items with features
            n_clusters: Number of clusters to create
            feature_fields: Numeric/categorical feature fields to use
            text_fields: Text fields to use for TF-IDF vectorization
            
        Returns:
            Dict with clustering results
        """
        if not content_features:
            return {"error": "No content provided for clustering"}
            
        # Default fields if not specified
        if not feature_fields:
            feature_fields = ['content_type', 'word_count', 'publish_time']
            
        if not text_fields:
            text_fields = ['title', 'description', 'tags']
            
        try:
            # Convert to DataFrame
            df = pd.DataFrame(content_features)
            content_ids = df['content_id'].tolist()
            
            # Process numeric/categorical features
            feature_vectors = []
            
            for field in feature_fields:
                if field not in df.columns:
                    continue
                    
                if pd.api.types.is_numeric_dtype(df[field]):
                    # Normalize numeric features
                    normalized = (df[field] - df[field].min()) / (df[field].max() - df[field].min() + 1e-8)
                    feature_vectors.append(normalized.values.reshape(-1, 1))
                else:
                    # One-hot encode categorical features
                    dummies = pd.get_dummies(df[field], prefix=field)
                    feature_vectors.append(dummies.values)
            
            # Process text fields
            text_vectors = []
            
            for field in text_fields:
                if field not in df.columns:
                    continue
                    
                # Fill NaN values
                df[field] = df[field].fillna('')
                
                # Create TF-IDF vectors
                vectorizer = TfidfVectorizer(max_features=100)
                field_vectors = vectorizer.fit_transform(df[field])
                text_vectors.append(field_vectors)
            
            # Combine all feature vectors
            combined_vectors = np.hstack([v for v in feature_vectors + text_vectors if v.shape[0] == len(df)])
            
            if combined_vectors.shape[1] > 50:
                # Reduce dimensionality if we have many features
                pca = PCA(n_components=min(50, combined_vectors.shape[1]))
                combined_vectors = pca.fit_transform(combined_vectors)
            
            # Perform clustering
            kmeans = KMeans(n_clusters=min(n_clusters, len(df)), random_state=42)
            clusters = kmeans.fit_predict(combined_vectors)
            
            # Calculate similarity matrix
            similarity_matrix = cosine_similarity(combined_vectors)
            
            # Create result object
            result = {
                "content_ids": content_ids,
                "clusters": clusters.tolist(),
                "cluster_centers": kmeans.cluster_centers_.tolist(),
                "similarity_matrix": similarity_matrix.tolist(),
                "content_by_cluster": {}
            }
            
            # Group content by cluster
            for i, cluster_id in enumerate(clusters):
                cluster_id_str = str(cluster_id)
                if cluster_id_str not in result["content_by_cluster"]:
                    result["content_by_cluster"][cluster_id_str] = []
                    
                result["content_by_cluster"][cluster_id_str].append({
                    "content_id": content_ids[i],
                    "similarity_scores": similarity_matrix[i].tolist()
                })
            
            # Save model and results
            model_path = os.path.join(MODELS_DIR, f"content_clusters_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pkl")
            with open(model_path, 'wb') as f:
                pickle.dump({
                    "kmeans": kmeans,
                    "content_ids": content_ids,
                    "feature_fields": feature_fields,
                    "text_fields": text_fields,
                    "created_at": datetime.utcnow()
                }, f)
            
            return result
            
        except Exception as e:
            logger.error(f"Error clustering content: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_similar_content(
        content_id: int,
        content_features: List[Dict],
        max_results: int = 5,
        min_similarity: float = 0.5
    ) -> Dict:
        """Get content similar to the specified content.
        
        Args:
            content_id: ID of the reference content
            content_features: List of content items with features
            max_results: Maximum number of similar items to return
            min_similarity: Minimum similarity threshold
            
        Returns:
            Dict with similar content items
        """
        if not content_features:
            return {"error": "No content provided for similarity comparison"}
            
        try:
            # Find the reference content
            reference_item = next((item for item in content_features if item.get('content_id') == content_id), None)
            
            if not reference_item:
                return {"error": f"Content with ID {content_id} not found"}
            
            # Cluster the content
            clustering = await ContentRecommendationService.cluster_similar_content(content_features)
            
            if "error" in clustering:
                return clustering
            
            # Find the index of the reference content
            reference_index = clustering["content_ids"].index(content_id)
            
            # Get similarity scores for the reference content
            similarity_scores = clustering["similarity_matrix"][reference_index]
            
            # Create a list of (content_id, similarity) tuples
            content_similarity = [(clustering["content_ids"][i], similarity_scores[i]) 
                                 for i in range(len(clustering["content_ids"]))]
            
            # Sort by similarity (descending) and filter out the reference content
            sorted_similar = sorted(
                [(cid, score) for cid, score in content_similarity if cid != content_id],
                key=lambda x: x[1],
                reverse=True
            )
            
            # Filter by minimum similarity and limit to max_results
            similar_filtered = [
                {"content_id": cid, "similarity": float(score)}
                for cid, score in sorted_similar
                if score >= min_similarity
            ][:max_results]
            
            return {
                "reference_content_id": content_id,
                "similar_content": similar_filtered
            }
            
        except Exception as e:
            logger.error(f"Error finding similar content: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_top_performing_similar_content(
        content_id: int,
        content_features: List[Dict],
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        max_results: int = 5,
        performance_metric: str = 'views'
    ) -> Dict:
        """Get similar content that has performed well.
        
        Args:
            content_id: ID of the reference content
            content_features: List of content items with features
            start_date: Optional start date for performance data
            end_date: Optional end date for performance data
            max_results: Maximum number of items to return
            performance_metric: Metric to sort by (views, conversions, revenue)
            
        Returns:
            Dict with recommended content items
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
            
        try:
            # Get similar content
            similar_result = await ContentRecommendationService.get_similar_content(
                content_id=content_id,
                content_features=content_features,
                max_results=20,  # Get more than we need so we can filter by performance
                min_similarity=0.3
            )
            
            if "error" in similar_result:
                return similar_result
                
            similar_content_ids = [item["content_id"] for item in similar_result["similar_content"]]
            
            if not similar_content_ids:
                return {"error": "No similar content found"}
            
            # Get performance metrics for the similar content
            with get_db() as session:
                valid_metrics = {
                    'views': func.sum(ContentMetric.views),
                    'unique_visitors': func.sum(ContentMetric.unique_visitors),
                    'engagement': func.sum(ContentMetric.likes + ContentMetric.shares + ContentMetric.comments),
                    'clicks': func.sum(ContentMetric.clicks),
                    'conversions': func.sum(ContentMetric.conversions),
                    'revenue': func.sum(ContentMetric.revenue_generated)
                }
                
                # Use views as default if invalid metric provided
                if performance_metric not in valid_metrics:
                    performance_metric = 'views'
                
                stmt = select(
                    ContentMetric.content_id,
                    valid_metrics[performance_metric].label('metric_value')
                ).where(
                    and_(
                        ContentMetric.content_id.in_(similar_content_ids),
                        ContentMetric.date >= start_date,
                        ContentMetric.date <= end_date
                    )
                ).group_by(
                    ContentMetric.content_id
                ).order_by(
                    desc('metric_value')
                ).limit(max_results)
                
                result = session.execute(stmt)
                performance_data = {row.content_id: row.metric_value for row in result}
            
            # Combine similarity with performance data
            recommendations = []
            
            for item in similar_result["similar_content"]:
                content_id = item["content_id"]
                if content_id in performance_data:
                    recommendations.append({
                        "content_id": content_id,
                        "similarity": item["similarity"],
                        f"{performance_metric}_value": float(performance_data[content_id]),
                        "score": float(item["similarity"] * performance_data[content_id])
                    })
                    
            # Sort by combined score (similarity * performance)
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            
            return {
                "reference_content_id": content_id,
                "performance_metric": performance_metric,
                "recommendations": recommendations[:max_results]
            }
            
        except Exception as e:
            logger.error(f"Error getting top performing similar content: {str(e)}")
            return {"error": str(e)}
    
    @staticmethod
    async def get_recommendations_for_user(
        user_identifier: str,
        content_features: List[Dict],
        max_results: int = 5,
        include_viewed: bool = False,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict:
        """Get content recommendations for a specific user based on their history.
        
        Args:
            user_identifier: ID of the user
            content_features: List of content items with features
            max_results: Maximum number of recommendations to return
            include_viewed: Whether to include content the user has already viewed
            start_date: Optional start date for user history
            end_date: Optional end date for user history
            
        Returns:
            Dict with recommended content items
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=90)
        if not end_date:
            end_date = datetime.utcnow()
            
        try:
            # Get user's content history from attribution paths
            with get_db() as session:
                stmt = select(ContentAttributionPath).where(
                    and_(
                        ContentAttributionPath.user_identifier == user_identifier,
                        ContentAttributionPath.conversion_date >= start_date,
                        ContentAttributionPath.conversion_date <= end_date
                    )
                )
                
                result = session.execute(stmt)
                attribution_paths = result.scalars().all()
                
                # Extract content IDs from user history
                user_content_ids = set()
                content_interaction_counts = {}
                
                for path in attribution_paths:
                    for touchpoint in path.path:
                        content_id = touchpoint.get('content_id')
                        if content_id:
                            user_content_ids.add(content_id)
                            content_interaction_counts[content_id] = content_interaction_counts.get(content_id, 0) + 1
                
                if not user_content_ids:
                    return {"error": "No user history found"}
                
                # Find the most interacted content
                most_interacted = sorted(
                    [(content_id, count) for content_id, count in content_interaction_counts.items()],
                    key=lambda x: x[1],
                    reverse=True
                )
                
                reference_content_id = most_interacted[0][0] if most_interacted else None
                
                if not reference_content_id:
                    return {"error": "No reference content found in user history"}
                
                # Get similar content to the most interacted content
                similar_result = await ContentRecommendationService.get_similar_content(
                    content_id=reference_content_id,
                    content_features=content_features,
                    max_results=20,
                    min_similarity=0.3
                )
                
                if "error" in similar_result:
                    return similar_result
                
                # Filter out already viewed content if requested
                recommendations = similar_result["similar_content"]
                if not include_viewed:
                    recommendations = [
                        item for item in recommendations
                        if item["content_id"] not in user_content_ids
                    ]
                
                return {
                    "user_identifier": user_identifier,
                    "reference_content_id": reference_content_id,
                    "user_history_count": len(user_content_ids),
                    "recommendations": recommendations[:max_results]
                }
                
        except Exception as e:
            logger.error(f"Error getting recommendations for user: {str(e)}")
            return {"error": str(e)}

# Create service instance
content_recommendation_service = ContentRecommendationService()