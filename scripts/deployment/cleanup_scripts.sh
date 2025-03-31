#!/bin/bash
# Script to clean up and organize deployment scripts folder
# Run this after testing the new unified deploy_staging.sh

set -e

echo "========== CLEANING UP DEPLOYMENT SCRIPTS =========="
echo "This script will move deprecated scripts to an archive folder."

# Get current directory
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$SCRIPT_DIR"

# Create archive directory if it doesn't exist
ARCHIVE_DIR="$SCRIPT_DIR/archive"
mkdir -p "$ARCHIVE_DIR"

# List of scripts to deprecate (will be moved to archive)
DEPRECATED_SCRIPTS=(
  "check_services.sh"
  "check_staging_services.sh"
  "quick_deploy.sh"
  "verify_deployment_setup.sh"
  "deploy.sh"
  "verify_frontend.sh"
  "verify_schemas.sh"
  "verify_migrations.sh"
  "staging/check_services.sh" 
  "staging/quick_deploy.sh"
  "staging/deploy.sh"
  "staging/compact_deploy.sh"
  "staging/deploy_staging.sh"
)

# Create README in archive directory
cat > "$ARCHIVE_DIR/README.md" << EOL
# Archived Deployment Scripts

These scripts are deprecated and have been replaced by the unified \`deploy_staging.sh\` script.
They are kept here for reference only and should not be used for deployment.

## Replacement

Instead of these scripts, use:

\`\`\`bash
# Deploy to staging
./scripts/deployment/deploy_staging.sh

# Test deployment without actually deploying
./scripts/deployment/deploy_staging.sh --dry-run
\`\`\`

## Archive Date

These scripts were archived on $(date '+%Y-%m-%d').
EOL

# Move scripts to archive directory
for script in "${DEPRECATED_SCRIPTS[@]}"; do
  if [ -f "$script" ]; then
    mkdir -p "$ARCHIVE_DIR/$(dirname "$script")"
    echo "Moving $script to archive..."
    mv "$script" "$ARCHIVE_DIR/$script"
  fi
done

echo "✅ Clean-up completed! Deprecated scripts have been moved to $ARCHIVE_DIR"
echo "Please commit these changes after testing deploy_staging.sh"