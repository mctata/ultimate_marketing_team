"""
Content Generation Specific Load Tests

This script provides more focused load testing for the content generation functionality,
simulating various types of content requests with different complexities.
"""

import json
import random
from typing import Dict, List, Optional

from locust import HttpUser, TaskSet, between, task, events
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Different content types with varying complexity
CONTENT_REQUESTS = {
    "simple": [
        {
            "project_id": 1,
            "brand_id": 1,
            "content_type": "social_media",
            "platform": "twitter",
            "topic": "Quick Marketing Tip",
            "tone": "casual",
            "target_audience": "general public",
            "complexity": "low"
        },
        {
            "project_id": 1,
            "brand_id": 2,
            "content_type": "social_media",
            "platform": "instagram",
            "topic": "Product Highlight",
            "tone": "enthusiastic",
            "target_audience": "consumers",
            "complexity": "low"
        }
    ],
    "medium": [
        {
            "project_id": 2,
            "brand_id": 1,
            "content_type": "blog_post",
            "title": "5 Ways to Improve Your Marketing Strategy",
            "keywords": ["marketing strategy", "improvement", "techniques"],
            "word_count": 800,
            "tone": "informative",
            "target_audience": "marketing professionals",
            "complexity": "medium"
        },
        {
            "project_id": 2,
            "brand_id": 3,
            "content_type": "email",
            "subject_line": "Your Monthly Marketing Insights",
            "tone": "professional",
            "target_audience": "subscribers",
            "word_count": 500,
            "complexity": "medium"
        }
    ],
    "complex": [
        {
            "project_id": 3,
            "brand_id": 2,
            "content_type": "whitepaper",
            "title": "The Future of AI in Digital Marketing: 2025 and Beyond",
            "keywords": ["AI marketing", "future trends", "machine learning", "digital marketing"],
            "word_count": 2500,
            "tone": "analytical",
            "target_audience": "executives",
            "research_depth": "extensive",
            "include_case_studies": True,
            "complexity": "high"
        },
        {
            "project_id": 3,
            "brand_id": 1,
            "content_type": "research_report",
            "title": "Market Analysis: Emerging Trends in Consumer Behavior",
            "keywords": ["market analysis", "consumer behavior", "trends", "market research"],
            "word_count": 3000,
            "tone": "academic",
            "target_audience": "researchers",
            "data_visualization": True,
            "statistical_analysis": True,
            "complexity": "high"
        }
    ]
}

# Test user credentials
TEST_USERS = [
    {"username": "content_tester1", "password": "password123"},
    {"username": "content_tester2", "password": "password123"},
    {"username": "content_tester3", "password": "password123"}
]

