# Configuration Files

This directory contains all application configuration files.

## Directory Structure

- `/env/`: Environment-specific configuration files
  - `.env.staging`: Environment variables for staging environment
  - `frontend.env.staging`: Frontend-specific environment variables for staging
- `/alertmanager/`: Alert manager configuration
- `/blackbox-exporter/`: Black box exporter configuration
- `/grafana/`: Grafana dashboards and configuration
- `/logstash/`: Logstash configuration
- `/otel-collector/`: OpenTelemetry collector configuration
- `/prometheus/`: Prometheus configuration

## Usage Guidelines

1. Never commit sensitive credentials directly into these configuration files
2. Use environment variables for secrets in the CI/CD pipeline
3. Keep symbolic links in root directories that point to these configuration files
4. Template files (examples) should have `.example` suffix