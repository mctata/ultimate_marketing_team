#\!/bin/bash
# Script to clean up Docker resources on the staging server

set -e

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  set -a
  source "$DEPLOY_CONFIG"
  set +a
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found\!"
  exit 1
fi

# Check SSH key
if [ \! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi

echo "🧹 Cleaning up Docker resources on staging server"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"

# Stop all containers
echo "🔹 Stopping all containers..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker stop \$(docker ps -aq) 2>/dev/null || true"

# Remove all containers
echo "🔹 Removing all containers..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker rm \$(docker ps -aq) 2>/dev/null || true"

# Remove all unused images
echo "🔹 Removing unused Docker images..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker image prune -af"

# Remove all unused volumes
echo "🔹 Removing unused Docker volumes..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker volume prune -f"

# Remove all unused networks
echo "🔹 Removing unused Docker networks..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker network prune -f"

# Remove build cache
echo "🔹 Removing Docker build cache..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "docker builder prune -af"

# Check disk space after cleanup
echo "🔹 Checking disk space after cleanup..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "df -h /"

echo "✅ Docker cleanup completed\!"