class ContentGenerationTest(TaskSet):
    """Task set for testing content generation with varying complexity."""
    
    def on_start(self):
        """Login at the start of the test."""
        credentials = random.choice(TEST_USERS)
        with self.client.post(
            "/api/auth/login",
            json=credentials,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.client.headers = {"Authorization": f"Bearer {data['access_token']}"}
                logger.info(f"Logged in as {credentials['username']}")
            else:
                logger.error(f"Login failed: {response.status_code}")
    
    @task(5)
    def generate_simple_content(self):
        """Generate simple content (social media posts, etc.)"""
        request_data = random.choice(CONTENT_REQUESTS["simple"])
        start_time = time.time()
        
        with self.client.post(
            "/api/content/generate",
            json=request_data,
            catch_response=True,
            name="Generate Simple Content"
        ) as response:
            duration = time.time() - start_time
            if response.status_code in [200, 201, 202]:
                logger.info(f"Simple content generation: {duration:.2f}s")
                
                # If async operation, store task_id for later polling
                if response.status_code == 202:
                    task_id = response.json().get("task_id")
                    if task_id:
                        self.user.environment.runner.stats.log_request(
                            request_type="POST",
                            name="Queue Simple Content",
                            response_time=duration * 1000,
                            response_length=len(response.content),
                            context={"task_id": task_id, "complexity": "low"}
                        )
            else:
                error_msg = f"Simple content generation failed: {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
    
    @task(3)
    def generate_medium_content(self):
        """Generate medium complexity content (blog posts, emails)"""
        request_data = random.choice(CONTENT_REQUESTS["medium"])
        start_time = time.time()
        
        with self.client.post(
            "/api/content/generate",
            json=request_data,
            catch_response=True,
            name="Generate Medium Content"
        ) as response:
            duration = time.time() - start_time
            if response.status_code in [200, 201, 202]:
                logger.info(f"Medium content generation: {duration:.2f}s")
                
                # If async operation, store task_id for later polling
                if response.status_code == 202:
                    task_id = response.json().get("task_id")
                    if task_id:
                        self.user.environment.runner.stats.log_request(
                            request_type="POST",
                            name="Queue Medium Content",
                            response_time=duration * 1000,
                            response_length=len(response.content),
                            context={"task_id": task_id, "complexity": "medium"}
                        )
            else:
                error_msg = f"Medium content generation failed: {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
    
    @task(1)
    def generate_complex_content(self):
        """Generate complex content (whitepapers, research reports)"""
        request_data = random.choice(CONTENT_REQUESTS["complex"])
        start_time = time.time()
        
        with self.client.post(
            "/api/content/generate",
            json=request_data,
            catch_response=True,
            name="Generate Complex Content"
        ) as response:
            duration = time.time() - start_time
            if response.status_code in [200, 201, 202]:
                logger.info(f"Complex content generation: {duration:.2f}s")
                
                # If async operation, store task_id for later polling
                if response.status_code == 202:
                    task_id = response.json().get("task_id")
                    if task_id:
                        self.user.environment.runner.stats.log_request(
                            request_type="POST",
                            name="Queue Complex Content",
                            response_time=duration * 1000,
                            response_length=len(response.content),
                            context={"task_id": task_id, "complexity": "high"}
                        )
            else:
                error_msg = f"Complex content generation failed: {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
    
    @task(4)
    def poll_task_status(self):
        """Poll for task completion status."""
        # Randomly generate a task ID or use one from context if available
        task_id = f"task-{random.randint(1000, 9999)}"
        
        with self.client.get(
            f"/api/tasks/{task_id}/status",
            name="Poll Task Status",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                status_data = response.json()
                if status_data.get("status") == "completed":
                    logger.info(f"Task {task_id} completed in {status_data.get('execution_time', 'unknown')}ms")
            elif response.status_code != 404:  # Ignore 404s for random task IDs
                response.failure(f"Failed to poll task: {response.status_code}")


class ContentLoadTest(HttpUser):
    """User class for content generation load testing."""
    tasks = [ContentGenerationTest]
    wait_time = between(3, 8)  # Wait time between tasks

# Additional setup for capturing metrics during the test
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    logger.info("Content generation load test starting...")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    logger.info("Content generation load test completed.")
    # Generate summary report
    stats = environment.runner.stats
    logger.info(f"Total requests: {stats.total.num_requests}")
    logger.info(f"Failed requests: {stats.total.num_failures}")
    logger.info(f"Median response time: {stats.total.median_response_time}ms")
    logger.info(f"95th percentile: {stats.total.get_response_time_percentile(0.95)}ms")
    logger.info(f"Requests per second: {stats.total.current_rps}")


if __name__ == "__main__":
    # This allows running this file directly for testing purposes
    import subprocess
    import sys
    
    cmd = [
        "locust", 
        "-f", __file__,
        "--host=http://localhost:8000",  # Default host
        "--users=20", 
        "--spawn-rate=5",
        "--run-time=1m",
        "--headless",
        "--only-summary"
    ]
    
    # Allow overriding settings from command line
    if len(sys.argv) > 1:
        cmd.extend(sys.argv[1:])
    
    subprocess.run(cmd)