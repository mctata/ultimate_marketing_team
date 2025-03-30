#!/bin/bash
# Script to help create Bitwarden items for deployment secrets

set -e

# Environment name (staging, production, etc.)
ENV=${1:-"staging"}
TEMPLATE_DIR="config/env"
DEPLOYMENT_TEMPLATE="${TEMPLATE_DIR}/deployment.env.${ENV}.template"
ENV_TEMPLATE="${TEMPLATE_DIR}/.env.${ENV}.template"

# Check if Bitwarden CLI is installed
if ! command -v bw &> /dev/null; then
    echo "Bitwarden CLI is not installed. Please install it first:"
    echo "npm install -g @bitwarden/cli"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install it first:"
    echo "brew install jq  # macOS"
    echo "apt-get install jq  # Ubuntu/Debian"
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

# Check if template files exist
if [ ! -f "$DEPLOYMENT_TEMPLATE" ]; then
    echo "Deployment template file not found: $DEPLOYMENT_TEMPLATE"
    exit 1
fi

# Function to create Bitwarden deployment item
create_deployment_item() {
    local env=$1
    local template_file=$2
    local item_name="deployment-${env}"
    
    echo "Creating Bitwarden item: $item_name"
    
    # Check if item already exists
    if bw get item "$item_name" &>/dev/null; then
        echo "Item '$item_name' already exists. Skipping creation."
        return
    fi
    
    # Create JSON template for the item
    cat > /tmp/bw_item.json << EOL
{
  "name": "$item_name",
  "notes": "Deployment configuration for $env environment. Created automatically.",
  "fields": [
    {
      "name": "SSH_USER",
      "value": "ubuntu",
      "type": 1
    },
    {
      "name": "SSH_HOST",
      "value": "ec2-your-instance-id.compute-1.amazonaws.com",
      "type": 1
    },
    {
      "name": "SSH_PORT",
      "value": "22",
      "type": 1
    },
    {
      "name": "REMOTE_DIR",
      "value": "/home/ubuntu/ultimate-marketing-team",
      "type": 1
    },
    {
      "name": "SSH_KEY",
      "value": "path/to/your/key.pem",
      "type": 1
    },
    {
      "name": "COMPOSE_FILE",
      "value": "docker-compose.${env}.yml",
      "type": 1
    }
  ],
  "secureNote": {
    "type": 0
  },
  "type": 2
}
EOL
    
    # Create the item in Bitwarden
    bw create item /tmp/bw_item.json
    rm /tmp/bw_item.json
    
    echo "Item '$item_name' created successfully!"
    echo "Please edit the item in Bitwarden to set the correct values."
}

# Function to create Bitwarden environment item
create_env_item() {
    local env=$1
    local template_file=$2
    local item_name="env-${env}"
    
    echo "Creating Bitwarden item: $item_name"
    
    # Check if item already exists
    if bw get item "$item_name" &>/dev/null; then
        echo "Item '$item_name' already exists. Skipping creation."
        return
    fi
    
    # Get template content
    TEMPLATE_CONTENT=""
    if [ -f "$template_file" ]; then
        TEMPLATE_CONTENT=$(cat "$template_file")
    else
        TEMPLATE_CONTENT="# Environment configuration for $env\n# Replace this with your actual configuration"
    fi
    
    # Create JSON template for the item
    cat > /tmp/bw_env_item.json << EOL
{
  "name": "$item_name",
  "notes": "$TEMPLATE_CONTENT",
  "secureNote": {
    "type": 0
  },
  "type": 2
}
EOL
    
    # Create the item in Bitwarden
    bw create item /tmp/bw_env_item.json
    rm /tmp/bw_env_item.json
    
    echo "Item '$item_name' created successfully!"
    echo "Please edit the notes field in Bitwarden with your actual environment variables."
}

# Create the deployment item
create_deployment_item $ENV $DEPLOYMENT_TEMPLATE

# Create the environment item if template exists
if [ -f "$ENV_TEMPLATE" ]; then
    create_env_item $ENV $ENV_TEMPLATE
else
    echo "Environment template file not found: $ENV_TEMPLATE"
    echo "Skipping environment item creation."
fi

echo ""
echo "Next Steps:"
echo "1. Go to Bitwarden and edit the created items to set the correct values"
echo "2. Run fetch_secrets.sh to retrieve the secrets:"
echo "   ./scripts/utilities/fetch_secrets.sh $ENV"

# Lock the Bitwarden vault
bw lock

echo "Done!"