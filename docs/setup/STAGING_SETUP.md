# Setting Up Staging Environment for Google Search Console Integration

This document outlines the steps needed to set up the staging environment at https://staging.tangible-studios.com/ and configure the Google Search Console integration.

## Prerequisites

### Install Docker and Docker Compose on the Staging Server

Before deploying, ensure Docker and Docker Compose are installed on the staging server:

```bash
# Update packages
sudo apt-get update

# Install dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# Add Docker repository
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# Update packages again
sudo apt-get update

# Install Docker
sudo apt-get install -y docker-ce

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group
sudo usermod -aG docker $USER
```

**Note:** You may need to log out and log back in for group changes to take effect.

## Staging Environment Setup

1. Upload project files to the staging server:

```bash
# Fill in your SSH credentials
SSH_USER=your_username SSH_HOST=staging.tangible-studios.com ./scripts/deployment/deploy_staging.sh
```

2. Configure environment variables on the staging server:

- Update `.env.staging` with the correct database credentials and API keys
- Set the `GOOGLE_OAUTH2_CLIENT_ID` and `GOOGLE_OAUTH2_CLIENT_SECRET` values

## Setting Up Google OAuth2 for Testing

### Step 1: Create a dedicated Google Cloud Project for testing

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "UMT Staging SEO Testing")
3. Enable the Google Search Console API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Search Console API"
   - Click "Enable"

### Step 2: Configure OAuth2 Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Fill in the required fields:
   - App name: "UMT Staging"
   - User support email: Your email
   - Developer contact information: Your email
4. Add the required scopes:
   - `https://www.googleapis.com/auth/webmasters.readonly`
5. Add test users (your email and any team members who need access)
6. Complete the setup

### Step 3: Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Set the name to "UMT Staging Web Client"
5. Add the authorized redirect URI:
   - `https://staging.tangible-studios.com/api/seo/oauth2callback`
6. Click "Create"
7. Note the Client ID and Client Secret

### Step 4: Update Environment Variables

1. Update the .env.staging file with the new credentials:
   ```
   GOOGLE_OAUTH2_CLIENT_ID=your_client_id
   GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret
   ```

2. Deploy these changes to the staging server

### Step 5: Generate Refresh Token for GitHub Secrets

1. Start the minimal testing environment:
   ```bash
   GOOGLE_OAUTH2_CLIENT_ID=your_client_id GOOGLE_OAUTH2_CLIENT_SECRET=your_client_secret docker-compose -f docker/gsc-test/docker-compose.gsc-test.yml up -d
   ```

2. Visit `https://staging.tangible-studios.com/api/seo/auth/google/init?brand_id=1` in your browser
   - This will redirect you to Google's authorization page

3. Complete the OAuth flow by authorizing the application
   - You'll be redirected back to the staging frontend

4. Check the token file:
   - SSH into the staging server
   - Locate the token file in the `.tokens` directory: `.tokens/gsc_token_1.json`
   - Extract the `refresh_token` value from this file

5. Add the refresh token to GitHub Secrets:
   - Go to your GitHub repository settings > Secrets and variables > Actions
   - Add or update the `TEST_GSC_REFRESH_TOKEN` secret with this value
   - Also add `TEST_GSC_SITE_URL` with a URL you have access to in Search Console

## Verify the Setup

1. Run the Search Console tests workflow manually:
   - Go to GitHub Actions tab
   - Select the "Google Search Console Tests" workflow
   - Click "Run workflow"

2. Check that the tests are passing
   - If there are any issues, check the workflow logs for details

## Troubleshooting

- **OAuth Errors**: Verify that the redirect URI exactly matches what's configured in Google Cloud Console
- **Permission Issues**: Make sure your Google account has access to the Search Console property you're testing with
- **Token Storage**: Check that the token file is being created and stored correctly in the `.tokens` directory
- **Refresh Token Expiry**: If tests start failing unexpectedly, you may need to regenerate the refresh token

## Regular Maintenance

- Monitor the Search Console API quota usage
- Check for any test failures in the CI/CD pipeline
- Rotate the refresh token periodically for security (e.g., every 90 days)