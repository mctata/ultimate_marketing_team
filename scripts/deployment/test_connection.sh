#!/bin/bash
# Script to test SSH connection and basic access to staging server

set -e

echo "Testing connection to staging server..."

# Configuration
SSH_USER=${SSH_USER:-"tangible-studios.com"}
SSH_HOST=${SSH_HOST:-"ssh.tangible-studios.com"}
SSH_PORT=${SSH_PORT:-"22"}
REMOTE_DIR=${REMOTE_DIR:-"/customers/8/2/5/tangible-studios.com/httpd.www/staging"}
SSH_KEY=${SSH_KEY:-"~/.ssh/id_rsa"}

# Check if SSH credentials are provided
if [[ "$SSH_USER" == "your_ssh_user" ]]; then
    echo "Error: SSH_USER not set. Run with SSH_USER=username SSH_HOST=hostname ./scripts/deployment/test_connection.sh"
    exit 1
fi

echo "Testing connection to $SSH_USER@$SSH_HOST using key $SSH_KEY..."

# Test SSH connection with debugging
echo "Attempting SSH connection..."
echo "SSH command: ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "ERROR: SSH key file '$SSH_KEY' not found!"
    echo "Please provide a valid SSH key using SSH_KEY=/path/to/key."
    exit 1
fi

# Check SSH key permissions
if [[ "$OSTYPE" == "darwin"* ]] || [[ "$OSTYPE" == "linux"* ]]; then
    KEY_PERMS=$(stat -f "%Lp" "$SSH_KEY" 2>/dev/null || stat -c "%a" "$SSH_KEY" 2>/dev/null)
    if [[ "$KEY_PERMS" != "400" ]] && [[ "$KEY_PERMS" != "600" ]]; then
        echo "WARNING: SSH key has permissions $KEY_PERMS, but should be 400 or 600."
        echo "Attempting to fix permissions..."
        chmod 400 "$SSH_KEY"
    fi
fi

# Try connecting with verbose output
if ssh -v -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST echo "Connection successful"; then
    echo "SSH connection test PASSED ✓"
else
    echo "SSH connection test FAILED ✗"
    echo "Please check your SSH credentials and network connection."
    exit 1
fi

# Test remote directory access
echo "Testing access to $REMOTE_DIR..."
if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "[ -d $REMOTE_DIR ] && echo 'Directory exists' || echo 'Directory does not exist'"; then
    echo "Remote directory test PASSED ✓"
else
    echo "Remote directory test FAILED ✗"
    exit 1
fi

# Test Docker availability
echo "Testing Docker availability..."
if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "command -v docker >/dev/null 2>&1 && echo 'Docker installed' || echo 'Docker not installed'"; then
    echo "Docker availability test PASSED ✓"
else
    echo "Docker availability test FAILED ✗"
    exit 1
fi

# Test Docker Compose availability
echo "Testing Docker Compose availability..."
if ssh -p $SSH_PORT -i $SSH_KEY $SSH_USER@$SSH_HOST "command -v docker-compose >/dev/null 2>&1 && echo 'Docker Compose installed' || echo 'Docker Compose not installed'"; then
    echo "Docker Compose availability test PASSED ✓"
else
    echo "Docker Compose availability test FAILED ✗"
    exit 1
fi

echo "All connection tests PASSED ✓"
echo "The staging server is reachable and has the necessary tools installed."
echo ""
echo "You can proceed with deployment using:"
echo "  ./scripts/deployment/deploy_staging.sh"