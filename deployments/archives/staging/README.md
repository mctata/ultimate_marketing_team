# Staging Deployment Archives

This directory contains deployment archives created for the staging environment.

## Naming Convention

Archives follow the pattern:
- `staging_deploy_{timestamp}.tar.gz` - For staging deployments

Example: `staging_deploy_20250328_112844.tar.gz`

## Usage

```bash
# Using the deployment script
./scripts/deployment/deploy_staging.sh

# Quick deployment with existing archive
./scripts/deployment/quick_deploy.sh deployments/archives/staging/staging_deploy_20250328_112844.tar.gz
```

## Clean-up Policy

Archives older than 30 days should be removed to conserve disk space, while ensuring at least one known stable version is preserved.