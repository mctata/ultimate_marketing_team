#!/usr/bin/env python
"""
CI Benchmark Runner

This script is designed to be run in CI/CD pipelines to execute performance benchmarks,
compare results with previous versions, and generate reports.
"""

import os
import sys
import json
import argparse
import asyncio
import datetime
import logging
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Union
import requests

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from benchmarks.runners.run_benchmark import run_benchmark, compare_with_baseline

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("ci_benchmark.log")
    ]
)
logger = logging.getLogger("ci_benchmark_runner")

# Default test configurations for CI
DEFAULT_TESTS = [
    {
        "name": "api_load_test",
        "test_script": "locustfile.py",
        "users": 100,
        "spawn_rate": 10,
        "run_time": "3m",
        "test_type": "load"
    },
    {
        "name": "content_generation_test",
        "test_script": "content_generation_test.py",
        "users": 20,
        "spawn_rate": 5,
        "run_time": "2m",
        "test_type": "load"
    },
    {
        "name": "auth_session_test",
        "test_script": "auth_session_test.py",
        "users": 200,
        "spawn_rate": 20,
        "run_time": "2m",
        "test_type": "load"
    }
]


async def run_ci_benchmarks(
    app_version: str,
    host: str,
    tests: Optional[List[Dict[str, Any]]] = None,
    baseline_version: Optional[str] = None,
    threshold_file: Optional[str] = None,
    notify_slack: bool = False,
    slack_webhook: Optional[str] = None,
    upload_results: bool = False,
    api_token: Optional[str] = None,
    api_url: Optional[str] = None,
    fail_on_regression: bool = False
) -> int:
    """Run benchmarks for CI pipeline.
    
    Args:
        app_version: Application version being tested
        host: Target host URL
        tests: List of test configurations
        baseline_version: Version to compare against
        threshold_file: Path to threshold configuration file
        notify_slack: Whether to send Slack notifications
        slack_webhook: Slack webhook URL
        upload_results: Whether to upload results to an API
        api_token: API token for authentication
        api_url: API URL for uploading results
        fail_on_regression: Exit with error code if regressions detected
        
    Returns:
        Exit code (0 for success, non-zero for failure)
    """
    if tests is None:
        tests = DEFAULT_TESTS
    
    logger.info(f"Starting CI benchmarks for version {app_version}")
    
    os.makedirs("results", exist_ok=True)
    exit_code = 0
    all_results = []
    all_comparisons = []
    
    # Run each test
    for test_config in tests:
        test_name = test_config.get("name", "unknown")
        logger.info(f"Running test: {test_name}")
        
        # Run benchmark
        try:
            results = await run_benchmark(
                test_script=test_config.get("test_script"),
                host=host,
                users=test_config.get("users", 100),
                spawn_rate=test_config.get("spawn_rate", 10),
                run_time=test_config.get("run_time", "5m"),
                app_version=app_version,
                test_type=test_config.get("test_type", "load"),
                headless=True,
                parameters=test_config.get("parameters"),
                notes=f"CI run for {test_name}",
                logfile=f"results/{test_name}_locust.log",
                api_endpoints=test_config.get("api_endpoints", "").split(",") if test_config.get("api_endpoints") else None,
                services=test_config.get("services", "").split(",") if test_config.get("services") else None,
                queues=test_config.get("queues", "").split(",") if test_config.get("queues") else None,
                auth_token=test_config.get("auth_token")
            )
            
            # Save results with test name
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            results_file = f"results/{test_name}_results_{timestamp}.json"
            with open(results_file, "w") as f:
                json.dump(results, f, indent=2)
            
            logger.info(f"Benchmark results saved to {results_file}")
            all_results.append(results)
            
            # Compare with baseline if specified
            if baseline_version:
                logger.info(f"Comparing {test_name} with baseline version {baseline_version}")
                comparison = await compare_with_baseline(
                    current_results=results,
                    baseline_version=baseline_version,
                    threshold_file=threshold_file
                )
                
                # Save comparison results
                comparison_file = f"results/{test_name}_comparison_{timestamp}.json"
                with open(comparison_file, "w") as f:
                    json.dump(comparison, f, indent=2)
                
                logger.info(f"Comparison results saved to {comparison_file}")
                all_comparisons.append(comparison)
                
                # Check for regressions
                if comparison.get("has_regressions", False) and fail_on_regression:
                    logger.warning(f"Performance regressions detected in {test_name}!")
                    exit_code = 1
        
        except Exception as e:
            logger.error(f"Error running benchmark {test_name}: {str(e)}")
            exit_code = 1
    
    # Generate summary report
    summary = {
        "app_version": app_version,
        "baseline_version": baseline_version,
        "timestamp": datetime.datetime.now().isoformat(),
        "tests": len(tests),
        "successful_tests": len(all_results),
        "has_regressions": any(c.get("has_regressions", False) for c in all_comparisons),
        "regressions": {
            "api": sum(len(c.get("regressions", {}).get("api", [])) for c in all_comparisons),
            "resources": sum(len(c.get("regressions", {}).get("resources", [])) for c in all_comparisons),
            "queues": sum(len(c.get("regressions", {}).get("queues", [])) for c in all_comparisons)
        },
        "test_results": []
    }
    
    # Add details for each test
    for i, test_config in enumerate(tests):
        if i < len(all_results):
            test_name = test_config.get("name", "unknown")
            results = all_results[i]
            comparison = all_comparisons[i] if i < len(all_comparisons) else None
            
            summary["test_results"].append({
                "name": test_name,
                "test_type": test_config.get("test_type", "load"),
                "users": test_config.get("users", 100),
                "run_time": test_config.get("run_time", "5m"),
                "run_id": results.get("run_id"),
                "has_comparison": bool(comparison),
                "has_regressions": comparison.get("has_regressions", False) if comparison else False,
                "regression_count": (
                    len(comparison.get("regressions", {}).get("api", [])) +
                    len(comparison.get("regressions", {}).get("resources", [])) +
                    len(comparison.get("regressions", {}).get("queues", []))
                ) if comparison else 0
            })
    
    # Save summary report
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    summary_file = f"results/benchmark_summary_{timestamp}.json"
    with open(summary_file, "w") as f:
        json.dump(summary, f, indent=2)
    
    logger.info(f"Benchmark summary saved to {summary_file}")
    
    # Send Slack notification
    if notify_slack and slack_webhook:
        await send_slack_notification(summary, slack_webhook)
    
    # Upload results
    if upload_results and api_url and api_token:
        await upload_benchmark_results(summary, api_url, api_token)
    
    return exit_code


