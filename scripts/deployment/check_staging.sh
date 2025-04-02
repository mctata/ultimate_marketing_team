#!/bin/bash
# Comprehensive script to check staging environment health and status

set -e

# Load deployment configuration
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  set -a
  source "$DEPLOY_CONFIG"
  set +a
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  exit 1
fi

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  # Look for the SSH key in common locations
  for possible_key in ~/.ssh/id_rsa ~/.ssh/id_ed25519 ~/.ssh/ultimate-marketing-staging.pem; do
    if [ -f "$possible_key" ]; then
      echo "🔑 Found SSH key at $possible_key, using it instead."
      SSH_KEY="$possible_key"
      break
    fi
  done
  
  # If still not found, exit
  if [ ! -f "$SSH_KEY" ]; then
    echo "❌ Cannot find a suitable SSH key."
    exit 1
  fi
fi

chmod 600 "$SSH_KEY"

echo "🔍 Running comprehensive staging environment check"
echo "🔹 Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
echo "🔹 Remote directory: $REMOTE_DIR"

# Parse command-line arguments
CHECK_DISK=true
CHECK_DOCKER=true
CHECK_SERVICES=true
CLEAN_DISK=false

for arg in "$@"; do
  case $arg in
    --disk-only)
      CHECK_DISK=true
      CHECK_DOCKER=false
      CHECK_SERVICES=false
      ;;
    --docker-only)
      CHECK_DISK=false
      CHECK_DOCKER=true
      CHECK_SERVICES=false
      ;;
    --services-only)
      CHECK_DISK=false
      CHECK_DOCKER=false
      CHECK_SERVICES=true
      ;;
    --clean-disk)
      CLEAN_DISK=true
      ;;
  esac
done

# Check disk space
if [ "$CHECK_DISK" = true ]; then
  echo ""
  echo "📊 CHECKING DISK SPACE"
  echo "====================="
  
  DISK_SPACE=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "df -h / | grep -v Filesystem")
  DISK_USAGE_PCT=$(echo "$DISK_SPACE" | awk '{print $5}' | sed 's/%//')
  
  echo "🔹 Disk space details:"
  echo "$DISK_SPACE"
  
  if [ "$DISK_USAGE_PCT" -gt 85 ]; then
    echo "⚠️ Warning: Disk usage is high ($DISK_USAGE_PCT%)."
    
    if [ "$CLEAN_DISK" = true ]; then
      echo "🧹 Cleaning up disk space as requested..."
      
      # Run cleanup commands on the server
      ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "
        echo '🔹 Cleaning Docker resources...'
        docker system prune -af --volumes
        
        echo '🔹 Removing old log files...'
        sudo find /var/log -type f -name '*.log*' -mtime +7 -delete
        sudo find /var/log -type f -name '*.gz' -mtime +7 -delete
        
        echo '🔹 Clearing temporary files...'
        sudo rm -rf /tmp/* 2>/dev/null
      "
      
      # Check disk space again
      DISK_SPACE=$(ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "df -h / | grep -v Filesystem")
      echo "🔹 Disk space after cleanup:"
      echo "$DISK_SPACE"
    else
      echo "ℹ️  Use --clean-disk flag to automatically clean up space"
    fi
  else
    echo "✅ Disk space is sufficient for deployment."
  fi
fi

# Check Docker containers
if [ "$CHECK_DOCKER" = true ]; then
  echo ""
  echo "🐳 CHECKING DOCKER CONTAINERS"
  echo "==========================="
  
  # Run checks
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "
    echo '🔹 Checking running Docker containers:'
    docker ps
    
    echo '🔹 Checking Docker networks:'
    docker network ls
    
    echo '🔹 Checking container resource usage:'
    docker stats --no-stream
    
    echo '🔹 Checking Docker volumes:'
    docker volume ls
    
    echo '🔹 Checking Docker images:'
    docker images | head -n 10
  "
fi

# Check services health
if [ "$CHECK_SERVICES" = true ]; then
  echo ""
  echo "🔬 CHECKING SERVICES HEALTH"
  echo "========================="
  
  ssh -i "$SSH_KEY" -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "
    echo '🔹 Checking container status...'
    cd $REMOTE_DIR 2>/dev/null
    
    # Check API endpoints
    echo '🔹 Checking API Gateway health...'
    curl -s http://localhost:8000/health || echo '❌ API Gateway not responding'
    
    echo '🔹 Checking frontend...'
    curl -s -I http://localhost:3000 | head -n 1 || echo '❌ Frontend not responding'
    
    # Check PostgreSQL
    echo '🔹 Checking PostgreSQL connection...'
    docker exec umt-postgres pg_isready -U postgres || echo '❌ PostgreSQL not responding'
    
    # Check Redis
    echo '🔹 Checking Redis connection...'
    docker exec umt-redis redis-cli ping || echo '❌ Redis not responding'
    
    # Check RabbitMQ
    echo '🔹 Checking RabbitMQ connection...'
    docker exec umt-rabbitmq rabbitmqctl ping || echo '❌ RabbitMQ not responding'
    
    # Check logs briefly
    echo '🔹 Recent API Gateway logs:'
    docker logs --tail 10 umt-api-gateway 2>/dev/null || echo '❌ No API Gateway logs available'
    
    echo '🔹 Recent frontend logs:'
    docker logs --tail 10 umt-frontend 2>/dev/null || echo '❌ No frontend logs available'
  "
fi

echo ""
echo "✅ Staging environment check completed!"
echo ""
echo "📋 Usage options:"
echo "  ./check_staging.sh               # Run all checks"
echo "  ./check_staging.sh --disk-only   # Check disk space only"
echo "  ./check_staging.sh --docker-only # Check Docker containers only"
echo "  ./check_staging.sh --services-only # Check services health only"
echo "  ./check_staging.sh --clean-disk  # Check and clean disk space"