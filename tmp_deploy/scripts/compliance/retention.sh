#!/bin/bash
# Script to execute data retention policies

# Function to display help
function show_help {
    echo "Data Retention Script"
    echo "---------------------"
    echo "This script executes data retention policies to archive or delete data"
    echo "based on configured retention periods."
    echo ""
    echo "Usage:"
    echo "  ./retention.sh [options]"
    echo ""
    echo "Options:"
    echo "  -t, --type ENTITY_TYPE   Process specific entity type (e.g., user, content)"
    echo "  -h, --help               Display this help message"
    echo ""
    echo "Examples:"
    echo "  ./retention.sh               # Process all entity types"
    echo "  ./retention.sh -t user       # Process only user data"
    echo "  ./retention.sh --type content # Process only content data"
}

# Parse command line arguments
ENTITY_TYPE=""

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -t|--type)
            ENTITY_TYPE="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Set up environment
source "${PROJECT_ROOT}/venv/bin/activate" 2>/dev/null || echo "Virtual environment not found, using system Python"

# Output header
echo "==============================================="
echo "  Ultimate Marketing Team - Data Retention"
echo "==============================================="
echo "Started at: $(date)"
echo ""

# Run the data retention script
if [ -z "$ENTITY_TYPE" ]; then
    echo "Processing all entity types..."
    python "${SCRIPT_DIR}/run_data_retention.py"
else
    echo "Processing entity type: $ENTITY_TYPE"
    python "${SCRIPT_DIR}/run_data_retention.py" --entity-type "$ENTITY_TYPE"
fi

# Check if the script succeeded
if [ $? -eq 0 ]; then
    echo ""
    echo "Data retention completed successfully"
else
    echo ""
    echo "Error: Data retention failed with exit code $?"
    exit 1
fi

echo "Finished at: $(date)"
echo "==============================================="