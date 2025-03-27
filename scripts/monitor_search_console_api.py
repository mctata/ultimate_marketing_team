#!/usr/bin/env python
"""
Google Search Console API Monitoring Script

This script monitors the Search Console API for:
1. Rate limit issues
2. API changes
3. Token expiration/refresh issues
4. Usage statistics

It's designed to be run as a scheduled job to proactively detect problems
before they affect production applications.

Usage:
    python scripts/monitor_search_console_api.py --brand-id 123 --notify

Environment variables:
    GOOGLE_OAUTH2_CLIENT_ID - Google OAuth client ID
    GOOGLE_OAUTH2_CLIENT_SECRET - Google OAuth client secret
    TEST_GSC_REFRESH_TOKEN - Refresh token for test account
    TEST_GSC_SITE_URL - Site URL for testing
"""

import os
import sys
import time
import argparse
import logging
import json
import asyncio
import statistics
from datetime import datetime, timedelta
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.core import seo_settings
from src.agents.integrations.analytics.search_console import GoogleSearchConsoleIntegration
from src.services.search_console_service import search_console_service
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(project_root / "logs" / "search_console_monitoring.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger("search_console_monitor")

class SearchConsoleMonitor:
    """Monitor the Google Search Console API for issues and changes."""
    
    def __init__(self, brand_id, site_url=None, notify=False):
        """Initialize the monitor with credentials."""
        self.brand_id = brand_id
        self.site_url = site_url or os.getenv("TEST_GSC_SITE_URL")
        self.notify = notify
        
        # Metrics
        self.api_calls = 0
        self.successful_calls = 0
        self.failed_calls = 0
        self.response_times = []
        self.rate_limits_hit = 0
        self.token_refreshes = 0
        
        # Ensure credentials are available
        self.credentials_available = bool(
            os.getenv("GOOGLE_OAUTH2_CLIENT_ID") and
            os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET") and
            os.getenv("TEST_GSC_REFRESH_TOKEN")
        )
        
        if not self.credentials_available:
            logger.warning("Credentials not available. Monitoring will be limited.")
            
        # Create token directory if it doesn't exist
        os.makedirs(seo_settings.TOKEN_DIR, exist_ok=True)
        
        # Set up token if we have credentials
        if self.credentials_available:
            self._setup_token()
    
    def _setup_token(self):
        """Set up the token file for testing."""
        token_data = {
            "token": "test_token",  # Will be refreshed
            "refresh_token": os.getenv("TEST_GSC_REFRESH_TOKEN"),
            "token_uri": "https://oauth2.googleapis.com/token",
            "client_id": os.getenv("GOOGLE_OAUTH2_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_OAUTH2_CLIENT_SECRET"),
            "scopes": ["https://www.googleapis.com/auth/webmasters.readonly"],
            "expiry": (datetime.now() - timedelta(hours=1)).isoformat()  # Expired to force refresh
        }
        
        # Save token to file
        token_path = seo_settings.get_token_path(self.brand_id)
        with open(token_path, "w") as f:
            json.dump(token_data, f)
            
        logger.info(f"Token file created at {token_path}")
    
    async def test_token_refresh(self):
        """Test token refresh functionality."""
        logger.info("Testing token refresh...")
        
        integration = GoogleSearchConsoleIntegration(
            brand_id=self.brand_id,
            site_url=self.site_url
        )
        
        start_time = time.time()
        try:
            # This should trigger a token refresh
            headers = await integration._get_headers()
            
            # Check if Authorization header exists and is valid
            if "Authorization" in headers and headers["Authorization"].startswith("Bearer "):
                # Check if token was refreshed by checking expiry time
                token_data = seo_settings.load_token(self.brand_id)
                if token_data and "expiry" in token_data:
                    expiry = datetime.fromisoformat(token_data["expiry"])
                    if expiry > datetime.now():
                        logger.info("Token refresh successful")
                        self.token_refreshes += 1
                        return True
            
            logger.error("Token refresh failed: Invalid headers or expiry")
            return False
        except Exception as e:
            self.failed_calls += 1
            logger.error(f"Token refresh failed: {str(e)}")
            return False
        finally:
            elapsed = time.time() - start_time
            self.response_times.append(elapsed)
            self.api_calls += 1
            logger.info(f"Token refresh completed in {elapsed:.2f} seconds")
    
    async def test_search_performance(self):
        """Test search performance API."""
        logger.info("Testing search performance API...")
        
        integration = GoogleSearchConsoleIntegration(
            brand_id=self.brand_id,
            site_url=self.site_url
        )
        
        # Calculate date range for last 30 days
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        
        start_time = time.time()
        try:
            # Get search performance data
            result = await integration.get_search_performance(
                start_date=start_date_str,
                end_date=end_date_str,
                dimensions=["query"],
                row_limit=10
            )
            
            # Check result structure
            if "rows" in result:
                logger.info(f"Search performance API returned {len(result.get('rows', []))} rows")
                self.successful_calls += 1
                return True
            
            logger.error(f"Search performance API returned unexpected structure: {result}")
            return False
        except Exception as e:
            self.failed_calls += 1
            # Check for rate limit errors
            if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                self.rate_limits_hit += 1
                logger.error(f"Rate limit hit: {str(e)}")
            else:
                logger.error(f"Search performance API error: {str(e)}")
            return False
        finally:
            elapsed = time.time() - start_time
            self.response_times.append(elapsed)
            self.api_calls += 1
            logger.info(f"Search performance API call completed in {elapsed:.2f} seconds")
    
    async def test_url_inspection(self):
        """Test URL inspection API."""
        logger.info("Testing URL inspection API...")
        
        integration = GoogleSearchConsoleIntegration(
            brand_id=self.brand_id,
            site_url=self.site_url
        )
        
        # Extract domain from site_url and add a path
        if self.site_url.startswith("sc-domain:"):
            domain = self.site_url[10:]  # Remove sc-domain: prefix
            url_to_inspect = f"https://{domain}/"
        else:
            url_to_inspect = self.site_url
        
        start_time = time.time()
        try:
            # Inspect URL
            result = await integration.inspect_url(url_to_inspect)
            
            # Check result structure
            if "inspectionResult" in result:
                logger.info(f"URL inspection API successful for {url_to_inspect}")
                self.successful_calls += 1
                return True
            
            logger.error(f"URL inspection API returned unexpected structure: {result}")
            return False
        except Exception as e:
            self.failed_calls += 1
            # Check for rate limit errors
            if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                self.rate_limits_hit += 1
                logger.error(f"Rate limit hit: {str(e)}")
            else:
                logger.error(f"URL inspection API error: {str(e)}")
            return False
        finally:
            elapsed = time.time() - start_time
            self.response_times.append(elapsed)
            self.api_calls += 1
            logger.info(f"URL inspection API call completed in {elapsed:.2f} seconds")
    
    async def test_content_search_performance(self):
        """Test content search performance API."""
        logger.info("Testing content search performance API...")
        
        integration = GoogleSearchConsoleIntegration(
            brand_id=self.brand_id,
            site_url=self.site_url
        )
        
        # Test with the root path
        page_path = "/"
        
        start_time = time.time()
        try:
            # Get content search performance
            result = await integration.get_content_search_performance(
                page_path=page_path,
                days=28
            )
            
            # Check result structure
            if all(k in result for k in ["page_url", "date_range", "total_clicks", "total_impressions"]):
                logger.info(f"Content search performance API successful for {page_path}")
                self.successful_calls += 1
                return True
            
            logger.error(f"Content search performance API returned unexpected structure: {result}")
            return False
        except Exception as e:
            self.failed_calls += 1
            # Check for rate limit errors
            if "quota" in str(e).lower() or "rate limit" in str(e).lower():
                self.rate_limits_hit += 1
                logger.error(f"Rate limit hit: {str(e)}")
            else:
                logger.error(f"Content search performance API error: {str(e)}")
            return False
        finally:
            elapsed = time.time() - start_time
            self.response_times.append(elapsed)
            self.api_calls += 1
            logger.info(f"Content search performance API call completed in {elapsed:.2f} seconds")
    
    def get_metrics_report(self):
        """Generate a metrics report."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "api_calls": self.api_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "success_rate": (self.successful_calls / self.api_calls * 100) if self.api_calls > 0 else 0,
            "rate_limits_hit": self.rate_limits_hit,
            "token_refreshes": self.token_refreshes,
        }
        
        # Add response time metrics if we have any
        if self.response_times:
            report.update({
                "min_response_time": min(self.response_times),
                "max_response_time": max(self.response_times),
                "avg_response_time": statistics.mean(self.response_times),
                "median_response_time": statistics.median(self.response_times)
            })
        
        return report
    
    def save_metrics_report(self, report):
        """Save metrics report to file."""
        reports_dir = project_root / "logs" / "search_console_metrics"
        os.makedirs(reports_dir, exist_ok=True)
        
        report_file = reports_dir / f"metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Metrics report saved to {report_file}")
    
    def notify_if_issues(self, report):
        """Notify if there are issues detected."""
        if not self.notify:
            return
            
        # Check for issues
        has_issues = (
            report["failed_calls"] > 0 or
            report["rate_limits_hit"] > 0 or
            (report["success_rate"] < 90 if report["api_calls"] > 0 else False)
        )
        
        if has_issues:
            # Construct slack notification message
            message = {
                "text": "⚠️ Google Search Console API Monitoring Alert",
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "⚠️ Google Search Console API Issues Detected"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Monitoring Report:*\n• API Calls: {report['api_calls']}\n• Success Rate: {report['success_rate']:.1f}%\n• Failed Calls: {report['failed_calls']}\n• Rate Limits Hit: {report['rate_limits_hit']}"
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Response Times:*\n• Average: {report.get('avg_response_time', 'N/A'):.2f}s\n• Max: {report.get('max_response_time', 'N/A'):.2f}s"
                        }
                    }
                ]
            }
            
            # Send notification to slack webhook
            slack_webhook = os.getenv("SLACK_WEBHOOK")
            if slack_webhook:
                try:
                    response = requests.post(
                        slack_webhook,
                        json=message,
                        headers={"Content-Type": "application/json"}
                    )
                    if response.status_code == 200:
                        logger.info("Slack notification sent successfully")
                    else:
                        logger.error(f"Failed to send Slack notification: {response.status_code} {response.text}")
                except Exception as e:
                    logger.error(f"Error sending Slack notification: {str(e)}")
            else:
                logger.warning("SLACK_WEBHOOK environment variable not set. Notification not sent.")
    
    async def run_monitoring(self):
        """Run all monitoring tests."""
        if not self.credentials_available:
            logger.error("Credentials not available. Cannot run monitoring tests.")
            return
        
        # Run tests
        await self.test_token_refresh()
        await self.test_search_performance()
        await self.test_url_inspection()
        await self.test_content_search_performance()
        
        # Generate and save report
        report = self.get_metrics_report()
        self.save_metrics_report(report)
        
        # Notify if issues
        self.notify_if_issues(report)
        
        return report

async def main():
    parser = argparse.ArgumentParser(description="Monitor Google Search Console API")
    parser.add_argument("--brand-id", type=int, default=9999, help="Brand ID for testing")
    parser.add_argument("--site-url", type=str, help="Site URL for testing")
    parser.add_argument("--notify", action="store_true", help="Send notifications if issues are detected")
    args = parser.parse_args()
    
    # Create logs directory if it doesn't exist
    os.makedirs(project_root / "logs", exist_ok=True)
    
    # Create and run monitor
    monitor = SearchConsoleMonitor(
        brand_id=args.brand_id,
        site_url=args.site_url,
        notify=args.notify
    )
    
    report = await monitor.run_monitoring()
    
    # Print summary
    if report:
        print("\n===== Search Console API Monitoring Report =====")
        print(f"API Calls: {report['api_calls']}")
        print(f"Success Rate: {report['success_rate']:.1f}%")
        print(f"Failed Calls: {report['failed_calls']}")
        print(f"Rate Limits Hit: {report['rate_limits_hit']}")
        if 'avg_response_time' in report:
            print(f"Avg Response Time: {report['avg_response_time']:.2f}s")
        print("=================================================")

if __name__ == "__main__":
    asyncio.run(main())