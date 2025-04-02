#!/bin/bash
# Quick script to restart Nginx on staging server

set -e

# Load deployment configuration (just need SSH_KEY, SSH_USER, SSH_HOST)
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  source "$DEPLOY_CONFIG"
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  exit 1
fi

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi
chmod 600 "$SSH_KEY"

echo "🔄 Restarting Nginx on staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Run restart
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
echo '🔹 Testing Nginx configuration:'
sudo nginx -t

echo '🔹 Checking current Nginx status:'
sudo systemctl status nginx | grep 'Active:'

echo '🔹 Restarting Nginx:'
sudo systemctl restart nginx

echo '🔹 Checking Nginx status after restart:'
sudo systemctl status nginx | grep 'Active:'

echo '🔹 Verifying ports:'
sudo netstat -tlnp | grep ':80'
sudo netstat -tlnp | grep ':443'

echo '🔹 Testing connection:'
curl -I -L --insecure https://staging.tangible-studios.com | head -n 10

echo '✅ Nginx restart completed'
"

echo "✅ Nginx restart completed!"