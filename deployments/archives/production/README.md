# Production Deployment Archives

This directory contains deployment archives created for the production environment.

## Naming Convention

Archives follow the pattern:
- `ec2_deploy_{timestamp}.tar.gz` - For EC2 deployments
- `production_deploy_{timestamp}.tar.gz` - For production deployments

Example: `ec2_deploy_20250330_095209.tar.gz`

## Usage

```bash
# Using the deployment script
./scripts/deployment/ec2_deploy.sh

# Manual deployment with an existing archive
scp -i "ultimate-marketing-staging.pem" deployments/archives/production/ec2_deploy_YYYYMMDD_HHMMSS.tar.gz ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com:/tmp/
```

## Clean-up Policy

Archives older than 60 days should be removed to conserve disk space, while ensuring at least two known stable versions are preserved for disaster recovery purposes.