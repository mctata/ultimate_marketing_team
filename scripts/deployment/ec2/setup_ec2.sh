#!/bin/bash
# Script to set up a new EC2 instance for deployment

set -e

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}

echo "Setting up EC2 instance at $SSH_USER@$SSH_HOST..."

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Set proper permissions for SSH key
chmod 400 "$SSH_KEY"

# Execute remote commands
ssh -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" << 'EOF'
    set -e
    echo "Connected to the server..."
    
    # Update packages
    echo "Updating system packages..."
    sudo apt-get update
    sudo apt-get upgrade -y
    
    # Install Docker if needed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        sudo apt-get update
        sudo apt-get install -y docker-ce
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker $USER
        echo "Docker installed successfully!"
    else
        echo "Docker is already installed."
    fi
    
    # Install Docker Compose if needed
    if ! command -v docker-compose &> /dev/null; then
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "Docker Compose installed successfully!"
    else
        echo "Docker Compose is already installed."
    fi
    
    # Install other dependencies
    echo "Installing additional dependencies..."
    sudo apt-get install -y nginx certbot python3-certbot-nginx jq

    # Create directories
    echo "Creating project directories..."
    mkdir -p $REMOTE_DIR/nginx-ssl
    
    echo "EC2 setup completed successfully!"
EOF

echo "EC2 instance setup completed successfully!"
echo "You can now deploy using: SSH_KEY=$SSH_KEY ./scripts/deployment/ec2/deploy.sh"