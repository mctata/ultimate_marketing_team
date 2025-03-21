"""
Database models for storing performance benchmark metrics.

These models extend the existing system tables to track performance metrics
over time and associate them with specific versions of the application.
"""

from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from src.core.database import Base

class BenchmarkRun(Base):
    """Records information about a complete benchmark test run."""
    
    __tablename__ = "benchmark_runs"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(50), unique=True, index=True, nullable=False)  # UUID for the run
    app_version = Column(String(50), nullable=False, index=True)  # Version of the application
    environment = Column(String(20), nullable=False)  # test, staging, production
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    git_commit = Column(String(40), nullable=True)  # Git commit hash
    git_branch = Column(String(100), nullable=True)  # Git branch
    test_type = Column(String(50), nullable=False)  # load, performance, stress, etc.
    parameters = Column(JSON, nullable=True)  # Test parameters (users, duration, etc.)
    summary_metrics = Column(JSON, nullable=True)  # Summary metrics
    status = Column(String(20), nullable=False, default="running")  # running, completed, failed
    notes = Column(Text, nullable=True)
    
    # Relationships
    api_metrics = relationship("APIMetric", back_populates="benchmark_run", cascade="all, delete-orphan")
    resource_metrics = relationship("ResourceMetric", back_populates="benchmark_run", cascade="all, delete-orphan")
    queue_metrics = relationship("QueueMetric", back_populates="benchmark_run", cascade="all, delete-orphan")


class APIMetric(Base):
    """Records API performance metrics for specific endpoints."""
    
    __tablename__ = "benchmark_api_metrics"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    benchmark_run_id = Column(Integer, ForeignKey("umt.benchmark_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    endpoint = Column(String(255), nullable=False, index=True)
    method = Column(String(10), nullable=False)  # GET, POST, etc.
    status_code = Column(Integer, nullable=True)
    response_time_ms = Column(Float, nullable=False)  # Response time in milliseconds
    request_count = Column(Integer, nullable=False, default=1)  # Number of requests in this time period
    error_count = Column(Integer, nullable=False, default=0)  # Number of errors
    min_response_time_ms = Column(Float, nullable=True)
    max_response_time_ms = Column(Float, nullable=True)
    avg_response_time_ms = Column(Float, nullable=True)
    median_response_time_ms = Column(Float, nullable=True)
    p90_response_time_ms = Column(Float, nullable=True)  # 90th percentile
    p95_response_time_ms = Column(Float, nullable=True)  # 95th percentile
    p99_response_time_ms = Column(Float, nullable=True)  # 99th percentile
    request_size_bytes = Column(Integer, nullable=True)
    response_size_bytes = Column(Integer, nullable=True)
    context = Column(JSON, nullable=True)  # Additional context
    
    # Relationships
    benchmark_run = relationship("BenchmarkRun", back_populates="api_metrics")


class ResourceMetric(Base):
    """Records system resource utilization metrics."""
    
    __tablename__ = "benchmark_resource_metrics"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    benchmark_run_id = Column(Integer, ForeignKey("umt.benchmark_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    service = Column(String(50), nullable=False, index=True)  # api, agent, frontend, etc.
    instance_id = Column(String(50), nullable=True)  # For multiple instances of the same service
    cpu_usage_percent = Column(Float, nullable=True)
    memory_usage_mb = Column(Float, nullable=True)
    memory_usage_percent = Column(Float, nullable=True)
    disk_read_bytes = Column(Integer, nullable=True)
    disk_write_bytes = Column(Integer, nullable=True)
    network_in_bytes = Column(Integer, nullable=True)
    network_out_bytes = Column(Integer, nullable=True)
    open_file_descriptors = Column(Integer, nullable=True)
    thread_count = Column(Integer, nullable=True)
    process_count = Column(Integer, nullable=True)
    context = Column(JSON, nullable=True)  # Additional metrics
    
    # Relationships
    benchmark_run = relationship("BenchmarkRun", back_populates="resource_metrics")


class QueueMetric(Base):
    """Records metrics for message queues and async processing."""
    
    __tablename__ = "benchmark_queue_metrics"
    __table_args__ = {"schema": "umt"}
    
    id = Column(Integer, primary_key=True, index=True)
    benchmark_run_id = Column(Integer, ForeignKey("umt.benchmark_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    queue_name = Column(String(100), nullable=False, index=True)
    service = Column(String(50), nullable=False)  # Service responsible for the queue
    queue_length = Column(Integer, nullable=True)
    processing_time_ms = Column(Float, nullable=True)  # Average processing time
    messages_published = Column(Integer, nullable=True)
    messages_consumed = Column(Integer, nullable=True)
    error_count = Column(Integer, nullable=True)
    retry_count = Column(Integer, nullable=True)
    oldest_message_age_sec = Column(Float, nullable=True)  # Age of oldest message in seconds
    context = Column(JSON, nullable=True)  # Additional metrics
    
    # Relationships
    benchmark_run = relationship("BenchmarkRun", back_populates="queue_metrics")