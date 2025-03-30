# EC2 Deployment Guide

This guide explains how to deploy the Ultimate Marketing Team application to an EC2 instance.

## Prerequisites

- AWS EC2 instance running Amazon Linux or Ubuntu
- SSH access to the EC2 instance
- SSH key file (.pem file)
- Docker and Docker Compose installed on the EC2 instance (scripts will attempt to install them if missing)

## Quick Start

### First-Time Deployment

To deploy to an EC2 instance:

```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/deploy.sh
```

This script will:

1. Build the frontend application
2. Create a deployment archive with all necessary files
3. Upload the archive to the EC2 instance
4. Extract files on the server
5. Start or restart all Docker containers
6. Set up SSL certificates (if needed)

### Customizing Deployment

You can customize the deployment with environment variables:

```bash
SSH_USER=ubuntu SSH_HOST=ec2-instance.amazonaws.com SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/deploy.sh
```

Available variables:

- `SSH_USER`: SSH username (default: ubuntu)
- `SSH_HOST`: EC2 hostname or IP (default: ec2-44-202-29-233.compute-1.amazonaws.com)
- `SSH_PORT`: SSH port (default: 22)
- `REMOTE_DIR`: Remote directory (default: /home/ubuntu/ultimate-marketing-team)
- `SSH_KEY`: Path to SSH key file (required)

## Checking Services

To check the status of deployed services:

```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/check_services.sh
```

This will display:
- Running containers
- Container logs
- Service status

## Fixing Services

If services are not starting properly:

```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/fix_services.sh
```

This script will:
- Ensure Docker is running
- Clean up Docker environment
- Rebuild and restart all services

## SSL Setup

SSL certificates are automatically set up during deployment. If you need to manually set up SSL:

```bash
SSH_KEY=path/to/key.pem ssh -i path/to/key.pem ubuntu@ec2-instance.amazonaws.com
cd /home/ubuntu/ultimate-marketing-team
./scripts/deployment/shared/ssl_setup.sh
```

## Troubleshooting

1. Check SSH connectivity:
```bash
ssh -i path/to/key.pem ubuntu@ec2-instance.amazonaws.com
```

2. Ensure the SSH key has the correct permissions:
```bash
chmod 400 path/to/key.pem
```

3. Check service logs:
```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/check_services.sh
```

4. Verify Docker is running on the EC2 instance:
```bash
ssh -i path/to/key.pem ubuntu@ec2-instance.amazonaws.com "sudo systemctl status docker"
```

5. If all else fails, try fixing services:
```bash
SSH_KEY=path/to/key.pem ./scripts/deployment/ec2/fix_services.sh
```