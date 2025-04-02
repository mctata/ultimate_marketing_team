#\!/bin/bash
# Script to check disk space on the server and optionally clean up

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  # Use set -a to export all variables
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

echo "🔍 Checking disk space on server: $SSH_HOST"

# Check disk space
DISK_SPACE=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "df -h / | grep -v Filesystem")
DISK_USAGE_PCT=$(echo "$DISK_SPACE" | awk '{print $5}' | sed 's/%//')

echo "🔹 Disk space details:"
echo "$DISK_SPACE"

if [ "$DISK_USAGE_PCT" -gt 85 ]; then
  echo "⚠️ Warning: Disk usage is high ($DISK_USAGE_PCT%). Would you like to clean up space? (y/n)"
  read -p "> " response
  
  if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up disk space..."
    
    # Run cleanup commands on the server
    ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "
      echo '🔹 Cleaning Docker resources...'
      docker system prune -af --volumes
      
      echo '🔹 Removing old log files...'
      sudo find /var/log -type f -name '*.log*' -delete
      sudo find /var/log -type f -name '*.gz' -delete
      
      echo '🔹 Clearing temporary files...'
      sudo rm -rf /tmp/* 2>/dev/null
      
      echo '🔹 Clearing old deployment files...'
      if [ -d \"$REMOTE_DIR\" ]; then
        # Back up important files
        mkdir -p ${REMOTE_DIR}_backup
        if [ -f ${REMOTE_DIR}/.env ]; then
          cp ${REMOTE_DIR}/.env ${REMOTE_DIR}_backup/
        fi
        
        # Remove old files
        rm -rf $REMOTE_DIR/*
        
        # Restore any backed up files
        if [ -f ${REMOTE_DIR}_backup/.env ]; then
          cp ${REMOTE_DIR}_backup/.env ${REMOTE_DIR}/
        fi
      fi
    "
    
    # Check disk space again
    DISK_SPACE=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "df -h / | grep -v Filesystem")
    echo "🔹 Disk space after cleanup:"
    echo "$DISK_SPACE"
  else
    echo "❌ Cleanup cancelled. The server may not have enough space for deployment."
  fi
else
  echo "✅ Disk space is sufficient for deployment."
fi

echo "✅ Server space check complete\!"
