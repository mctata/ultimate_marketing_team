#!/bin/bash
# One-command deployment to staging with automatic fixes
set -e

echo "======== DEPLOYING TO STAGING ========"
echo "Starting deployment process..."

# 1. Setup configuration
echo "Setting up configuration..."
./scripts/utilities/manual_setup.sh staging

# 2. Run deployment
echo "Deploying to staging server..."
./scripts/deployment/deploy.sh staging

# 3. Fix any issues automatically
echo "Fixing pgvector extension..."
ssh -i ultimate-marketing-staging.pem ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com << 'EOF'
  cd /home/ubuntu/ultimate-marketing-team
  
  # Source environment variables
  set -a
  source .env
  set +a
  
  echo "Fixing main postgres container..."
  docker exec -i $(docker ps -q -f name=postgres) bash -c "apk add --no-cache git build-base postgresql-dev && \
  git clone https://github.com/pgvector/pgvector.git && \
  cd pgvector && \
  make && \
  make install && \
  psql -U \$POSTGRES_USER -d \$POSTGRES_DB -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
  
  echo "Fixing vector-db container..."
  docker exec -i $(docker ps -q -f name=vector-db) bash -c "apk add --no-cache git build-base postgresql-dev && \
  git clone https://github.com/pgvector/pgvector.git && \
  cd pgvector && \
  make && \
  make install && \
  psql -U \$VECTOR_DB_USER -d \$VECTOR_DB_NAME -c 'CREATE EXTENSION IF NOT EXISTS vector;'"
  
  # Restart to apply changes
  echo "Restarting services..."
  docker-compose -f docker-compose.staging.yml restart
EOF

echo "✅ Deployment to staging completed!"
echo "✅ All issues fixed automatically!"
echo ""
echo "You can now access your staging environment at:"
echo "https://staging.tangible-studios.com"