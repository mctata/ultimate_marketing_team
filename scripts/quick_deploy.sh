#!/bin/bash
# Quick deployment script - all in one
set -e

ENV=${1:-"staging"}
CURRENT_DIR=$(pwd)

echo "===== QUICK DEPLOYMENT TO ${ENV} ====="

# 1. Setup configuration
echo "Setting up configuration..."
./scripts/utilities/manual_setup.sh $ENV

# 2. Test SSH connection
echo "Testing SSH connection..."
./scripts/deployment/test_connection.sh $ENV || true

# 3. Run deployment
echo "Starting deployment..."
./scripts/deployment/deploy.sh $ENV

# 4. Note about pgvector
echo ""
echo "===== IMPORTANT NOTE ====="
echo "If you encounter issues with pgvector extension, run:"
echo "./scripts/fix_pgvector.sh $ENV"
echo "This will compile and install the extension in PostgreSQL containers."
echo ""

echo "===== DEPLOYMENT COMPLETED ====="
echo "You can now access the $ENV environment."
if [ "$ENV" = "staging" ]; then
    echo "Staging URL: https://staging.tangible-studios.com"
fi