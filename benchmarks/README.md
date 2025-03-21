# Performance Benchmarking Suite

This directory contains the performance benchmarking suite for the Ultimate Marketing Team platform. It provides tools for load testing, performance monitoring, and regression detection.

## Structure

- **load_tests/**: Load testing scripts using Locust
- **metrics/**: Metrics collection and storage
- **dashboards/**: Grafana dashboard configurations
- **runners/**: Benchmark execution and report generation
- **schema/**: Database initialization for metrics storage
- **prometheus/**: Prometheus configuration for metrics collection
- **Dockerfile**: Container for running benchmarks
- **docker-compose.benchmark.yml**: Containerized benchmarking environment

## Quick Start

### Run a Benchmark Locally

```bash
# Install dependencies
pip install -r requirements.txt
pip install locust psutil requests

# Run a benchmark
python benchmarks/runners/run_benchmark.py \
  --test-script locustfile.py \
  --host http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --app-version dev
```

### Run with Docker Compose

```bash
# Start the benchmarking environment
docker-compose -f benchmarks/docker-compose.benchmark.yml up -d

# Access Grafana dashboards
open http://localhost:3000
```

### Run in CI Pipeline

```bash
# Manually trigger the GitHub Actions workflow
gh workflow run performance.yml -f environment=staging -f baseline_version=v1.0.0

# View the results in GitHub Actions
gh run list --workflow=performance.yml
```

## Load Testing Scenarios

The suite includes several pre-configured load testing scenarios:

1. **API Load Test (locustfile.py)**
   - General API endpoints under load
   - 100-1000 concurrent users
   - Variable spawn rates

2. **Content Generation Test (content_generation_test.py)**
   - Focused on content generation workflows
   - Tests simple, medium, and complex content types
   - Measures response times and error rates

3. **Authentication & Session Test (auth_session_test.py)**
   - Tests user authentication and session management
   - High concurrency (200+ users)
   - Token refreshing and verification

## Metrics Collection

The benchmarking suite collects various metrics:

1. **API Metrics**
   - Response times (avg, min, max, p95, p99)
   - Request rates and throughput
   - Error rates and status codes
   - Request/response sizes

2. **Resource Metrics**
   - CPU usage by service
   - Memory usage by service
   - Network I/O
   - Disk I/O
   - Thread counts

3. **Queue Metrics**
   - Queue lengths
   - Processing times
   - Message rates (published/consumed)
   - Error rates
   - Backlog age

## Visualization and Reporting

1. **Grafana Dashboards**
   - API Performance Dashboard
   - Version Comparison Dashboard
   - Resource Utilization Dashboard

2. **Automated Reports**
   - HTML performance reports
   - Jupyter notebook reports with visualizations
   - Regression detection and highlighting

## Integration with CI/CD

The benchmarking suite integrates with the existing CI/CD pipeline:

1. **GitHub Actions Workflow**
   - Triggered on release candidates
   - Weekly scheduled runs
   - Manual trigger with parameters

2. **Regression Testing**
   - Compare performance against baseline versions
   - Detect and alert on performance regressions
   - Configurable thresholds for acceptable changes

3. **Reports and Artifacts**
   - Store benchmark results as artifacts
   - Generate and publish reports
   - Notify on significant findings

## Configuration

### Environment Variables

- `APP_VERSION`: Version of the application being tested
- `TARGET_HOST`: Target host URL for benchmarks
- `USERS`: Number of simulated users
- `SPAWN_RATE`: Rate of user spawning (users per second)
- `RUN_TIME`: Test duration (e.g., "5m", "1h")
- `TEST_TYPE`: Type of test (load, stress, soak, spike)
- `BASELINE_VERSION`: Version to compare against
- `FAIL_ON_REGRESSION`: Exit with error code if regressions detected

### Threshold Configuration

Performance regression thresholds can be configured in a JSON file:

```json
{
  "response_time": 0.2,  // 20% regression allowed
  "error_rate": 0.01,    // 1% absolute increase allowed
  "cpu_usage": 0.15,     // 15% increase allowed
  "memory_usage": 0.15,  // 15% increase allowed
  "queue_length": 0.25   // 25% increase allowed
}
```

## Adding New Benchmarks

To add a new benchmark test:

1. Create a new Locust script in `load_tests/`
2. Configure the test in `runners/ci_runner.py`
3. Add visualization panels to Grafana dashboards
4. Update the CI/CD workflow to include the new test

## License

This benchmarking suite is licensed under the same license as the Ultimate Marketing Team platform.