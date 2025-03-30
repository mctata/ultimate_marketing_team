#!/bin/bash
# Script to verify the deployment setup locally
# This script will check that all deployment scripts are executable and in the correct locations

set -e

echo "Verifying deployment scripts and directory structure..."

# Check scripts directory structure
echo "Checking scripts directory structure..."
MISSING_FILES=0

# Required scripts
REQUIRED_SCRIPTS=(
  "scripts/deployment/test_connection.sh"
  "scripts/deployment/test_local_db.sh"
  "scripts/deployment/quick_deploy.sh"
  "scripts/deployment/staging/deploy.sh"
  "scripts/deployment/staging/quick_deploy.sh"
  "scripts/deployment/staging/check_services.sh"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
  if [ ! -f "$script" ]; then
    echo "❌ Missing script: $script"
    MISSING_FILES=$((MISSING_FILES+1))
  elif [ ! -x "$script" ]; then
    echo "❌ Script not executable: $script"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ Script found and executable: $script"
  fi
done

# Check deployment directories
echo "Checking deployment directories..."
REQUIRED_DIRS=(
  "deployments/archives/staging"
  "deployments/archives/production"
  "deployments/secrets"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo "❌ Missing directory: $dir"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ Directory found: $dir"
  fi
done

# Check README files
echo "Checking README files..."
REQUIRED_READMES=(
  "deployments/README.md"
  "deployments/archives/README.md"
  "deployments/archives/staging/README.md"
  "deployments/archives/production/README.md"
  "deployments/secrets/README.md"
)

for readme in "${REQUIRED_READMES[@]}"; do
  if [ ! -f "$readme" ]; then
    echo "❌ Missing README: $readme"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ README found: $readme"
  fi
done

# Check PostgreSQL configuration
echo "Checking PostgreSQL configuration..."
REQUIRED_PG_FILES=(
  "docker/postgres/init.sql"
  "docker/postgres/integration_upgrade.sql"
  "docker/postgres/install_pgvector.sql"
)

for pg_file in "${REQUIRED_PG_FILES[@]}"; do
  if [ ! -f "$pg_file" ]; then
    echo "❌ Missing PostgreSQL file: $pg_file"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ PostgreSQL file found: $pg_file"
  fi
done

# Check documentation
echo "Checking documentation..."
REQUIRED_DOCS=(
  "docs/deployment/DEPLOYMENT_GUIDE.md"
  "docs/deployment/POSTGRES_CONFIG.md"
  "docs/deployment/SSL_WORKFLOW.md")

for doc in "${REQUIRED_DOCS[@]}"; do
  if [ ! -f "$doc" ]; then
    echo "❌ Missing documentation: $doc"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ Documentation found: $doc"
  fi
done

# Check Docker Compose files
echo "Checking Docker Compose files..."
REQUIRED_COMPOSE_FILES=(
  "docker-compose.dev.yml"
  "docker-compose.test.yml"
  "docker-compose.staging.yml"
  "docker-compose.production.yml"
)

for compose_file in "${REQUIRED_COMPOSE_FILES[@]}"; do
  if [ ! -f "$compose_file" ]; then
    echo "❌ Missing Docker Compose file: $compose_file"
    MISSING_FILES=$((MISSING_FILES+1))
  else
    echo "✅ Docker Compose file found: $compose_file"
    
    # Check if the Docker Compose file uses the postgres:17-alpine image
    if ! grep -q "postgres:17-alpine" "$compose_file"; then
      echo "⚠️ Warning: $compose_file might not be using the postgres:17-alpine image"
    fi
  fi
done

# Final report
echo ""
echo "Verification completed!"
if [ $MISSING_FILES -eq 0 ]; then
  echo "✅ All required files and directories are present and correctly set up."
else
  echo "❌ Found $MISSING_FILES missing or incorrect files/directories."
  echo "Please fix the issues mentioned above to ensure proper deployment functionality."
fi

exit $MISSING_FILES