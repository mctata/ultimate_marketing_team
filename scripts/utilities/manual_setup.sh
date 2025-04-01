#!/bin/bash
# Script to manually set up deployment configuration without Bitwarden

set -e

# Environment name (staging, production, etc.)
ENV=${1:-"staging"}
CONFIG_DIR="config/env"
DEPLOYMENT_CONFIG="${CONFIG_DIR}/deployment.env.${ENV}"
ENV_CONFIG="${CONFIG_DIR}/.env.${ENV}"

echo "Creating manual deployment configuration for $ENV environment..."

# Create the deployment config file for staging
if [ "$ENV" = "staging" ]; then
    cat > "$DEPLOYMENT_CONFIG" << EOL
# Staging deployment configuration - Generated manually
# DO NOT COMMIT THIS FILE
SSH_USER=ubuntu
SSH_HOST=ec2-44-202-29-233.compute-1.amazonaws.com
SSH_PORT=22
REMOTE_DIR=/home/ubuntu/ultimate-marketing-team
SSH_KEY=/Users/tanialopes/Desktop/Projects/_ultimate_marketing_team/ultimate-marketing-staging.pem
ENVIRONMENT=staging
COMPOSE_FILE=docker-compose.staging.yml
EOL
    echo "Created $DEPLOYMENT_CONFIG with staging values"
    
    # Create the environment config file for staging using placeholder values
    cat > "$ENV_CONFIG" << EOL
# Application environment variables for staging
# Replace all placeholder values with actual credentials

# Database credentials
POSTGRES_USER=postgres
POSTGRES_PASSWORD=REPLACE_WITH_ACTUAL_PASSWORD
POSTGRES_DB=ultimatemarketing_db
POSTGRES_HOST=REPLACE_WITH_ACTUAL_HOST
DATABASE_URL=postgresql://postgres:REPLACE_WITH_ACTUAL_PASSWORD@REPLACE_WITH_ACTUAL_HOST:5432/ultimatemarketing_db

# JWT settings
JWT_SECRET=REPLACE_WITH_SECURE_RANDOM_STRING
JWT_EXPIRY=3600
JWT_ALGORITHM=HS256

# Redis cache
REDIS_URL=redis://redis:6379/0

# API settings
API_BASE_URL=https://staging.example.com/api
FRONTEND_URL=https://staging.example.com

# Environment
ENVIRONMENT=staging
LOG_LEVEL=INFO
EOL
    echo "Created $ENV_CONFIG with PLACEHOLDER values - YOU MUST EDIT THIS FILE with real values!"
    
elif [ "$ENV" = "local" ]; then
    cat > "$DEPLOYMENT_CONFIG" << EOL
# Local deployment configuration - Generated manually
# DO NOT COMMIT THIS FILE
SSH_USER=localhost
SSH_HOST=localhost
SSH_PORT=22
REMOTE_DIR=/tmp/umt-local-deploy
SSH_KEY=~/.ssh/id_rsa
ENVIRONMENT=local
COMPOSE_FILE=docker-compose.dev.yml
EOL
    echo "Created $DEPLOYMENT_CONFIG with local values"
    
    # Create the environment config file for local
    cat > "$ENV_CONFIG" << EOL
# Local environment configuration
# Replace with your actual local values
POSTGRES_USER=postgres
POSTGRES_PASSWORD=REPLACE_WITH_LOCAL_PASSWORD
POSTGRES_DB=ultimatemarketing_db
POSTGRES_HOST=localhost
DATABASE_URL=postgresql://postgres:REPLACE_WITH_LOCAL_PASSWORD@localhost:5432/ultimatemarketing_db

# Development settings
ENVIRONMENT=development
LOG_LEVEL=DEBUG
EOL
    echo "Created $ENV_CONFIG with placeholder values - YOU MUST EDIT THIS FILE with real values!"
    
else
    echo "Environment not supported for manual setup: $ENV"
    echo "Supported environments: staging, local"
    exit 1
fi

echo "WARNING: These files contain placeholder values for sensitive information."
echo "You MUST edit these files to insert real credentials before deploying!"
echo ""
echo "Edit these files now:"
echo "1. $DEPLOYMENT_CONFIG - Edit if needed to update SSH details"
echo "2. $ENV_CONFIG - MUST edit to replace all placeholder values with real credentials"
echo ""
echo "After editing, you can deploy using:"
echo "./scripts/deployment/deploy_staging.sh"