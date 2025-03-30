#!/bin/bash
# Verify frontend files exist and are properly built
set -e

echo "Verifying frontend build..."

# Check if frontend/dist directory exists
if [ ! -d "frontend/dist" ]; then
    echo "❌ Error: frontend/dist directory does not exist."
    echo "Run 'cd frontend && npm run build' to generate it."
    exit 1
fi

# Check for essential files in the dist directory
if [ ! -f "frontend/dist/index.html" ]; then
    echo "❌ Error: index.html is missing from frontend/dist."
    exit 1
fi

# Check if assets directory exists
if [ ! -d "frontend/dist/assets" ]; then
    echo "❌ Error: assets directory is missing from frontend/dist."
    exit 1
fi

# Count JS files to ensure at least some were built
JS_FILES=$(find frontend/dist/assets -name "*.js" | wc -l)
if [ "$JS_FILES" -lt 1 ]; then
    echo "❌ Error: No JavaScript files found in frontend/dist/assets."
    exit 1
fi

echo "✅ Frontend build verified successfully!"