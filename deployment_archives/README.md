# Deployment Archives

This directory contains deployment archives created for staging and production environments.

## Naming Convention

Archives follow the pattern: `{environment}_deploy_{timestamp}.tar.gz`

Example: `staging_deploy_20250328_112844.tar.gz`

## Archive Contents

Each archive contains:
- Source code
- Configuration files
- Environment files (.env templates)
- Docker configuration files
- Deployment scripts

## Latest Staging Archive

The latest stable staging archive is: `staging_deploy_20250328_112844.tar.gz`

## Usage

To deploy using an archive from this directory, use the quick_deploy.sh script:

```bash
cd /Users/tanialopes/Desktop/Projects/_ultimate_marketing_team
scripts/deployment/quick_deploy.sh deployment_archives/staging_deploy_20250328_112844.tar.gz
```

## Clean-up Policy

Archives older than 30 days should be removed to conserve disk space.