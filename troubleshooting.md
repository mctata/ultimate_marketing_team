# Troubleshooting Guide for Ultimate Marketing Team Deployment

This document provides solutions for common issues encountered during the deployment process.

## SSH Connection Issues

If you encounter SSH connection problems:

1. **Check if the instance is running**:
   - Verify the EC2 instance status in AWS Console
   - Ensure the instance hasn't been terminated or stopped

2. **Security Group Configuration**:
   - Make sure your security group allows SSH (port 22) from your IP address
   - Add a rule: Type SSH, Port 22, Source: YOUR_IP/32 (e.g., 171.4.232.32/32)
   - The "/32" CIDR notation is important - it specifies that only your IP is allowed

3. **SSH Key Issues**:
   - Ensure the key file has proper permissions: `chmod 600 ultimate-marketing-staging.pem`
   - Verify you're using the correct key for the instance
   - Make sure the key file is in PEM format

4. **IP Address Changes**:
   - If the instance was restarted, it might have a new IP address
   - Update `config/env/deployment.env.staging` with the new address

## API Gateway Issues

If the API Gateway container is unhealthy or fails to start:

1. **Using the Fix Script**:
   ```bash
   chmod +x scripts/deployment/fix_api_gateway.sh
   ./scripts/deployment/fix_api_gateway.sh
   ```

2. **Manual Fix Steps**:
   - Check Docker logs: `docker logs umt-api-gateway`
   - Rebuild the container: `docker-compose build api-gateway`
   - Force start: `docker-compose up -d --no-deps api-gateway`

3. **Common API Gateway Issues**:
   - Missing dependencies in requirements.txt
   - File path issues with staging_main.py
   - Database connection problems

## Database Issues

If you encounter database-related problems:

1. **PostgreSQL Not Starting**:
   - Check logs: `docker-compose logs postgres`
   - Ensure the container has enough resources
   - Verify the data directory permissions

2. **Migration Issues**:
   - Run the pgvector fix script: `./scripts/database/fix_pgvector.sh`
   - Manually create the required schema: 
     ```bash
     docker-compose exec postgres psql -U postgres -c 'CREATE DATABASE umt;'
     docker-compose exec postgres psql -U postgres -d umt -c 'CREATE SCHEMA IF NOT EXISTS umt;'
     ```

## DNS Configuration

To set up DNS for your staging environment:

1. Add an A record in your DNS provider:
   - Host/Name: `staging` 
   - Value/Points to: Your EC2 instance public IP (e.g., `184.72.208.29`)
   - TTL: 3600 (or provider's recommendation)

2. You might also want to set up:
   - `api.staging.tangible-studios.com` → EC2 IP address
   - `www.staging.tangible-studios.com` → EC2 IP address

Remember that DNS changes can take anywhere from a few minutes to 48 hours to propagate worldwide.

## Security Group Configuration

Required open ports for your instance:

- Port 22 (SSH): Your IP only (e.g., 171.4.232.32/32)
- Port 80 (HTTP): 0.0.0.0/0 (all traffic)
- Port 443 (HTTPS): 0.0.0.0/0 (all traffic)
- Port 3000 (Frontend): 0.0.0.0/0 (all traffic)
- Port 8000 (API Gateway): 0.0.0.0/0 (all traffic)
- Port 5432 (PostgreSQL): 0.0.0.0/0 (consider restricting to specific IPs in production)
