# Ultimate Marketing Team - Deployment Summary

## Deployment Options

The Ultimate Marketing Team platform can be deployed to:

1. **Amazon EC2 (Recommended)**
   - Deployed to: staging.tangible-studios.com (44.202.29.233)
   - Deployment script: `./scripts/deploy/ec2_deploy.sh`
   - Documentation: [EC2 Deployment Guide](docs/deployment/EC2_DEPLOYMENT_GUIDE.md)

2. **Legacy Shared Hosting**
   - Deployment script: `./scripts/deploy/deploy_staging.sh`
   - Documentation: [Staging Deployment Guide](docs/deployment/STAGING_DEPLOY_INSTRUCTIONS.md)

## Quick Start

```bash
# EC2 Deployment
./scripts/deploy/ec2_deploy.sh

# For complete instructions, see the docs/deployment directory
```

## SSL Configuration

1. For development: Generate self-signed certificates
   ```bash
   ./scripts/deployment/simple_ssl_setup.sh staging.tangible-studios.com
   ```

2. For production: Use Let's Encrypt certificates after deploying
   (See [SSL Setup Workflow](scripts/deployment/ssl_workflow.md) for details)

## Documentation

- [Full Deployment Summary](docs/deployment/DEPLOYMENT_SUMMARY.md)
- [EC2 Deployment Guide](docs/deployment/EC2_DEPLOYMENT_GUIDE.md)
- [Simplified Staging Deployment](docs/deployment/SIMPLIFIED_STAGING_DEPLOY.md)
- [SSL Setup Workflow](scripts/deployment/ssl_workflow.md)
- [Deployment Troubleshooting](docs/deployment/STAGING_DEPLOYMENT_TROUBLESHOOTING.md)