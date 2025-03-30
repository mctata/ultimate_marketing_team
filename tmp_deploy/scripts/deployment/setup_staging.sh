#!/bin/bash
# Comprehensive script to set up the staging environment

set -e

echo "Setting up staging environment for Ultimate Marketing Team"

# Configuration
SSH_USER=${SSH_USER:-"ubuntu"}
SSH_HOST=${SSH_HOST:-"ec2-44-202-29-233.compute-1.amazonaws.com"}
REMOTE_DIR=${REMOTE_DIR:-"/home/ubuntu/ultimate-marketing-team"}
SSH_KEY=${SSH_KEY:-"ultimate-marketing-staging.pem"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "Error: SSH key file '$SSH_KEY' not found."
    echo "Please provide the path to your SSH key file using SSH_KEY=path/to/key"
    exit 1
fi

# Step 1: First run the SSL setup
echo "Step 1: Setting up SSL..."
$SCRIPT_DIR/simple_ssl_setup.sh

# Step 2: Fix the services
echo "Step 2: Fixing API Gateway and Migrations services..."
$SCRIPT_DIR/fix_staging_services.sh

# Step 3: Check the services
echo "Step 3: Checking services..."
$SCRIPT_DIR/check_services.sh

echo "Staging environment setup complete!"
echo "Access the application at https://staging.tangible-studios.com/"
echo ""
echo "To run individual scripts:"
echo "  - SSL Setup: $SCRIPT_DIR/simple_ssl_setup.sh"
echo "  - Fix Services: $SCRIPT_DIR/fix_staging_services.sh"
echo "  - Check Services: $SCRIPT_DIR/check_services.sh"
echo ""
echo "If services are not working correctly, try running fix_staging_services.sh again."