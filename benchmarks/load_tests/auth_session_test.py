"""
Authentication and Session Management Load Test

This script focuses on testing authentication endpoints, session handling,
and token management under high load conditions.
"""

import json
import random
import time
import logging
from typing import Dict, List, Optional

from locust import HttpUser, TaskSet, between, task, events

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test user credentials (in a real scenario, these would be generated dynamically)
TEST_USERS = [
    {"username": f"bench_user{i}", "password": "password123"} 
    for i in range(1, 101)  # 100 test users
]

class AuthSessionTest(TaskSet):
    """Task set for testing authentication and session management."""
    
    def __init__(self, parent):
        super().__init__(parent)
        self.token = None
        self.refresh_token = None
        self.logged_in = False
    
    @task(10)
    def login(self):
        """Log in to the application."""
        if self.logged_in:
            return
            
        credentials = random.choice(TEST_USERS)
        with self.client.post(
            "/api/auth/login", 
            json=credentials,
            catch_response=True,
            name="User Login"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.refresh_token = data.get("refresh_token")
                if self.token:
                    self.logged_in = True
                    logger.debug(f"Login successful for {credentials['username']}")
                    return
            
            # Record failure if login unsuccessful
            error_msg = f"Login failed with status {response.status_code}"
            logger.error(error_msg)
            response.failure(error_msg)
    
    @task(5)
    def get_profile(self):
        """Get the user profile information."""
        if not self.logged_in or not self.token:
            return
            
        with self.client.get(
            "/api/auth/profile",
            headers={"Authorization": f"Bearer {self.token}"},
            catch_response=True,
            name="Get User Profile"
        ) as response:
            if response.status_code == 200:
                logger.debug("Profile retrieval successful")
            elif response.status_code == 401:
                logger.debug("Token expired, will refresh")
                self.logged_in = False
                response.success()  # Mark as success since this is expected behavior
            else:
                error_msg = f"Profile retrieval failed with status {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
    
    @task(3)
    def refresh_auth_token(self):
        """Refresh the authentication token."""
        if not self.refresh_token:
            return
            
        with self.client.post(
            "/api/auth/refresh",
            json={"refresh_token": self.refresh_token},
            catch_response=True,
            name="Refresh Token"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.refresh_token = data.get("refresh_token", self.refresh_token)
                self.logged_in = bool(self.token)
                logger.debug("Token refresh successful")
            else:
                error_msg = f"Token refresh failed with status {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
                # Force re-login on next iteration
                self.logged_in = False
                self.token = None
                self.refresh_token = None
    
    @task(2)
    def verify_token(self):
        """Verify if the current token is valid."""
        if not self.logged_in or not self.token:
            return
            
        with self.client.post(
            "/api/auth/verify",
            headers={"Authorization": f"Bearer {self.token}"},
            catch_response=True,
            name="Verify Token"
        ) as response:
            if response.status_code == 200:
                logger.debug("Token verification successful")
            elif response.status_code == 401:
                logger.debug("Token expired, will refresh")
                self.logged_in = False
                response.success()  # Mark as success since this is expected behavior
            else:
                error_msg = f"Token verification failed with status {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
    
    @task(1)
    def logout(self):
        """Log out from the application."""
        if not self.logged_in or not self.token:
            return
            
        with self.client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {self.token}"},
            catch_response=True,
            name="User Logout"
        ) as response:
            # Reset session state regardless of response
            self.logged_in = False
            self.token = None
            self.refresh_token = None
            
            if response.status_code in (200, 204):
                logger.debug("Logout successful")
            else:
                error_msg = f"Logout failed with status {response.status_code}"
                logger.error(error_msg)
                response.failure(error_msg)
    
    @task(3)
    def concurrent_requests(self):
        """Make multiple concurrent requests with the same token."""
        if not self.logged_in or not self.token:
            return
            
        # Endpoints to test with concurrent access
        endpoints = [
            "/api/auth/profile",
            "/api/brands",
            "/api/content?limit=10",
            "/api/campaigns?status=active",
            "/api/metrics/ai/daily-costs"
        ]
        
        # Pick 3 random endpoints to test concurrently
        test_endpoints = random.sample(endpoints, min(3, len(endpoints)))
        
        for endpoint in test_endpoints:
            self.client.get(
                endpoint,
                headers={"Authorization": f"Bearer {self.token}"},
                name=f"Concurrent - {endpoint}"
            )


class AuthLoadTest(HttpUser):
    """User class for authentication load testing."""
    tasks = [AuthSessionTest]
    wait_time = between(1, 3)  # Short wait times to simulate high frequency

# Test event handlers
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    logger.info("Authentication load test starting...")

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    logger.info("Authentication load test completed.")
    # Generate summary report
    stats = environment.runner.stats
    
    # Overall statistics
    logger.info("=== Authentication Load Test Summary ===")
    logger.info(f"Total requests: {stats.total.num_requests}")
    logger.info(f"Failed requests: {stats.total.num_failures}")
    logger.info(f"Failure percentage: {(stats.total.num_failures / stats.total.num_requests * 100):.2f}%")
    logger.info(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    logger.info(f"Median response time: {stats.total.median_response_time}ms")
    logger.info(f"95th percentile: {stats.total.get_response_time_percentile(0.95)}ms")
    logger.info(f"99th percentile: {stats.total.get_response_time_percentile(0.99)}ms")
    logger.info(f"Requests per second: {stats.total.current_rps:.2f}")
    
    # Per-endpoint statistics
    logger.info("\n=== Endpoint Performance ===")
    for name, stat in sorted(stats.entries.items(), key=lambda x: x[1].avg_response_time, reverse=True):
        logger.info(f"Endpoint: {name}")
        logger.info(f"  Requests: {stat.num_requests}")
        logger.info(f"  Failures: {stat.num_failures}")
        logger.info(f"  Avg response time: {stat.avg_response_time:.2f}ms")
        logger.info(f"  Median response time: {stat.median_response_time}ms")
        logger.info(f"  95th percentile: {stat.get_response_time_percentile(0.95)}ms")
        logger.info(f"  Requests per second: {stat.current_rps:.2f}")
        logger.info("")


if __name__ == "__main__":
    # This allows running this file directly for testing purposes
    import subprocess
    import sys
    
    cmd = [
        "locust", 
        "-f", __file__,
        "--host=http://localhost:8000",  # Default host
        "--users=200",  # High user count for auth testing
        "--spawn-rate=20",
        "--run-time=5m",
        "--headless",
        "--only-summary"
    ]
    
    # Allow overriding settings from command line
    if len(sys.argv) > 1:
        cmd.extend(sys.argv[1:])
    
    subprocess.run(cmd)