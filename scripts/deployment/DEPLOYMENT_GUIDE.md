# Ultimate Marketing Team Deployment Guide

## Deployment Scripts: Simple Explanation

We have two main deployment scripts:

### 1. deploy_staging.sh
**Purpose**: Deploys the application to a remote server.
**Location**: scripts/deployment/deploy_staging.sh
**When to use**: When you need to deploy to an actual staging server.
**What it does**: 
- Connects to a remote server via SSH
- Copies files to the server
- Builds and starts Docker containers remotely

### 2. deploy.sh (inside staging folder)
**Purpose**: Tests deployment locally with full database validation.
**Location**: scripts/deployment/staging/deploy.sh
**When to use**: When testing deployment configuration locally.
**What it does**:
- Starts all containers in the correct sequence
- Performs database validation
- Offers automated repair of common issues

## Which Script Should I Use?

- **For actual deployment**: Use `./scripts/deployment/deploy_staging.sh`
- **For local testing**: Use `./scripts/deployment/staging/deploy.sh`

## Common Issues and Fix Scripts

### If you see: "build path ./monitoring does not exist"
Run: `./scripts/deployment/fix_health_api.sh`

### If you see: "API gateway database connection issues"
Run: `./scripts/deployment/fix_api_gateway_db.sh`

## Deployment Process

1. Ensure SSH key permissions are correct (if deploying remotely)
2. Make sure correct .env files exist
3. Run appropriate deployment script:
   ```bash
   # Remote deployment
   ./scripts/deployment/deploy_staging.sh
   
   # OR for local testing
   ./scripts/deployment/staging/deploy.sh
   ```
4. If errors occur, check logs and run appropriate fix script