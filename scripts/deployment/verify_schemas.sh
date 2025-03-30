#!/bin/bash
# Verify schemas directory exists and has necessary files
set -e

echo "Verifying schemas directory..."

# Check if src/schemas directory exists
if [ ! -d "src/schemas" ]; then
    echo "❌ Error: src/schemas directory does not exist."
    echo "Creating schemas directory..."
    mkdir -p src/schemas
fi

# Check for template.py file
if [ ! -f "src/schemas/template.py" ]; then
    echo "❌ Error: template.py is missing from src/schemas."
    echo "Please check that src/schemas/template.py is properly created."
    exit 1
fi

echo "✅ Schemas directory verified successfully!"