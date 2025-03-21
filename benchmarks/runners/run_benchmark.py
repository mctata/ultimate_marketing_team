#!/usr/bin/env python
"""
Benchmark Runner

This script executes performance benchmarks and collects metrics. It can be used to:
1. Run load tests using Locust
2. Collect performance metrics during the test
3. Compare results against baselines
4. Generate performance reports
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
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Union, Any

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from benchmarks.metrics.collector import MetricsCollector

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("benchmark.log")
    ]
)
logger = logging.getLogger("benchmark_runner")

# Default settings
DEFAULT_HOST = "http://localhost:8000"
DEFAULT_USERS = 100
DEFAULT_SPAWN_RATE = 10
DEFAULT_RUN_TIME = "5m"
DEFAULT_TEST_TYPE = "load"
DEFAULT_APP_VERSION = "dev"

async def run_benchmark(
    test_script: str,
    host: str = DEFAULT_HOST,
    users: int = DEFAULT_USERS,
    spawn_rate: int = DEFAULT_SPAWN_RATE,
    run_time: str = DEFAULT_RUN_TIME,
    app_version: str = DEFAULT_APP_VERSION,
    test_type: str = DEFAULT_TEST_TYPE,
    headless: bool = True,
    parameters: Optional[Dict[str, Any]] = None,
    notes: Optional[str] = None,
    logfile: Optional[str] = None,
    api_endpoints: Optional[List[str]] = None,
    services: Optional[List[str]] = None,
    queues: Optional[List[str]] = None,
    auth_token: Optional[str] = None
) -> Dict[str, Any]:
    """Run a benchmark test with performance metric collection.
    
    Args:
        test_script: Path to the Locust test script
        host: Target host URL
        users: Number of simulated users
        spawn_rate: Rate of user spawning (users per second)
        run_time: Test duration (e.g., "5m", "1h")
        app_version: Application version being tested
        test_type: Type of test (load, stress, soak, spike)
        headless: Run in headless mode
        parameters: Additional test parameters
        notes: Notes about the test
        logfile: Path to save Locust log output
        api_endpoints: List of API endpoints to monitor
        services: List of services to monitor
        queues: List of message queues to monitor
        auth_token: Optional authentication token
        
    Returns:
        Dict containing the benchmark results
    """
    # Ensure test script exists
    if not os.path.exists(test_script):
        test_script = os.path.join(os.path.dirname(__file__), "..", "load_tests", test_script)
        if not os.path.exists(test_script):
            raise FileNotFoundError(f"Test script not found: {test_script}")
    
    # Set up parameters
    if parameters is None:
        parameters = {}
    
    parameters.update({
        "users": users,
        "spawn_rate": spawn_rate,
        "run_time": run_time,
        "host": host,
        "test_type": test_type
    })
    
    # Initialize default endpoint monitoring if not specified
    if api_endpoints is None:
        api_endpoints = [
            "GET /api/auth/profile",
            "POST /api/auth/login",
            "POST /api/auth/refresh",
            "GET /api/brands",
            "GET /api/content",
            "POST /api/content/generate",
            "GET /api/campaigns",
            "GET /api/metrics/ai/daily-costs"
        ]
    
    # Initialize default service monitoring if not specified
    if services is None:
        services = ["api", "agents", "database", "redis", "rabbitmq"]
    
    # Initialize default queue monitoring if not specified
    if queues is None:
        queues = ["content_generation", "auth_tasks", "brand_tasks"]
    
    logger.info(f"Starting benchmark for version {app_version}")
    logger.info(f"Test type: {test_type}")
    logger.info(f"Users: {users}, Spawn rate: {spawn_rate}, Run time: {run_time}")
    
    # Start metrics collector
    collector = MetricsCollector(
        app_version=app_version,
        environment="test",
        test_type=test_type,
        parameters=parameters,
        notes=notes,
        collection_interval=5,  # seconds
        api_endpoints=api_endpoints,
        api_base_url=host,
        services_to_monitor=services,
        queues_to_monitor=queues,
        auth_token=auth_token
    )
    
    run_id = await collector.start()
    logger.info(f"Started metrics collection with run ID: {run_id}")
    
    # Build Locust command
    locust_cmd = [
        "locust",
        "-f", test_script,
        "--host", host,
        "--users", str(users),
        "--spawn-rate", str(spawn_rate),
        "--run-time", run_time
    ]
    
    if headless:
        locust_cmd.append("--headless")
    
    # Add CSV stats output
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    stats_file = f"benchmark_stats_{timestamp}.csv"
    history_file = f"benchmark_history_{timestamp}.csv"
    
    locust_cmd.extend([
        "--csv", f"results/{timestamp}",
        "--csv-full-history"
    ])
    
    # Run Locust in a subprocess
    try:
        os.makedirs("results", exist_ok=True)
        logger.info(f"Running Locust with command: {' '.join(locust_cmd)}")
        
        # If log file specified, redirect output
        if logfile:
            with open(logfile, "w") as log_file:
                process = subprocess.Popen(
                    locust_cmd,
                    stdout=log_file,
                    stderr=log_file
                )
        else:
            process = subprocess.Popen(locust_cmd)
        
        # Wait for process to complete
        process.wait()
        
        logger.info("Locust test completed")
    
    except Exception as e:
        logger.error(f"Error running Locust: {str(e)}")
    finally:
        # Stop metrics collection
        summary_metrics = await collector.stop()
        logger.info("Stopped metrics collection")
        
        # Get benchmark run information
        benchmark_info = await collector.get_benchmark_run()
        
        # Combine results
        results = {
            "run_id": run_id,
            "app_version": app_version,
            "timestamp": datetime.datetime.now().isoformat(),
            "test_type": test_type,
            "parameters": parameters,
            "summary_metrics": summary_metrics,
            "benchmark_info": benchmark_info
        }
        
        # Save results to JSON
        results_file = f"results/benchmark_results_{timestamp}.json"
        with open(results_file, "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Benchmark results saved to {results_file}")
        
        return results


async def compare_with_baseline(
    current_results: Dict[str, Any],
    baseline_file: Optional[str] = None,
    baseline_version: Optional[str] = None,
    threshold_file: Optional[str] = None
) -> Dict[str, Any]:
    """Compare benchmark results with a baseline.
    
    Args:
        current_results: Current benchmark results
        baseline_file: Path to baseline results file
        baseline_version: Version to compare against
        threshold_file: Path to threshold configuration file
    
    Returns:
        Comparison results
    """
    # Load thresholds
    thresholds = {
        "response_time": 0.2,  # 20% regression allowed
        "error_rate": 0.01,    # 1% absolute increase allowed
        "cpu_usage": 0.15,     # 15% increase allowed
        "memory_usage": 0.15,  # 15% increase allowed
        "queue_length": 0.25   # 25% increase allowed
    }
    
    if threshold_file and os.path.exists(threshold_file):
        with open(threshold_file, "r") as f:
            custom_thresholds = json.load(f)
            thresholds.update(custom_thresholds)
    
    # Find baseline results
    baseline_results = None
    
    if baseline_file and os.path.exists(baseline_file):
        with open(baseline_file, "r") as f:
            baseline_results = json.load(f)
    elif baseline_version:
        # Find the most recent results for the specified version
        results_dir = Path("results")
        if results_dir.exists():
            result_files = list(results_dir.glob("benchmark_results_*.json"))
            matching_files = []
            
            for file_path in result_files:
                with open(file_path, "r") as f:
                    results = json.load(f)
                    if results.get("app_version") == baseline_version:
                        matching_files.append((file_path, results))
            
            if matching_files:
                # Sort by timestamp (most recent first)
                matching_files.sort(key=lambda x: x[1].get("timestamp", ""), reverse=True)
                baseline_results = matching_files[0][1]
    
    if not baseline_results:
        logger.warning("No baseline results found for comparison")
        return {
            "has_baseline": False,
            "regressions": False,
            "comparison": {}
        }
    
    # Perform comparison
    comparison = {
        "has_baseline": True,
        "baseline_version": baseline_results.get("app_version"),
        "current_version": current_results.get("app_version"),
        "api": {},
        "resources": {},
        "queues": {},
        "regressions": {
            "api": [],
            "resources": [],
            "queues": []
        }
    }
    
    # Compare API metrics
    current_api = current_results.get("summary_metrics", {}).get("api", {})
    baseline_api = baseline_results.get("summary_metrics", {}).get("api", {})
    
    for endpoint, current_data in current_api.items():
        if endpoint in baseline_api:
            baseline_data = baseline_api[endpoint]
            current_avg = current_data.get("avg_response_time_ms", 0)
            baseline_avg = baseline_data.get("avg_response_time_ms", 0)
            
            if baseline_avg > 0:
                percent_change = (current_avg - baseline_avg) / baseline_avg
                
                comparison["api"][endpoint] = {
                    "current": current_avg,
                    "baseline": baseline_avg,
                    "absolute_change": current_avg - baseline_avg,
                    "percent_change": percent_change * 100,
                    "regression": percent_change > thresholds["response_time"]
                }
                
                if percent_change > thresholds["response_time"]:
                    comparison["regressions"]["api"].append({
                        "endpoint": endpoint,
                        "metric": "response_time",
                        "baseline": baseline_avg,
                        "current": current_avg,
                        "percent_change": percent_change * 100
                    })
    
    # Compare resource metrics
    current_resources = current_results.get("summary_metrics", {}).get("resources", {})
    baseline_resources = baseline_results.get("summary_metrics", {}).get("resources", {})
    
    for service, current_data in current_resources.items():
        if service in baseline_resources:
            baseline_data = baseline_resources[service]
            
            comparison["resources"][service] = {}
            
            # Compare CPU usage
            current_cpu = current_data.get("avg_cpu_percent", 0)
            baseline_cpu = baseline_data.get("avg_cpu_percent", 0)
            
            if baseline_cpu > 0:
                cpu_percent_change = (current_cpu - baseline_cpu) / baseline_cpu
                
                comparison["resources"][service]["cpu"] = {
                    "current": current_cpu,
                    "baseline": baseline_cpu,
                    "absolute_change": current_cpu - baseline_cpu,
                    "percent_change": cpu_percent_change * 100,
                    "regression": cpu_percent_change > thresholds["cpu_usage"]
                }
                
                if cpu_percent_change > thresholds["cpu_usage"]:
                    comparison["regressions"]["resources"].append({
                        "service": service,
                        "metric": "cpu_usage",
                        "baseline": baseline_cpu,
                        "current": current_cpu,
                        "percent_change": cpu_percent_change * 100
                    })
            
            # Compare memory usage
            current_memory = current_data.get("avg_memory_mb", 0)
            baseline_memory = baseline_data.get("avg_memory_mb", 0)
            
            if baseline_memory > 0:
                memory_percent_change = (current_memory - baseline_memory) / baseline_memory
                
                comparison["resources"][service]["memory"] = {
                    "current": current_memory,
                    "baseline": baseline_memory,
                    "absolute_change": current_memory - baseline_memory,
                    "percent_change": memory_percent_change * 100,
                    "regression": memory_percent_change > thresholds["memory_usage"]
                }
                
                if memory_percent_change > thresholds["memory_usage"]:
                    comparison["regressions"]["resources"].append({
                        "service": service,
                        "metric": "memory_usage",
                        "baseline": baseline_memory,
                        "current": current_memory,
                        "percent_change": memory_percent_change * 100
                    })
    
    # Compare queue metrics
    current_queues = current_results.get("summary_metrics", {}).get("queues", {})
    baseline_queues = baseline_results.get("summary_metrics", {}).get("queues", {})
    
    for queue, current_data in current_queues.items():
        if queue in baseline_queues:
            baseline_data = baseline_queues[queue]
            
            comparison["queues"][queue] = {}
            
            # Compare queue length
            current_length = current_data.get("avg_queue_length", 0)
            baseline_length = baseline_data.get("avg_queue_length", 0)
            
            if baseline_length > 0:
                length_percent_change = (current_length - baseline_length) / baseline_length
                
                comparison["queues"][queue]["length"] = {
                    "current": current_length,
                    "baseline": baseline_length,
                    "absolute_change": current_length - baseline_length,
                    "percent_change": length_percent_change * 100,
                    "regression": length_percent_change > thresholds["queue_length"]
                }
                
                if length_percent_change > thresholds["queue_length"]:
                    comparison["regressions"]["queues"].append({
                        "queue": queue,
                        "metric": "queue_length",
                        "baseline": baseline_length,
                        "current": current_length,
                        "percent_change": length_percent_change * 100
                    })
    
    # Check if there are any regressions
    has_regressions = (
        len(comparison["regressions"]["api"]) > 0 or
        len(comparison["regressions"]["resources"]) > 0 or
        len(comparison["regressions"]["queues"]) > 0
    )
    
    comparison["has_regressions"] = has_regressions
    
    return comparison


async def run_and_compare(args):
    """Run benchmark and compare with baseline."""
    # Run benchmark
    results = await run_benchmark(
        test_script=args.test_script,
        host=args.host,
        users=args.users,
        spawn_rate=args.spawn_rate,
        run_time=args.run_time,
        app_version=args.app_version,
        test_type=args.test_type,
        headless=not args.with_ui,
        parameters=json.loads(args.parameters) if args.parameters else None,
        notes=args.notes,
        logfile=args.logfile,
        api_endpoints=args.api_endpoints.split(",") if args.api_endpoints else None,
        services=args.services.split(",") if args.services else None,
        queues=args.queues.split(",") if args.queues else None,
        auth_token=args.auth_token
    )
    
    # Compare with baseline if requested
    if args.compare:
        comparison = await compare_with_baseline(
            current_results=results,
            baseline_file=args.baseline_file,
            baseline_version=args.baseline_version,
            threshold_file=args.threshold_file
        )
        
        # Save comparison results
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        comparison_file = f"results/comparison_{timestamp}.json"
        with open(comparison_file, "w") as f:
            json.dump(comparison, f, indent=2)
        
        logger.info(f"Comparison results saved to {comparison_file}")
        
        # Check for regressions
        if comparison.get("has_regressions", False):
            logger.warning("Performance regressions detected!")
            
            # Log regressions
            for api_regression in comparison.get("regressions", {}).get("api", []):
                logger.warning(
                    f"API Regression: {api_regression['endpoint']} - "
                    f"{api_regression['percent_change']:.2f}% increase in response time"
                )
            
            for resource_regression in comparison.get("regressions", {}).get("resources", []):
                logger.warning(
                    f"Resource Regression: {resource_regression['service']} - "
                    f"{resource_regression['metric']} increased by {resource_regression['percent_change']:.2f}%"
                )
            
            for queue_regression in comparison.get("regressions", {}).get("queues", []):
                logger.warning(
                    f"Queue Regression: {queue_regression['queue']} - "
                    f"{queue_regression['metric']} increased by {queue_regression['percent_change']:.2f}%"
                )
            
            # Exit with error code if fail_on_regression is set
            if args.fail_on_regression:
                logger.error("Failing build due to performance regressions")
                return 1
    
    return 0


def main():
    """Parse arguments and run benchmark."""
    parser = argparse.ArgumentParser(description="Run performance benchmarks")
    
    # Benchmark configuration
    parser.add_argument("--test-script", default="locustfile.py",
                        help="Path to Locust test script")
    parser.add_argument("--host", default=DEFAULT_HOST,
                        help="Target host URL")
    parser.add_argument("--users", type=int, default=DEFAULT_USERS,
                        help="Number of simulated users")
    parser.add_argument("--spawn-rate", type=int, default=DEFAULT_SPAWN_RATE,
                        help="Rate of user spawning (users per second)")
    parser.add_argument("--run-time", default=DEFAULT_RUN_TIME,
                        help="Test duration (e.g., 5m, 1h)")
    parser.add_argument("--app-version", default=DEFAULT_APP_VERSION,
                        help="Application version being tested")
    parser.add_argument("--test-type", default=DEFAULT_TEST_TYPE,
                        choices=["load", "stress", "soak", "spike"],
                        help="Type of test to run")
    parser.add_argument("--with-ui", action="store_true",
                        help="Run Locust with UI (not headless)")
    parser.add_argument("--parameters", default=None,
                        help="Additional test parameters as JSON string")
    parser.add_argument("--notes", default=None,
                        help="Notes about the test")
    parser.add_argument("--logfile", default=None,
                        help="Path to save Locust log output")
    
    # Monitoring configuration
    parser.add_argument("--api-endpoints", default=None,
                        help="Comma-separated list of API endpoints to monitor")
    parser.add_argument("--services", default=None,
                        help="Comma-separated list of services to monitor")
    parser.add_argument("--queues", default=None,
                        help="Comma-separated list of message queues to monitor")
    parser.add_argument("--auth-token", default=None,
                        help="Authentication token for API requests")
    
    # Comparison configuration
    parser.add_argument("--compare", action="store_true",
                        help="Compare results with baseline")
    parser.add_argument("--baseline-file", default=None,
                        help="Path to baseline results file")
    parser.add_argument("--baseline-version", default=None,
                        help="Version to compare against")
    parser.add_argument("--threshold-file", default=None,
                        help="Path to threshold configuration file")
    parser.add_argument("--fail-on-regression", action="store_true",
                        help="Exit with error code if regressions detected")
    
    args = parser.parse_args()
    
    # Run benchmark and comparison
    exit_code = asyncio.run(run_and_compare(args))
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()