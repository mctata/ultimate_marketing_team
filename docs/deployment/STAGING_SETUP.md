# Staging Environment Setup Guide

This guide explains how to set up and deploy the Ultimate Marketing Team application to a staging environment with AWS RDS for PostgreSQL with pgvector and Google Search Console integration.

## Prerequisites

- An EC2 instance running Ubuntu with Docker and Docker Compose installed
- An AWS RDS PostgreSQL instance with pgvector extension capability
- SSH access to the EC2 instance
- Network connectivity between EC2 and RDS

## Configuration Files

The deployment uses the following configuration files:

1. `.env.staging`: Contains environment variables for all services
2. `docker-compose.staging.yml`: Docker Compose configuration for staging
3. `config/env/deployment.env.staging.template`: SSH and deployment configuration

## Database Setup

The application uses AWS RDS PostgreSQL with pgvector for vector similarity search:

1. Create an RDS instance with PostgreSQL 17 or higher
2. Enable the pgvector extension for your RDS instance
3. Update the `.env.staging` file with the correct database credentials
4. Run the `scripts/deployment/init_rds_database.sh` script to initialize the database

## Deployment Process

To deploy the application to staging:

1. Configure environment variables:
   ```bash
   # Edit .env.staging with your production values
   vi .env.staging
   
   # Edit deployment configuration
   vi config/env/deployment.env.staging.template
   ```

2. Run the deployment script:
   ```bash
   ./scripts/deployment/deploy_staging.sh
   ```

3. Verify the deployment:
   ```bash
   ./scripts/deployment/check_staging_services.sh
   ```

## Services Architecture

The staging deployment includes the following services:

1. **health-api**: Lightweight health check service
2. **api-gateway**: Main API gateway for all endpoints
3. **frontend**: Frontend web application
4. **auth-agent**: Authentication agent service
5. **brand-agent**: Brand management agent
6. **content-strategy-agent**: Content strategy agent
7. **content-creation-agent**: Content creation agent
8. **content-ad-agent**: Content ad management agent
9. **postgres-proxy**: Proxy service for RDS connectivity
10. **redis**: Redis cache service
11. **rabbitmq**: RabbitMQ message broker
12. **vector-db-proxy**: Proxy for vector database (uses RDS)
13. **migrations**: Database migration service

## Database Connection

The application connects to the AWS RDS database using the following parameters:

- `POSTGRES_HOST`: RDS endpoint hostname
- `POSTGRES_PORT`: PostgreSQL port (default: 5432)
- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_DB`: Database name

## Monitoring

The following endpoints are available for monitoring the application:

- Health API: `http://your-ec2-instance:8001`
  - Basic health: `/`
  - System health: `/sys`
  - Docker info: `/docker`
  - Environment: `/env`
  - Network: `/network`
  - Simple ping: `/ping`
  - Readiness: `/ready`
  - Liveness: `/live`

- API Gateway: `http://your-ec2-instance:8000`
  - Basic health: `/`
  - API health: `/api/health`
  - Debug routes: `/api/debug/routes`
  - Router status: `/api/debug/router-status`

## Troubleshooting

If you encounter issues during deployment, check the following:

1. **Database Connection**:
   - Verify RDS connectivity using `scripts/deployment/init_rds_database.sh`
   - Check security groups to ensure EC2 can connect to RDS
   - Verify database credentials in `.env.staging`

2. **API Gateway Issues**:
   - Check logs: `docker-compose -f docker-compose.staging.yml logs api-gateway`
   - Verify database connection in the API startup logs
   - Check if JWT initialization is successful

3. **Agent Services**:
   - Check logs for each agent service
   - Verify RabbitMQ connectivity
   - Check if agents can connect to the database

4. **Docker Issues**:
   - Check Docker network configuration
   - Verify container resource limits
   - Check for Docker errors in the deployment logs

## Maintenance Scripts

The following scripts are available for maintaining the staging environment:

- `deploy_staging.sh`: Deploy the application to staging
- `check_staging_services.sh`: Check the health of all services
- `init_rds_database.sh`: Initialize the RDS database with pgvector
- `db_connect.sh`: Connect to the RDS database
- `update_service_env.sh`: Update environment variables for a service

## Security Considerations

When deploying to staging:

1. Use strong passwords for all services
2. Ensure RDS is properly secured with security groups
3. Keep SSH keys secure and restrict SSH access
4. Use secure JWT and CSRF secrets
5. Consider using AWS Secrets Manager for sensitive credentials
6. Enable TLS for all services

## Setting Up Google Search Console Integration

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

## Next Steps

After a successful staging deployment, consider:

1. Setting up CI/CD pipeline for automated deployments
2. Implementing monitoring and alerting
3. Configuring regular database backups
4. Setting up log aggregation
5. Implementing performance testing