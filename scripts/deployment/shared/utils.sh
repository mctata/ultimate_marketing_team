#!/bin/bash
# Shared utility functions for deployment scripts

# Create deployment archive
create_deployment_archive() {
    local temp_dir=$(mktemp -d)
    local archive_name="deploy_$(date +%Y%m%d_%H%M%S).tar.gz"
    local exclude_patterns="${1:-}"
    local archive_dir="${2:-archives}"
    
    echo "Creating deployment archive..."
    
    # Copy essential files to the temp directory
    rsync -av --exclude='node_modules' --exclude='venv' --exclude='.git' \
        --exclude='__pycache__' --exclude='*.pyc' --exclude='.env.local' \
        --exclude='logs' --exclude='tmp_deploy' $exclude_patterns \
        . "$temp_dir/"
    
    # Create deployment package
    tar -czf "$archive_name" -C "$temp_dir" .
    
    # Save a copy to archives directory
    mkdir -p "scripts/deployment/$archive_dir"
    mv "$archive_name" "scripts/deployment/$archive_dir/"
    
    # Clean up
    rm -rf "$temp_dir"
    
    echo "Created archive: scripts/deployment/$archive_dir/$archive_name"
    echo $archive_name
}

# Deploy archive to remote server
deploy_archive() {
    local archive_name=$1
    local archive_path="scripts/deployment/archives/$archive_name"
    local ssh_user=$2
    local ssh_host=$3
    local remote_dir=$4
    local ssh_key=$5
    local ssh_port=${6:-22}
    local docker_compose_file=${7:-docker-compose.staging.yml}
    
    # Upload the archive to the server
    echo "Uploading deployment archive to server..."
    scp -P $ssh_port -i "$ssh_key" "$archive_path" "$ssh_user@$ssh_host:/tmp/"
    
    # Execute remote deployment
    ssh -p $ssh_port -i "$ssh_key" "$ssh_user@$ssh_host" << EOF
    set -e
    echo "Connected to the server..."
    
    # Create directory if it doesn't exist
    mkdir -p $remote_dir
    
    # Extract files
    echo "Extracting deployment archive..."
    tar -xzf /tmp/$archive_name -C $remote_dir
    
    # Navigate to the project directory
    cd $remote_dir
    
    # Make scripts executable
    echo "Making scripts executable..."
    find scripts -type f \( -name "*.sh" -o -name "*.py" \) -exec chmod +x {} \;
    
    # Check for Docker and Docker Compose
    echo "Checking if Docker is installed..."
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker before deploying."
        exit 1
    fi
    
    echo "Checking if Docker Compose is installed..."
    if ! command -v docker-compose &> /dev/null; then
        echo "Docker Compose is not installed. Please install Docker Compose before deploying."
        exit 1
    fi
    
    # Start Docker containers
    echo "Starting Docker containers..."
    docker-compose -f $docker_compose_file down
    docker-compose -f $docker_compose_file up -d
    
    # Clean up
    echo "Cleaning up..."
    rm /tmp/$archive_name
    
    echo "Deployment completed successfully!"
EOF
}

# Check service status
check_services() {
    local ssh_user=$1
    local ssh_host=$2
    local remote_dir=$3
    local ssh_key=$4
    local ssh_port=${5:-22}
    local docker_compose_file=${6:-docker-compose.staging.yml}
    
    echo "Checking services on $ssh_host..."
    ssh -p $ssh_port -i "$ssh_key" "$ssh_user@$ssh_host" << EOF
    set -e
    echo "Connected to the server..."
    
    # Navigate to the project directory
    cd $remote_dir
    
    echo "=== Running Containers ==="
    docker-compose -f $docker_compose_file ps
    
    echo ""
    echo "=== Container Logs ==="
    for service in \$(docker-compose -f $docker_compose_file config --services); do
        echo "--- \$service logs ---"
        docker-compose -f $docker_compose_file logs --tail=10 \$service
        echo ""
    done
EOF
}