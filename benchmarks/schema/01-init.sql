-- Initialize database schema for benchmarking
CREATE SCHEMA IF NOT EXISTS umt;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create benchmark tables
BEGIN;

-- BenchmarkRun table
CREATE TABLE IF NOT EXISTS umt.benchmark_runs (
    id SERIAL PRIMARY KEY,
    run_id VARCHAR(50) UNIQUE NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    environment VARCHAR(20) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    git_commit VARCHAR(40),
    git_branch VARCHAR(100),
    test_type VARCHAR(50) NOT NULL,
    parameters JSONB,
    summary_metrics JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    notes TEXT
);

-- APIMetric table
CREATE TABLE IF NOT EXISTS umt.benchmark_api_metrics (
    id SERIAL PRIMARY KEY,
    benchmark_run_id INTEGER NOT NULL REFERENCES umt.benchmark_runs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time_ms FLOAT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    error_count INTEGER NOT NULL DEFAULT 0,
    min_response_time_ms FLOAT,
    max_response_time_ms FLOAT,
    avg_response_time_ms FLOAT,
    median_response_time_ms FLOAT,
    p90_response_time_ms FLOAT,
    p95_response_time_ms FLOAT,
    p99_response_time_ms FLOAT,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    context JSONB
);

-- ResourceMetric table
CREATE TABLE IF NOT EXISTS umt.benchmark_resource_metrics (
    id SERIAL PRIMARY KEY,
    benchmark_run_id INTEGER NOT NULL REFERENCES umt.benchmark_runs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    service VARCHAR(50) NOT NULL,
    instance_id VARCHAR(50),
    cpu_usage_percent FLOAT,
    memory_usage_mb FLOAT,
    memory_usage_percent FLOAT,
    disk_read_bytes INTEGER,
    disk_write_bytes INTEGER,
    network_in_bytes INTEGER,
    network_out_bytes INTEGER,
    open_file_descriptors INTEGER,
    thread_count INTEGER,
    process_count INTEGER,
    context JSONB
);

-- QueueMetric table
CREATE TABLE IF NOT EXISTS umt.benchmark_queue_metrics (
    id SERIAL PRIMARY KEY,
    benchmark_run_id INTEGER NOT NULL REFERENCES umt.benchmark_runs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    queue_name VARCHAR(100) NOT NULL,
    service VARCHAR(50) NOT NULL,
    queue_length INTEGER,
    processing_time_ms FLOAT,
    messages_published INTEGER,
    messages_consumed INTEGER,
    error_count INTEGER,
    retry_count INTEGER,
    oldest_message_age_sec FLOAT,
    context JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS benchmark_runs_app_version_idx ON umt.benchmark_runs(app_version);
CREATE INDEX IF NOT EXISTS benchmark_runs_start_time_idx ON umt.benchmark_runs(start_time);
CREATE INDEX IF NOT EXISTS benchmark_runs_test_type_idx ON umt.benchmark_runs(test_type);

CREATE INDEX IF NOT EXISTS benchmark_api_metrics_run_id_idx ON umt.benchmark_api_metrics(benchmark_run_id);
CREATE INDEX IF NOT EXISTS benchmark_api_metrics_timestamp_idx ON umt.benchmark_api_metrics(timestamp);
CREATE INDEX IF NOT EXISTS benchmark_api_metrics_endpoint_idx ON umt.benchmark_api_metrics(endpoint);

CREATE INDEX IF NOT EXISTS benchmark_resource_metrics_run_id_idx ON umt.benchmark_resource_metrics(benchmark_run_id);
CREATE INDEX IF NOT EXISTS benchmark_resource_metrics_timestamp_idx ON umt.benchmark_resource_metrics(timestamp);
CREATE INDEX IF NOT EXISTS benchmark_resource_metrics_service_idx ON umt.benchmark_resource_metrics(service);

CREATE INDEX IF NOT EXISTS benchmark_queue_metrics_run_id_idx ON umt.benchmark_queue_metrics(benchmark_run_id);
CREATE INDEX IF NOT EXISTS benchmark_queue_metrics_timestamp_idx ON umt.benchmark_queue_metrics(timestamp);
CREATE INDEX IF NOT EXISTS benchmark_queue_metrics_queue_name_idx ON umt.benchmark_queue_metrics(queue_name);

COMMIT;