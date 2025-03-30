# EC2 Deployment Guide

This guide explains how to deploy the Ultimate Marketing Team application to an Amazon EC2 instance.

## Prerequisites

1. Access to the EC2 instance
2. The PEM key file for SSH access
3. Docker and Docker Compose installed locally
4. SSL certificates (either self-signed or from Let's Encrypt)

## DNS Configuration

The EC2 instance has been configured with the following:
- IP address: 44.202.29.233
- DNS: staging.tangible-studios.com
- SSH access: `ssh -i "ultimate-marketing-staging.pem" ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com`

## Deployment Process

### One-Command Deployment

The EC2 deployment script handles all deployment steps in a single command:

```bash
# Make sure your PEM key file is in the current directory or provide the full path
./scripts/deployment/ec2/deploy.sh
```

This script will:
1. Build the frontend application (if available)
2. Create a deployment archive with all necessary files
3. Upload the archive to the EC2 instance
4. Install Docker and Docker Compose if not already installed
5. Extract the files on the EC2 instance
6. Start the Docker containers using the EC2-specific docker-compose configuration
7. Save a copy of the deployment archive to `deployment_archives/`

### Customizing the Deployment

You can customize the deployment by setting these environment variables:

```bash
EC2_USER="ubuntu" EC2_HOST="ec2-44-202-29-233.compute-1.amazonaws.com" SSH_KEY="path/to/ultimate-marketing-staging.pem" ./scripts/deployment/ec2/deploy.sh
```

Available variables:
- `EC2_USER`: EC2 username (default: "ubuntu")
- `EC2_HOST`: EC2 hostname (default: "ec2-44-202-29-233.compute-1.amazonaws.com")
- `EC2_PORT`: SSH port (default: "22")
- `REMOTE_DIR`: Remote directory path (default: "/home/ubuntu/ultimate_marketing_team")
- `SSH_KEY`: SSH key path (default: "ultimate-marketing-staging.pem" in the current directory)

## Verifying Deployment

After deployment, verify that:
1. All Docker containers are running: `docker-compose ps`
2. The application is accessible at staging.tangible-studios.com
3. All services are functioning correctly

## Troubleshooting

If you encounter issues:

1. **SSH Connection Problems**: 
   - Verify the PEM key file is correct and has proper permissions (chmod 400)
   - Check if the EC2 instance is running and accessible

2. **Docker Issues**: 
   - Check if Docker and Docker Compose are installed and running
   - If they weren't automatically installed, try installing them manually:
     ```bash
     sudo apt-get update
     sudo apt-get install docker.io docker-compose
     ```

3. **Container Startup Failures**: 
   - Check Docker logs: `docker-compose -f docker-compose.staging.yml logs`
   - Verify network and port settings

4. **Environment Configuration**: 
   - Ensure environment variables are correctly set
   - Check that the application can access databases and external services

## SSL Certificate Setup

Before deploying, you should set up SSL certificates for secure HTTPS connections:

### Option 1: Self-Signed Certificates (Development Only)

```bash
# Generate self-signed certificates
./scripts/deployment/simple_ssl_setup.sh staging.tangible-studios.com
```

### Option 2: Let's Encrypt Certificates (Recommended)

After deploying the application, SSH into the EC2 instance and run:

```bash
# Stop the running containers
sudo docker-compose -f docker-compose.ec2.yml down

# Install certbot
sudo apt-get update
sudo apt-get install -y certbot

# Get certificates
sudo certbot certonly --standalone -d staging.tangible-studios.com

# Copy certificates to the correct location
sudo mkdir -p ~/ultimate_marketing_team/docker/nginx/ssl
sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/fullchain.pem ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.crt
sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/privkey.pem ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.key
sudo chown -R ubuntu:ubuntu ~/ultimate_marketing_team/docker/nginx/ssl

# Restart containers
cd ~/ultimate_marketing_team
sudo docker-compose -f docker-compose.ec2.yml up -d
```

For more detailed instructions, see [SSL Workflow](./SSL_WORKFLOW.md).

## Security Considerations

- The PEM key file should be kept secure and not committed to the repository
- Consider updating security groups to limit access to the EC2 instance
- Regularly update the EC2 instance with security patches
- Use strong passwords for all services
- Set up regular backups of your data