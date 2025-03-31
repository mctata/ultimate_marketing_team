#!/bin/bash
# Script to fetch deployment and environment secrets from Bitwarden vault

set -e

# Environment name (staging, production, etc.)
ENV=${1:-"staging"}
OUTPUT_DIR="config/env"
DEPLOYMENT_OUTPUT="${OUTPUT_DIR}/deployment.env.${ENV}"
ENV_OUTPUT="${OUTPUT_DIR}/.env.${ENV}"
DEPLOYMENT_TEMPLATE="${OUTPUT_DIR}/deployment.env.${ENV}.template"
ENV_TEMPLATE="${OUTPUT_DIR}/.env.${ENV}.template"

# Check if Bitwarden CLI is installed
if ! command -v bw &> /dev/null; then
    echo "Bitwarden CLI is not installed. Please install it first:"
    echo "npm install -g @bitwarden/cli"
    exit 1
fi

# Check if logged in
BW_STATUS=$(bw status | jq -r '.status')
if [ "$BW_STATUS" != "unlocked" ]; then
    echo "Please login to Bitwarden first:"
    echo "bw login"
    echo "or"
    echo "bw unlock"
    exit 1
fi

# Get session key
SESSION_KEY=$(bw unlock --raw)
if [ -z "$SESSION_KEY" ]; then
    echo "Failed to get Bitwarden session key"
    exit 1
fi

# Export session key
export BW_SESSION="$SESSION_KEY"

# Check what items are in the vault
echo "Items in your Bitwarden vault that might match:"
BW_ITEMS=$(bw list items | jq -r '.[] | select(.name | contains("deployment") or contains("env")) | .name')
if [ ! -z "$BW_ITEMS" ]; then
    echo "$BW_ITEMS"
else
    echo "No relevant items found. You need to create the required items first."
fi
echo ""

# Get deployment item from Bitwarden vault
ITEM_NAME="deployment-${ENV}"
echo "Fetching deployment secrets for $ENV environment..."

# Get the item
echo "Looking for Bitwarden item: $ITEM_NAME..."
BW_ITEM=$(bw get item "$ITEM_NAME" 2>/dev/null)
if [ -z "$BW_ITEM" ]; then
    echo "No item found with name: $ITEM_NAME"
    echo "Let's see what items exist in your vault:"
    bw list items --search "deployment" | jq -r '.[].name'
    echo ""
    echo "Please create a secure note in Bitwarden with the name: $ITEM_NAME"
    echo "and add the required fields from the template file: $DEPLOYMENT_TEMPLATE"
    exit 1
fi

# Extract custom fields from the item for deployment config
SSH_USER=$(echo "$BW_ITEM" | jq -r '.fields[] | select(.name=="SSH_USER") | .value')
SSH_HOST=$(echo "$BW_ITEM" | jq -r '.fields[] | select(.name=="SSH_HOST") | .value')
SSH_PORT=$(echo "$BW_ITEM" | jq -r '.fields[] | select(.name=="SSH_PORT") | .value')
REMOTE_DIR=$(echo "$BW_ITEM" | jq -r '.fields[] | select(.name=="REMOTE_DIR") | .value')
SSH_KEY=$(echo "$BW_ITEM" | jq -r '.fields[] | select(.name=="SSH_KEY") | .value')
COMPOSE_FILE=$(echo "$BW_ITEM" | jq -r '.fields[] | select(.name=="COMPOSE_FILE") | .value')

# Check if all deployment fields were found
if [ -z "$SSH_USER" ] || [ -z "$SSH_HOST" ] || [ -z "$SSH_PORT" ] || [ -z "$REMOTE_DIR" ] || [ -z "$SSH_KEY" ] || [ -z "$COMPOSE_FILE" ]; then
    echo "Some required deployment fields are missing from the Bitwarden item"
    echo "Please ensure all fields from the deployment template exist in your Bitwarden item"
    exit 1
fi

# Create the deployment environment file
cat > "$DEPLOYMENT_OUTPUT" << EOL
# ${ENV} deployment configuration - Generated from Bitwarden
# DO NOT COMMIT THIS FILE
SSH_USER=${SSH_USER}
SSH_HOST=${SSH_HOST}
SSH_PORT=${SSH_PORT}
REMOTE_DIR=${REMOTE_DIR}
SSH_KEY=${SSH_KEY}
ENVIRONMENT=${ENV}
COMPOSE_FILE=${COMPOSE_FILE}
EOL

echo "Deployment secrets for $ENV environment have been saved to $DEPLOYMENT_OUTPUT"

# Now fetch the application env secrets
ENV_ITEM_NAME="env-${ENV}"
echo "Fetching application secrets for $ENV environment..."

# Get the item
ENV_BW_ITEM=$(bw get item "$ENV_ITEM_NAME")
if [ -z "$ENV_BW_ITEM" ]; then
    echo "No item found with name: $ENV_ITEM_NAME"
    echo "Please create a secure note in Bitwarden with the name: $ENV_ITEM_NAME"
    echo "with the application environment variables."
    echo "Skipping application env file creation."
else
    # Get the secure note content
    ENV_CONTENT=$(echo "$ENV_BW_ITEM" | jq -r '.notes')
    
    # Create the application environment file
    echo "$ENV_CONTENT" > "$ENV_OUTPUT"
    echo "Application secrets for $ENV environment have been saved to $ENV_OUTPUT"
fi

echo "WARNING: These files contain sensitive information. Do not commit them to version control."
echo "They should be automatically ignored by .gitignore. Please verify!"

# Lock the Bitwarden vault
bw lock

echo "Done!"