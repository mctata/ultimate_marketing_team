# Deployment Configuration Management

This directory contains configuration templates for different deployment environments.

## Security Notice

**IMPORTANT**: The actual configuration files with real secrets should NEVER be committed to version control!

All files in this directory should be templates only. Real configuration files will be generated using Bitwarden as a secure vault for sensitive information.

## Available Templates

- `deployment.env.*.template`: Templates for deployment configuration
- `frontend.env.*.template`: Templates for frontend environment variables

## How to Use

1. Templates in this directory serve as reference only
2. Actual secrets are stored in Bitwarden's vault
3. Use the `scripts/utilities/fetch_secrets.sh` script to generate real configuration files:

```bash
./scripts/utilities/fetch_secrets.sh staging
```

This will:
1. Connect to Bitwarden
2. Fetch the deployment secrets for the specified environment
3. Create the actual configuration file in this directory

## Bitwarden Setup

For each environment, create a secure note in Bitwarden with the following:

1. Item name: `deployment-{environment}` (e.g., `deployment-staging`)
2. Custom fields:
   - SSH_USER
   - SSH_HOST
   - SSH_PORT
   - REMOTE_DIR
   - SSH_KEY
   - COMPOSE_FILE

## Security Best Practices

1. Never commit actual configuration files to Git (they are in .gitignore)
2. Use strong, unique passwords for Bitwarden
3. Only add users to the Bitwarden organization who need deployment access
4. Regularly rotate SSH keys and other credentials
5. Consider using Bitwarden's "hide password" option for sensitive fields