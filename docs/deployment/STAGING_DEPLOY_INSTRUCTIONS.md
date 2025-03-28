# Staging Deployment Instructions

## Pre-deployment Checks
1. Ensure all required code changes are committed
2. Build the frontend code locally
3. Create a deployment archive

## Deployment Steps

### 1. Create the Deployment Archive
The deployment archive has already been created:
```
staging_deploy_20250328_112844.tar.gz
```

### 2. Upload to Staging Server
Use SCP to upload the archive to the staging server:
```bash
scp staging_deploy_20250328_112844.tar.gz tangible-studios.com@ssh.tangible-studios.com:/tmp/
```

### 3. Connect to Staging Server
SSH into the staging server:
```bash
ssh tangible-studios.com@ssh.tangible-studios.com
```

### 4. Extract and Deploy
Run these commands on the staging server:
```bash
# Create directory if it doesn't exist
mkdir -p /customers/8/2/5/tangible-studios.com/httpd.www/staging

# Extract files
echo "Extracting deployment archive..."
tar -xzf /tmp/staging_deploy_20250328_112844.tar.gz -C /customers/8/2/5/tangible-studios.com/httpd.www/staging

# Navigate to the project directory
cd /customers/8/2/5/tangible-studios.com/httpd.www/staging

# Make scripts executable
chmod +x scripts/*.sh scripts/*.py

# Run docker-compose for staging environment
echo "Starting Docker containers..."
docker-compose -f docker-compose.staging.yml down
docker-compose -f docker-compose.staging.yml up -d

# Clean up
echo "Cleaning up..."
rm /tmp/staging_deploy_20250328_112844.tar.gz
```

## Post-Deployment Setup

### 1. Verify Environment Variables
Check and update the environment variables if needed:
```bash
# Update .env.staging with the correct database credentials and API keys
# Set the GOOGLE_OAUTH2_CLIENT_ID and GOOGLE_OAUTH2_CLIENT_SECRET values
```

### 2. Google OAuth2 Setup for Testing
1. Create a dedicated Google Cloud Project for testing
2. Configure OAuth2 Consent Screen
3. Create OAuth2 Credentials 
4. Update Environment Variables with the new credentials
5. Generate Refresh Token for GitHub Secrets
   ```bash
   GOOGLE_OAUTH2_CLIENT_ID=your_client_id GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret docker-compose -f docker/gsc-test/docker-compose.gsc-test.yml up -d
   ```
   - Visit `https://staging-api.tangible-studios.com/api/seo/auth/google/init?brand_id=1` in your browser
   - Complete the OAuth flow by authorizing the application
   - Extract the refresh token from `.tokens/gsc_token_1.json` (located in the project root directory)
   - If you can't find it directly, SSH into the container to check:
     ```bash
     docker exec -it umt_api-gateway bash
     cat /app/.tokens/gsc_token_1.json
     ```
   - Add to GitHub Secrets as `TEST_GSC_REFRESH_TOKEN`

### 3. Verify the Setup
1. Check that the application is running correctly
2. Run the Search Console tests workflow in GitHub Actions
3. Check for any issues in the logs

## Troubleshooting
- **OAuth Errors**: Verify that the redirect URI exactly matches what's configured in Google Cloud Console
- **Permission Issues**: Make sure your Google account has access to the Search Console property you're testing with
- **Token Storage**: Check that the token file is being created and stored correctly in the `.tokens` directory
- **Refresh Token Expiry**: If tests start failing unexpectedly, you may need to regenerate the refresh token