# Merge log-ci-integration to main for staging deployment

## Summary
- Implements token refresh mechanism for frontend authentication
- Adds template environment files for staging deployment
- Updates the deployment script to handle environment files properly
- Adds secure handling of credentials using local secrets directory

## Changes
- Enhanced frontend authentication with automatic token refresh
- Added proper error handling for OAuth callbacks
- Created template environment files with placeholders
- Created a secrets directory for safe local storage of credentials
- Updated deployment script to handle environment files properly
- Added JWT token rotation for security

## Security Improvements
- Local secrets folder that is git-ignored
- Deployment script that prioritizes local secrets
- Environment templates with placeholder values
- No credentials in git history

## Testing
- Tested token refresh mechanism in the browser
- Verified that the auth flow works with mock credentials
- Checked for any sensitive values in template files
- Validated the deployment script functionality

## Deployment Instructions
1. Clone the repository
2. Add real credentials to deployment_secrets/.env.staging.real
3. Run `SSH_USER=tangible-studios.com SSH_HOST=ssh.tangible-studios.com ./scripts/deploy/deploy_staging.sh`
