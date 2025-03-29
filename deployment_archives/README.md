# Deployment Archives

This directory contains deployment archives created for staging and production environments.

## Naming Convention

Archives follow the pattern:
- `ec2_deploy_{timestamp}.tar.gz` - For EC2 deployments
- `staging_deploy_{timestamp}.tar.gz` - For shared hosting deployments

Example: `staging_deploy_20250328_112844.tar.gz`

## Archive Contents

Each archive contains:
- Source code
- Configuration files
- Environment files (.env templates)
- Docker configuration files
- Deployment scripts

## Latest Stable Archives

- Latest EC2 archive: Created when running `scripts/deploy/ec2_deploy.sh`
- Latest shared hosting archive: `staging_deploy_20250328_112844.tar.gz`

## Usage

### EC2 Deployment

```bash
# Using the deployment script
./scripts/deploy/ec2_deploy.sh

# Manual deployment with an existing archive
scp -i "ultimate-marketing-staging.pem" deployment_archives/ec2_deploy_YYYYMMDD_HHMMSS.tar.gz ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com:/tmp/
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
./scripts/deploy/quick_deploy.sh deployment_archives/staging_deploy_20250328_112844.tar.gz
```

## Clean-up Policy

Archives older than 30 days should be removed to conserve disk space, while ensuring at least one known stable version is preserved for each environment.