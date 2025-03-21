"""
Metrics Collector Service

This module provides functionality to collect and store performance metrics
during benchmark runs. It collects:
1. API response times and error rates
2. System resource utilization (CPU, memory, DB connections)
3. Message queue lengths and processing times
"""

import os
import time
import uuid
import json
import logging
import threading
import psutil
import datetime
import requests
from typing import Dict, List, Optional, Union, Any
import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Import models
from benchmarks.metrics.models import BenchmarkRun, APIMetric, ResourceMetric, QueueMetric
from src.core.database import get_db, get_engine, get_session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MetricsCollector:
    """Collects and stores performance metrics during benchmark runs."""
    
    def __init__(
        self,
        app_version: str,
        environment: str = "test",
        test_type: str = "load",
        parameters: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        collection_interval: int = 5,  # seconds
        api_endpoints: Optional[List[str]] = None,
        api_base_url: str = "http://localhost:8000",
        services_to_monitor: Optional[List[str]] = None,
        queues_to_monitor: Optional[List[str]] = None,
        auth_token: Optional[str] = None
    ):
        """Initialize the metrics collector.
        
        Args:
            app_version: Version of the application being tested
            environment: Environment (test, staging, production)
            test_type: Type of test (load, performance, stress)
            parameters: Test parameters (users, duration, etc.)
            notes: Additional notes about the test
            collection_interval: How often to collect metrics (seconds)
            api_endpoints: List of API endpoints to monitor
            api_base_url: Base URL for API endpoints
            services_to_monitor: List of services to monitor resources for
            queues_to_monitor: List of message queues to monitor
            auth_token: Optional authentication token for API requests
        """
        self.app_version = app_version
        self.environment = environment
        self.test_type = test_type
        self.parameters = parameters or {}
        self.notes = notes
        self.collection_interval = collection_interval
        self.api_endpoints = api_endpoints or []
        self.api_base_url = api_base_url
        self.services_to_monitor = services_to_monitor or ["api", "agents", "database"]
        self.queues_to_monitor = queues_to_monitor or []
        self.auth_token = auth_token
        
        # Internal state
        self.run_id = str(uuid.uuid4())
        self.benchmark_run = None
        self.benchmark_run_id = None
        self.start_time = None
        self.end_time = None
        self.is_running = False
        self.collection_thread = None
        self._stop_event = threading.Event()
        
        # Get git info
        self.git_commit = self._get_git_commit()
        self.git_branch = self._get_git_branch()
    
    def _get_git_commit(self) -> Optional[str]:
        """Get the current git commit hash."""
        try:
            import subprocess
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except Exception as e:
            logger.warning(f"Failed to get git commit: {str(e)}")
            return None
    
    def _get_git_branch(self) -> Optional[str]:
        """Get the current git branch."""
        try:
            import subprocess
            result = subprocess.run(
                ["git", "rev-parse", "--abbrev-ref", "HEAD"],
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except Exception as e:
            logger.warning(f"Failed to get git branch: {str(e)}")
            return None
    
    async def start(self) -> str:
        """Start collecting metrics.
        
        Returns:
            str: The run ID for this benchmark run
        """
        if self.is_running:
            logger.warning("Metrics collection already running")
            return self.run_id
        
        self.start_time = datetime.datetime.utcnow()
        
        # Create benchmark run record
        with get_db() as session:
            benchmark_run = BenchmarkRun(
                run_id=self.run_id,
                app_version=self.app_version,
                environment=self.environment,
                start_time=self.start_time,
                git_commit=self.git_commit,
                git_branch=self.git_branch,
                test_type=self.test_type,
                parameters=self.parameters,
                status="running",
                notes=self.notes
            )
            session.add(benchmark_run)
            session.commit()
            self.benchmark_run_id = benchmark_run.id
        
        # Start collection thread
        self.is_running = True
        self._stop_event.clear()
        self.collection_thread = threading.Thread(
            target=self._collection_loop,
            daemon=True
        )
        self.collection_thread.start()
        
        logger.info(f"Started metrics collection for benchmark run {self.run_id}")
        return self.run_id
    
    async def stop(self) -> Dict[str, Any]:
        """Stop collecting metrics and finalize the benchmark run.
        
        Returns:
            Dict[str, Any]: Summary metrics for the benchmark run
        """
        if not self.is_running:
            logger.warning("Metrics collection not running")
            return {}
        
        # Signal collection thread to stop
        self._stop_event.set()
        if self.collection_thread:
            self.collection_thread.join(timeout=10)
        
        self.is_running = False
        self.end_time = datetime.datetime.utcnow()
        
        # Calculate summary metrics
        summary_metrics = await self._calculate_summary_metrics()
        
        # Update benchmark run record
        with get_db() as session:
            benchmark_run = session.query(BenchmarkRun).filter_by(id=self.benchmark_run_id).first()
            if benchmark_run:
                benchmark_run.end_time = self.end_time
                benchmark_run.status = "completed"
                benchmark_run.summary_metrics = summary_metrics
                session.commit()
        
        logger.info(f"Stopped metrics collection for benchmark run {self.run_id}")
        return summary_metrics
    
    def _collection_loop(self):
        """Main loop for collecting metrics."""
        while not self._stop_event.is_set():
            try:
                # Collect metrics
                self._collect_api_metrics()
                self._collect_resource_metrics()
                self._collect_queue_metrics()
                
                # Sleep until next collection
                time.sleep(self.collection_interval)
            except Exception as e:
                logger.error(f"Error in metrics collection: {str(e)}")
                time.sleep(self.collection_interval)
    
    def _collect_api_metrics(self):
        """Collect API metrics for monitored endpoints."""
        timestamp = datetime.datetime.utcnow()
        
        headers = {}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        for endpoint in self.api_endpoints:
            try:
                # Extract method and path
                if " " in endpoint:
                    method, path = endpoint.split(" ", 1)
                else:
                    method = "GET"
                    path = endpoint
                
                # Skip health check endpoints for normal collection
                if "/health" in path:
                    continue
                
                url = f"{self.api_base_url}{path}"
                
                # Make request to metric endpoint to get stats instead of calling the actual endpoint
                metric_url = f"{self.api_base_url}/api/metrics/performance/endpoint"
                metric_response = requests.get(
                    metric_url,
                    params={"endpoint": path, "method": method},
                    headers=headers,
                    timeout=5
                )
                
                if metric_response.status_code == 200:
                    metrics_data = metric_response.json()
                    
                    # Store metrics
                    with get_db() as session:
                        api_metric = APIMetric(
                            benchmark_run_id=self.benchmark_run_id,
                            timestamp=timestamp,
                            endpoint=path,
                            method=method,
                            status_code=metrics_data.get("status_code"),
                            response_time_ms=metrics_data.get("avg_response_time_ms", 0),
                            request_count=metrics_data.get("request_count", 0),
                            error_count=metrics_data.get("error_count", 0),
                            min_response_time_ms=metrics_data.get("min_response_time_ms"),
                            max_response_time_ms=metrics_data.get("max_response_time_ms"),
                            avg_response_time_ms=metrics_data.get("avg_response_time_ms"),
                            median_response_time_ms=metrics_data.get("median_response_time_ms"),
                            p90_response_time_ms=metrics_data.get("p90_response_time_ms"),
                            p95_response_time_ms=metrics_data.get("p95_response_time_ms"),
                            p99_response_time_ms=metrics_data.get("p99_response_time_ms"),
                            request_size_bytes=metrics_data.get("avg_request_size_bytes"),
                            response_size_bytes=metrics_data.get("avg_response_size_bytes"),
                            context=metrics_data.get("context")
                        )
                        session.add(api_metric)
                        session.commit()
            except Exception as e:
                logger.error(f"Error collecting API metrics for {endpoint}: {str(e)}")
    
    def _collect_resource_metrics(self):
        """Collect system resource metrics."""
        timestamp = datetime.datetime.utcnow()
        
        try:
            # Collect host metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk_io = psutil.disk_io_counters()
            net_io = psutil.net_io_counters()
            
            # Store host metrics
            with get_db() as session:
                resource_metric = ResourceMetric(
                    benchmark_run_id=self.benchmark_run_id,
                    timestamp=timestamp,
                    service="host",
                    instance_id="localhost",
                    cpu_usage_percent=cpu_percent,
                    memory_usage_mb=memory.used / (1024 * 1024),
                    memory_usage_percent=memory.percent,
                    disk_read_bytes=disk_io.read_bytes if disk_io else None,
                    disk_write_bytes=disk_io.write_bytes if disk_io else None,
                    network_in_bytes=net_io.bytes_recv if net_io else None,
                    network_out_bytes=net_io.bytes_sent if net_io else None,
                    open_file_descriptors=len(psutil.Process().open_files()),
                    thread_count=threading.active_count(),
                    process_count=len(psutil.pids()),
                    context={}
                )
                session.add(resource_metric)
                session.commit()
            
            # Collect service-specific metrics via API
            for service in self.services_to_monitor:
                try:
                    metric_url = f"{self.api_base_url}/api/metrics/resources/{service}"
                    headers = {}
                    if self.auth_token:
                        headers["Authorization"] = f"Bearer {self.auth_token}"
                    
                    response = requests.get(metric_url, headers=headers, timeout=5)
                    
                    if response.status_code == 200:
                        service_metrics = response.json()
                        
                        # Store service metrics
                        with get_db() as session:
                            resource_metric = ResourceMetric(
                                benchmark_run_id=self.benchmark_run_id,
                                timestamp=timestamp,
                                service=service,
                                instance_id=service_metrics.get("instance_id", "default"),
                                cpu_usage_percent=service_metrics.get("cpu_percent"),
                                memory_usage_mb=service_metrics.get("memory_mb"),
                                memory_usage_percent=service_metrics.get("memory_percent"),
                                thread_count=service_metrics.get("thread_count"),
                                process_count=service_metrics.get("process_count"),
                                context=service_metrics.get("context")
                            )
                            session.add(resource_metric)
                            session.commit()
                except Exception as e:
                    logger.error(f"Error collecting resource metrics for {service}: {str(e)}")
        except Exception as e:
            logger.error(f"Error collecting resource metrics: {str(e)}")
    
    def _collect_queue_metrics(self):
        """Collect message queue metrics."""
        timestamp = datetime.datetime.utcnow()
        
        try:
            for queue_name in self.queues_to_monitor:
                try:
                    # Get queue metrics from API
                    metric_url = f"{self.api_base_url}/api/metrics/queues/{queue_name}"
                    headers = {}
                    if self.auth_token:
                        headers["Authorization"] = f"Bearer {self.auth_token}"
                    
                    response = requests.get(metric_url, headers=headers, timeout=5)
                    
                    if response.status_code == 200:
                        queue_metrics = response.json()
                        
                        # Store queue metrics
                        with get_db() as session:
                            queue_metric = QueueMetric(
                                benchmark_run_id=self.benchmark_run_id,
                                timestamp=timestamp,
                                queue_name=queue_name,
                                service=queue_metrics.get("service", "unknown"),
                                queue_length=queue_metrics.get("queue_length"),
                                processing_time_ms=queue_metrics.get("avg_processing_time_ms"),
                                messages_published=queue_metrics.get("messages_published"),
                                messages_consumed=queue_metrics.get("messages_consumed"),
                                error_count=queue_metrics.get("error_count"),
                                retry_count=queue_metrics.get("retry_count"),
                                oldest_message_age_sec=queue_metrics.get("oldest_message_age_sec"),
                                context=queue_metrics.get("context")
                            )
                            session.add(queue_metric)
                            session.commit()
                except Exception as e:
                    logger.error(f"Error collecting queue metrics for {queue_name}: {str(e)}")
        except Exception as e:
            logger.error(f"Error collecting queue metrics: {str(e)}")
    
    async def _calculate_summary_metrics(self) -> Dict[str, Any]:
        """Calculate summary metrics for the benchmark run.
        
        Returns:
            Dict[str, Any]: Summary metrics
        """
        summary = {
            "duration_seconds": (self.end_time - self.start_time).total_seconds(),
            "api": {},
            "resources": {},
            "queues": {}
        }
        
        try:
            # Calculate API summary metrics
            async with get_session() as session:
                # Get all API metrics for this run
                result = await session.execute(
                    select(APIMetric).where(APIMetric.benchmark_run_id == self.benchmark_run_id)
                )
                api_metrics = result.scalars().all()
                
                # Group by endpoint
                endpoints = {}
                for metric in api_metrics:
                    key = f"{metric.method} {metric.endpoint}"
                    if key not in endpoints:
                        endpoints[key] = {
                            "request_count": 0,
                            "error_count": 0,
                            "response_times_ms": []
                        }
                    
                    endpoints[key]["request_count"] += metric.request_count
                    endpoints[key]["error_count"] += metric.error_count
                    endpoints[key]["response_times_ms"].append(metric.response_time_ms)
                
                # Calculate summary for each endpoint
                for key, data in endpoints.items():
                    response_times = data["response_times_ms"]
                    if response_times:
                        summary["api"][key] = {
                            "request_count": data["request_count"],
                            "error_count": data["error_count"],
                            "error_rate": data["error_count"] / data["request_count"] if data["request_count"] > 0 else 0,
                            "min_response_time_ms": min(response_times),
                            "max_response_time_ms": max(response_times),
                            "avg_response_time_ms": sum(response_times) / len(response_times)
                        }
            
            # Calculate resource summary metrics
            async with get_session() as session:
                # Get all resource metrics for this run
                result = await session.execute(
                    select(ResourceMetric).where(ResourceMetric.benchmark_run_id == self.benchmark_run_id)
                )
                resource_metrics = result.scalars().all()
                
                # Group by service
                services = {}
                for metric in resource_metrics:
                    if metric.service not in services:
                        services[metric.service] = {
                            "cpu_usage_percent": [],
                            "memory_usage_mb": [],
                            "memory_usage_percent": []
                        }
                    
                    if metric.cpu_usage_percent is not None:
                        services[metric.service]["cpu_usage_percent"].append(metric.cpu_usage_percent)
                    if metric.memory_usage_mb is not None:
                        services[metric.service]["memory_usage_mb"].append(metric.memory_usage_mb)
                    if metric.memory_usage_percent is not None:
                        services[metric.service]["memory_usage_percent"].append(metric.memory_usage_percent)
                
                # Calculate summary for each service
                for service, data in services.items():
                    summary["resources"][service] = {}
                    
                    # Calculate CPU metrics
                    cpu_values = data["cpu_usage_percent"]
                    if cpu_values:
                        summary["resources"][service]["avg_cpu_percent"] = sum(cpu_values) / len(cpu_values)
                        summary["resources"][service]["max_cpu_percent"] = max(cpu_values)
                    
                    # Calculate memory metrics
                    memory_values = data["memory_usage_mb"]
                    if memory_values:
                        summary["resources"][service]["avg_memory_mb"] = sum(memory_values) / len(memory_values)
                        summary["resources"][service]["max_memory_mb"] = max(memory_values)
            
            # Calculate queue summary metrics
            async with get_session() as session:
                # Get all queue metrics for this run
                result = await session.execute(
                    select(QueueMetric).where(QueueMetric.benchmark_run_id == self.benchmark_run_id)
                )
                queue_metrics = result.scalars().all()
                
                # Group by queue
                queues = {}
                for metric in queue_metrics:
                    if metric.queue_name not in queues:
                        queues[metric.queue_name] = {
                            "queue_length": [],
                            "processing_time_ms": []
                        }
                    
                    if metric.queue_length is not None:
                        queues[metric.queue_name]["queue_length"].append(metric.queue_length)
                    if metric.processing_time_ms is not None:
                        queues[metric.queue_name]["processing_time_ms"].append(metric.processing_time_ms)
                
                # Calculate summary for each queue
                for queue, data in queues.items():
                    summary["queues"][queue] = {}
                    
                    # Calculate queue length metrics
                    queue_length_values = data["queue_length"]
                    if queue_length_values:
                        summary["queues"][queue]["avg_queue_length"] = sum(queue_length_values) / len(queue_length_values)
                        summary["queues"][queue]["max_queue_length"] = max(queue_length_values)
                    
                    # Calculate processing time metrics
                    processing_time_values = data["processing_time_ms"]
                    if processing_time_values:
                        summary["queues"][queue]["avg_processing_time_ms"] = sum(processing_time_values) / len(processing_time_values)
                        summary["queues"][queue]["max_processing_time_ms"] = max(processing_time_values)
        
        except Exception as e:
            logger.error(f"Error calculating summary metrics: {str(e)}")
        
        return summary
    
    async def get_benchmark_run(self) -> Optional[Dict[str, Any]]:
        """Get information about the current benchmark run.
        
        Returns:
            Optional[Dict[str, Any]]: Benchmark run information
        """
        if not self.benchmark_run_id:
            return None
            
        async with get_session() as session:
            result = await session.execute(
                select(BenchmarkRun).where(BenchmarkRun.id == self.benchmark_run_id)
            )
            benchmark_run = result.scalars().first()
            
            if benchmark_run:
                return {
                    "id": benchmark_run.id,
                    "run_id": benchmark_run.run_id,
                    "app_version": benchmark_run.app_version,
                    "environment": benchmark_run.environment,
                    "start_time": benchmark_run.start_time.isoformat() if benchmark_run.start_time else None,
                    "end_time": benchmark_run.end_time.isoformat() if benchmark_run.end_time else None,
                    "git_commit": benchmark_run.git_commit,
                    "git_branch": benchmark_run.git_branch,
                    "test_type": benchmark_run.test_type,
                    "parameters": benchmark_run.parameters,
                    "status": benchmark_run.status,
                    "notes": benchmark_run.notes
                }
            
            return None