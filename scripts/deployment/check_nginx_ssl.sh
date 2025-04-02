#!/bin/bash
# Quick script to check Nginx SSL configuration on staging server

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

echo "🔍 Checking Nginx and SSL configuration on staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Run checks
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
echo '🔹 Checking Nginx status:'
sudo systemctl status nginx | grep 'Active:'

echo '🔹 Checking SSL certificate files:'
sudo ls -la /etc/letsencrypt/live/staging.tangible-studios.com/ || echo 'Certificate directory not found'

echo '🔹 Checking certificate details:'
sudo certbot certificates | grep -A7 'staging.tangible-studios.com'

echo '🔹 Checking Nginx configuration:'
sudo nginx -t

echo '🔹 Checking service listening on ports 80/443:'
sudo netstat -tlnp | grep ':80'
sudo netstat -tlnp | grep ':443'

echo '🔹 Checking if site is reachable:'
curl -I -L --insecure https://staging.tangible-studios.com

echo '🔹 Checking actual frontend is running:'
docker ps | grep frontend

echo '✅ Check completed'
"

echo "✅ Nginx/SSL check completed!"