"""
Load testing for Content Analytics API endpoints

This script contains locust tests for measuring the performance of
content analytics API endpoints under various load conditions.
"""

import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List

from locust import HttpUser, task, between, TaskSet

class ContentAnalyticsAPIUser(HttpUser):
    """User for content analytics API load testing"""
    
    # Wait between 1 and 3 seconds between tasks
    wait_time = between(1, 3)
    
    # Test data
    content_ids = list(range(1, 100))  # 1-99
    platforms = ["website", "facebook", "twitter", "linkedin", "instagram", "email"]
    metrics = ["views", "clicks", "conversions", "revenue", "bounce_rate", "time_on_page", "ctr", "engagement"]
    attribution_models = ["first_touch", "last_touch", "linear", "position_based"]
    
    def on_start(self):
        """Login before starting tests"""
        # Authenticate with test user
        self.client.post("/auth/token", 
                        data={"username": "performance_test_user", "password": "test1234"})
    
    def generate_content_metrics(self) -> Dict[str, Any]:
        """Generate random content metrics data"""
        return {
            "views": random.randint(100, 10000),
            "unique_visitors": random.randint(80, 8000),
            "likes": random.randint(10, 500),
            "shares": random.randint(5, 200),
            "comments": random.randint(2, 100),
            "clicks": random.randint(20, 2000),
            "click_through_rate": round(random.uniform(0.01, 0.2), 3),
            "avg_time_on_page": random.randint(30, 300),
            "bounce_rate": round(random.uniform(0.1, 0.9), 3),
            "scroll_depth": round(random.uniform(0.1, 1.0), 3),
            "conversions": random.randint(1, 100),
            "conversion_rate": round(random.uniform(0.001, 0.1), 4),
            "leads_generated": random.randint(1, 50),
            "revenue_generated": random.randint(500, 100000),
            "demographics": {
                "age_groups": {
                    "18-24": round(random.uniform(0.1, 0.3), 2),
                    "25-34": round(random.uniform(0.2, 0.4), 2),
                    "35-44": round(random.uniform(0.1, 0.3), 2),
                    "45+": round(random.uniform(0.1, 0.3), 2)
                },
                "gender": {
                    "male": round(random.uniform(0.4, 0.6), 2),
                    "female": round(random.uniform(0.4, 0.6), 2)
                }
            },
            "sources": {
                "social": round(random.uniform(0.1, 0.4), 2), 
                "search": round(random.uniform(0.1, 0.4), 2), 
                "direct": round(random.uniform(0.1, 0.3), 2), 
                "referral": round(random.uniform(0.05, 0.2), 2)
            },
            "devices": {
                "mobile": round(random.uniform(0.4, 0.7), 2), 
                "desktop": round(random.uniform(0.2, 0.5), 2), 
                "tablet": round(random.uniform(0.05, 0.2), 2)
            }
        }
    
    def random_date(self, start_days_ago: int = 90, end_days_ago: int = 0) -> str:
        """Generate a random date in ISO format"""
        start_date = (datetime.now() - timedelta(days=start_days_ago)).date()
        end_date = (datetime.now() - timedelta(days=end_days_ago)).date()
        
        # Random days between start and end
        days_diff = (end_date - start_date).days
        random_days = random.randint(0, max(0, days_diff))
        
        random_date = start_date + timedelta(days=random_days)
        return random_date.isoformat()
    
    @task(1)
    def record_metrics(self):
        """Record content metrics"""
        content_id = random.choice(self.content_ids)
        platform = random.choice(self.platforms)
        date = self.random_date(start_days_ago=7, end_days_ago=0)
        
        data = {
            "content_id": content_id,
            "date": date,
            "platform": platform,
            "metrics": self.generate_content_metrics()
        }
        
        with self.client.post("/content-analytics/metrics", 
                             json=data, 
                             catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to record metrics: {response.text}")
    
    @task(5)
    def get_metrics(self):
        """Get content metrics"""
        content_id = random.choice(self.content_ids)
        platform = random.choice(self.platforms)
        
        # Randomly choose a subset of metrics
        selected_metrics = random.sample(self.metrics, random.randint(1, len(self.metrics)))
        metrics_param = ",".join(selected_metrics)
        
        with self.client.get(f"/content-analytics/metrics?content_id={content_id}&platform={platform}&metrics={metrics_param}", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get metrics: {response.text}")
    
    @task(3)
    def get_performance_summary(self):
        """Get content performance summary"""
        # Randomly select 1-5 content IDs
        selected_content_ids = random.sample(self.content_ids, random.randint(1, 5))
        content_ids_param = ",".join(map(str, selected_content_ids))
        
        # Randomly choose a time grouping
        group_by = random.choice([None, "daily", "weekly", "monthly"])
        group_param = f"&group_by={group_by}" if group_by else ""
        
        with self.client.get(f"/content-analytics/performance?content_ids={content_ids_param}{group_param}", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get performance summary: {response.text}")
    
    @task(2)
    def get_top_performing(self):
        """Get top performing content"""
        metric = random.choice(self.metrics)
        limit = random.randint(5, 20)
        
        with self.client.get(f"/content-analytics/top-performing?metric={metric}&limit={limit}", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get top performing content: {response.text}")
    
    @task(2)
    def get_content_comparison(self):
        """Get content comparison"""
        # Randomly select 2-4 content IDs
        selected_content_ids = random.sample(self.content_ids, random.randint(2, 4))
        content_ids_param = ",".join(map(str, selected_content_ids))
        
        # Randomly choose a subset of metrics
        selected_metrics = random.sample(self.metrics, random.randint(1, len(self.metrics)))
        metrics_param = ",".join(selected_metrics)
        
        with self.client.get(f"/content-analytics/comparison?content_ids={content_ids_param}&metrics={metrics_param}", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get content comparison: {response.text}")
    
    @task(1)
    def get_content_attribution(self):
        """Get content attribution"""
        # Randomly select content ID (or None for all content)
        content_id = random.choice([None] + self.content_ids)
        content_param = f"&content_id={content_id}" if content_id else ""
        
        # Randomly choose attribution model
        attribution_model = random.choice(self.attribution_models)
        
        with self.client.get(f"/content-analytics/attribution?attribution_model={attribution_model}{content_param}", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get content attribution: {response.text}")
    
    @task(1)
    def create_custom_dashboard(self):
        """Create a custom dashboard"""
        # Create dashboard with random widgets
        widget_types = ["metric_card", "chart", "table", "top_content", "comparison", "attribution"]
        chart_types = ["line", "bar", "pie", "area", "radar"]
        
        # Generate 1-6 random widgets
        num_widgets = random.randint(1, 6)
        widgets = []
        
        for i in range(num_widgets):
            widget_type = random.choice(widget_types)
            widget = {
                "id": f"widget_{i+1}",
                "widget_type": widget_type,
                "title": f"Test Widget {i+1}",
                "i": f"widget_{i+1}",
                "x": (i * 6) % 12,  # Arrange in a grid
                "y": (i // 2) * 4,
                "w": 6,
                "h": 4,
                "settings": {
                    "metric": random.choice(self.metrics) if widget_type == "metric_card" else None,
                    "chart_type": random.choice(chart_types) if widget_type == "chart" else None,
                    "content_ids": random.sample(self.content_ids, random.randint(1, 3)),
                    "time_range": "last_30_days"
                }
            }
            widgets.append(widget)
        
        data = {
            "name": f"Test Dashboard {random.randint(1, 1000)}",
            "description": "Performance test dashboard",
            "layout": {
                "columns": 12,
                "rowHeight": 50,
                "compactType": "vertical",
                "is_draggable": True,
                "is_resizable": True
            },
            "widgets": widgets,
            "is_default": random.choice([True, False])
        }
        
        with self.client.post("/content-analytics/dashboards", 
                             json=data, 
                             catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to create dashboard: {response.text}")
    
    @task(3)
    def get_dashboards(self):
        """Get custom dashboards"""
        with self.client.get("/content-analytics/dashboards", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get dashboards: {response.text}")
    
    @task(1)
    def create_analytics_report(self):
        """Create analytics report"""
        report_types = ["content", "campaign", "competitor", "executive"]
        template_ids = ["basic", "detailed", "executive", "social_media", "seo"]
        schedule_types = ["none", "daily", "weekly", "monthly"]
        
        # Generate a random report config
        data = {
            "name": f"Test Report {random.randint(1, 1000)}",
            "description": "Performance test report",
            "report_type": random.choice(report_types),
            "template_id": random.choice(template_ids),
            "config": {
                "date_range": {"type": "last_30_days"},
                "metrics": random.sample(self.metrics, random.randint(2, len(self.metrics))),
                "filters": {
                    "platforms": random.sample(self.platforms, random.randint(1, len(self.platforms)))
                },
                "grouping": random.choice([None, "daily", "weekly"])
            },
            "schedule_type": random.choice(schedule_types),
            "schedule_config": {"day": random.randint(1, 28), "time": "09:00"} if schedule_types != "none" else None,
            "recipients": ["test@example.com"]
        }
        
        with self.client.post("/content-analytics/reports", 
                             json=data, 
                             catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to create report: {response.text}")
    
    @task(2)
    def get_reports(self):
        """Get analytics reports"""
        with self.client.get("/content-analytics/reports", 
                            catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get reports: {response.text}")
    
    @task(1)
    def predict_content_performance(self):
        """Predict content performance"""
        content_id = random.choice(self.content_ids)
        
        # Generate content data
        content_types = ["blog_post", "social_media", "email", "landing_page", "product_page"]
        categories = ["technology", "business", "marketing", "finance", "lifestyle", "health"]
        
        data = {
            "content_id": content_id,
            "content_data": {
                "title": f"Test Content {content_id}",
                "content_type": random.choice(content_types),
                "word_count": random.randint(300, 3000),
                "category": random.choice(categories),
                "has_images": random.choice([True, False]),
                "has_video": random.choice([True, False]),
                "readability_score": random.randint(50, 95),
                "sentiment_score": round(random.uniform(-1.0, 1.0), 2),
                "keyword_density": round(random.uniform(1.0, 5.0), 2),
                "publish_day": random.choice(["monday", "tuesday", "wednesday", "thursday", "friday"]),
                "publish_hour": random.randint(8, 18)
            },
            "target_metric": random.choice(self.metrics),
            "prediction_horizon": random.choice([7, 14, 30, 60, 90])
        }
        
        with self.client.post("/content-analytics/predict", 
                             json=data, 
                             catch_response=True) as response:
            if response.status_code != 200:
                response.failure(f"Failed to predict content performance: {response.text}")