async def send_slack_notification(summary: Dict[str, Any], webhook_url: str) -> None:
    """Send a Slack notification with benchmark results.
    
    Args:
        summary: Benchmark summary
        webhook_url: Slack webhook URL
    """
    try:
        # Format the message
        app_version = summary.get("app_version", "unknown")
        baseline_version = summary.get("baseline_version", "N/A")
        has_regressions = summary.get("has_regressions", False)
        
        # Determine color based on results
        color = "#ff0000" if has_regressions else "#36a64f"
        
        # Build regression summary
        regression_text = ""
        if has_regressions:
            regression_count = sum(summary.get("regressions", {}).values())
            regression_text = f"*{regression_count} performance regressions detected!*\n"
            regression_text += f"- API Endpoints: {summary.get('regressions', {}).get('api', 0)}\n"
            regression_text += f"- Resources: {summary.get('regressions', {}).get('resources', 0)}\n"
            regression_text += f"- Message Queues: {summary.get('regressions', {}).get('queues', 0)}\n"
        
        # Build test results summary
        test_results_text = ""
        for test_result in summary.get("test_results", []):
            test_name = test_result.get("name", "unknown")
            test_type = test_result.get("test_type", "load")
            users = test_result.get("users", 0)
            has_test_regressions = test_result.get("has_regressions", False)
            regression_count = test_result.get("regression_count", 0)
            
            status = "⚠️ Regressions" if has_test_regressions else "✅ Passed"
            test_results_text += f"• *{test_name}* ({test_type}, {users} users): {status}"
            if has_test_regressions:
                test_results_text += f" ({regression_count} issues)"
            test_results_text += "\n"
        
        # Create the payload
        payload = {
            "attachments": [
                {
                    "fallback": f"Benchmark results for {app_version}",
                    "color": color,
                    "title": f"Benchmark Results: {app_version}",
                    "text": f"Comparison baseline: {baseline_version}\n\n{regression_text}\n*Test Results:*\n{test_results_text}",
                    "footer": "CI Benchmark Runner",
                    "ts": int(time.time())
                }
            ]
        }
        
        # Send the notification
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
        
        logger.info("Slack notification sent successfully")
    
    except Exception as e:
        logger.error(f"Error sending Slack notification: {str(e)}")


async def upload_benchmark_results(
    summary: Dict[str, Any],
    api_url: str,
    api_token: str
) -> None:
    """Upload benchmark results to an API.
    
    Args:
        summary: Benchmark summary
        api_url: API URL
        api_token: API token for authentication
    """
    try:
        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
        
        # Send the request
        response = requests.post(api_url, json=summary, headers=headers)
        response.raise_for_status()
        
        logger.info(f"Benchmark results uploaded successfully to {api_url}")
    
    except Exception as e:
        logger.error(f"Error uploading benchmark results: {str(e)}")


def main():
    """Parse arguments and run CI benchmarks."""
    parser = argparse.ArgumentParser(description="Run benchmarks in CI pipeline")
    
    # Required arguments
    parser.add_argument("--app-version", required=True,
                        help="Application version being tested")
    parser.add_argument("--host", required=True,
                        help="Target host URL")
    
    # Optional arguments
    parser.add_argument("--tests-file", default=None,
                        help="Path to JSON file with test configurations")
    parser.add_argument("--baseline-version", default=None,
                        help="Version to compare against")
    parser.add_argument("--threshold-file", default=None,
                        help="Path to threshold configuration file")
    parser.add_argument("--notify-slack", action="store_true",
                        help="Send Slack notifications")
    parser.add_argument("--slack-webhook", default=None,
                        help="Slack webhook URL")
    parser.add_argument("--upload-results", action="store_true",
                        help="Upload results to an API")
    parser.add_argument("--api-url", default=None,
                        help="API URL for uploading results")
    parser.add_argument("--api-token", default=None,
                        help="API token for authentication")
    parser.add_argument("--fail-on-regression", action="store_true",
                        help="Exit with error code if regressions detected")
    
    args = parser.parse_args()
    
    # Load test configurations
    tests = DEFAULT_TESTS
    if args.tests_file and os.path.exists(args.tests_file):
        with open(args.tests_file, "r") as f:
            tests = json.load(f)
    
    # Run benchmarks
    exit_code = asyncio.run(run_ci_benchmarks(
        app_version=args.app_version,
        host=args.host,
        tests=tests,
        baseline_version=args.baseline_version,
        threshold_file=args.threshold_file,
        notify_slack=args.notify_slack,
        slack_webhook=args.slack_webhook,
        upload_results=args.upload_results,
        api_url=args.api_url,
        api_token=args.api_token,
        fail_on_regression=args.fail_on_regression
    ))
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()