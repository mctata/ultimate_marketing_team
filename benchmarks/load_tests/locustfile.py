"""
Main locust file for Ultimate Marketing Team performance testing.

This file defines the load testing patterns for the entire platform.
"""

import json
import os
import random
import time
from typing import Dict, List, Optional

from locust import HttpUser, TaskSet, between, task

# Sample data for content generation
SAMPLE_CONTENT_REQUESTS = [
    {
        "project_id": 1,
        "brand_id": 1,
        "content_type": "blog_post",
        "title": "Top 10 Digital Marketing Trends for 2025",
        "keywords": ["digital marketing", "marketing trends", "2025 trends"],
        "word_count": 1200,
        "tone": "professional",
        "target_audience": "marketing professionals"
    },
    {
        "project_id": 2,
        "brand_id": 1,
        "content_type": "social_media",
        "platform": "linkedin",
        "topic": "Content Marketing ROI",
        "tone": "conversational",
        "target_audience": "marketing managers"
    },
    {
        "project_id": 3,
        "brand_id": 2,
        "content_type": "email",
        "subject_line": "Boost Your Marketing Efficiency",
        "tone": "friendly",
        "target_audience": "small business owners"
    }
]

# Login credentials for testing
TEST_CREDENTIALS = [
    {"username": "test_user1", "password": "password123"},
    {"username": "test_user2", "password": "password123"},
    {"username": "test_user3", "password": "password123"}
]

class ContentGenerationBehavior(TaskSet):
    """Task set for content generation API load testing."""
    
    def on_start(self):
        """Log in before running tasks."""
        credentials = random.choice(TEST_CREDENTIALS)
        response = self.client.post(
            "/api/auth/login",
            json=credentials
        )
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.client.headers = {"Authorization": f"Bearer {token}"}
    
    @task(3)
    def create_content(self):
        """Create new content."""
        content_request = random.choice(SAMPLE_CONTENT_REQUESTS)
        with self.client.post(
            "/api/content/generate",
            json=content_request,
            catch_response=True
        ) as response:
            if response.status_code == 202:  # Async operation acceptance
                # Record the task ID for potential polling
                task_id = response.json().get("task_id")
                if task_id:
                    self.user.environment.runner.stats.log_request(
                        request_type="POST",
                        name="/api/content/generate",
                        response_time=response.elapsed.total_seconds() * 1000,
                        response_length=len(response.content),
                        exception=None,
                        context={"task_id": task_id}
                    )
            else:
                response.failure(f"Failed to create content: {response.status_code}")
    
    @task(5)
    def get_content_list(self):
        """Get content listing with filters."""
        params = {
            "page": random.randint(1, 5),
            "limit": random.choice([10, 20, 50]),
            "status": random.choice(["draft", "published", "archived", "all"]),
            "sort": random.choice(["created_at", "updated_at", "title"]),
            "order": random.choice(["asc", "desc"])
        }
        self.client.get("/api/content", params=params)
    
    @task(2)
    def get_content_detail(self):
        """Get detailed content by ID."""
        content_id = random.randint(1, 100)
        self.client.get(f"/api/content/{content_id}")
    
    @task(1)
    def poll_task_status(self):
        """Poll for task completion status."""
        # Simulate polling for an ongoing task
        task_id = f"task-{random.randint(1000, 9999)}"
        self.client.get(f"/api/tasks/{task_id}/status")


class UserAuthBehavior(TaskSet):
    """Task set for user authentication load testing."""
    
    @task(1)
    def login(self):
        """Login to the system."""
        credentials = random.choice(TEST_CREDENTIALS)
        with self.client.post(
            "/api/auth/login",
            json=credentials,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                token = response.json().get("access_token")
                if token:
                    # Successfully logged in
                    self.user.token = token
            else:
                response.failure(f"Login failed: {response.status_code}")
    
    @task(3)
    def get_profile(self):
        """Get user profile details."""
        if hasattr(self.user, 'token'):
            headers = {"Authorization": f"Bearer {self.user.token}"}
            self.client.get("/api/auth/profile", headers=headers)
    
    @task(1)
    def refresh_token(self):
        """Refresh authentication token."""
        if hasattr(self.user, 'token'):
            headers = {"Authorization": f"Bearer {self.user.token}"}
            with self.client.post(
                "/api/auth/refresh",
                headers=headers,
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    new_token = response.json().get("access_token")
                    if new_token:
                        self.user.token = new_token
                else:
                    response.failure(f"Token refresh failed: {response.status_code}")
    
    @task(1)
    def logout(self):
        """Logout from the system."""
        if hasattr(self.user, 'token'):
            headers = {"Authorization": f"Bearer {self.user.token}"}
            self.client.post("/api/auth/logout", headers=headers)
            if hasattr(self.user, 'token'):
                delattr(self.user, 'token')


class APICalls(TaskSet):
    """General API endpoint load testing."""
    
    def on_start(self):
        """Log in before running tasks."""
        credentials = random.choice(TEST_CREDENTIALS)
        response = self.client.post(
            "/api/auth/login",
            json=credentials
        )
        if response.status_code == 200:
            token = response.json().get("access_token")
            self.client.headers = {"Authorization": f"Bearer {token}"}
    
    @task(3)
    def get_brands(self):
        """Get brand listings."""
        params = {
            "page": random.randint(1, 3),
            "limit": random.choice([10, 20, 50])
        }
        self.client.get("/api/brands", params=params)
    
    @task(2)
    def get_brand_detail(self):
        """Get detailed brand information."""
        brand_id = random.randint(1, 10)
        self.client.get(f"/api/brands/{brand_id}")
    
    @task(3)
    def get_campaigns(self):
        """Get campaign listings."""
        params = {
            "page": random.randint(1, 3),
            "limit": random.choice([10, 20, 50]),
            "status": random.choice(["active", "completed", "draft", "all"])
        }
        self.client.get("/api/campaigns", params=params)
    
    @task(2)
    def get_campaign_detail(self):
        """Get detailed campaign information."""
        campaign_id = random.randint(1, 10)
        self.client.get(f"/api/campaigns/{campaign_id}")
    
    @task(1)
    def get_analytics(self):
        """Get analytics data."""
        time_range = random.choice(["day", "week", "month", "quarter", "year"])
        self.client.get(f"/api/analytics?time_range={time_range}")
    
    @task(1)
    def get_ai_metrics(self):
        """Get AI API usage metrics."""
        self.client.get("/api/metrics/ai/daily-costs")


class ContentUser(HttpUser):
    """User class for content-focused load testing."""
    tasks = [ContentGenerationBehavior]
    wait_time = between(5, 15)  # Time between tasks in seconds


class AuthUser(HttpUser):
    """User class for authentication-focused load testing."""
    tasks = [UserAuthBehavior]
    wait_time = between(3, 10)  # Time between tasks in seconds


class APIUser(HttpUser):
    """User class for general API load testing."""
    tasks = [APICalls]
    wait_time = between(1, 5)  # Time between tasks in seconds