# Deployments Directory

This directory organizes all deployment-related assets for the Ultimate Marketing Team project.

## Structure

- `archives/` - Deployment archives for all environments
  - `staging/` - Staging deployment archives
  - `production/` - Production deployment archives
- `secrets/` - Environment credentials (gitignored)

## Usage

### Archives

Deployment archives are automatically saved here when running deployment scripts.
These archives can be used for rollbacks if needed.

```bash
# Deploy using an existing archive
./scripts/deployment/quick_deploy.sh deployments/archives/staging/staging_deploy_20250328_112844.tar.gz
```

### Secrets

Store environment-specific credentials here. These files are ignored by git for security.

Expected files:
- `.env.staging.real` - Real environment variables for the staging backend
- `frontend.env.staging.real` - Real environment variables for the staging frontend

The deployment scripts will automatically use these files if they exist.