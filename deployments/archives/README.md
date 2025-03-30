# Deployment Archives

This directory contains deployment archives created for staging and production environments.

## Directory Structure

- `staging/` - Archives for the staging environment
- `production/` - Archives for the production environment
- `local/` - Archives for local testing (if needed)

## Naming Convention

Archives follow the pattern:
- `staging_deploy_{timestamp}.tar.gz` - Standard deployments
- `minimal_staging_deploy_{timestamp}.tar.gz` - Compact deployments

Example: `minimal_staging_deploy_20250330_162316.tar.gz`

## Archive Contents

Each archive contains:
- Source code
- Configuration files
- Environment files (.env templates)
- Docker configuration files
- Deployment scripts

## Latest Stable Archives

- Latest EC2 archive: Created when running `scripts/deployment/ec2_deploy.sh`
- Latest shared hosting archive: `staging_deploy_20250328_112844.tar.gz`

## Usage

### EC2 Deployment

```bash
# Using the deployment script
./scripts/deployment/ec2_deploy.sh

# Manual deployment with an existing archive
scp -i "ultimate-marketing-staging.pem" deployments/archives/production/ec2_deploy_YYYYMMDD_HHMMSS.tar.gz ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com:/tmp/
ssh -i "ultimate-marketing-staging.pem" ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com

# On the EC2 server
mkdir -p ~/ultimate_marketing_team
tar -xzf /tmp/ec2_deploy_YYYYMMDD_HHMMSS.tar.gz -C ~/ultimate_marketing_team
cd ~/ultimate_marketing_team
docker-compose -f docker-compose.ec2.yml up -d
```

### Shared Hosting Deployment

```bash
# Using the quick deploy script
./scripts/deployment/quick_deploy.sh deployments/archives/staging/staging_deploy_20250328_112844.tar.gz
```

## Clean-up Policy

Archives older than 30 days should be removed to conserve disk space, while ensuring at least one known stable version is preserved for each environment.