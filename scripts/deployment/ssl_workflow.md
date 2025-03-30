# SSL Setup Workflow for EC2 Staging Environment

This document outlines the process for setting up SSL certificates for the staging environment on EC2.

## Option 1: Self-Signed Certificates (for Development Only)

For quick testing, you can use self-signed certificates. These will work but will show browser warnings.

1. Run the included script to generate self-signed certificates:
   ```bash
   ./scripts/deployment/simple_ssl_setup.sh staging.tangible-studios.com
   ```

2. The certificates will be generated in `docker/nginx/ssl/`

3. These will be automatically included in the deployment package

## Option 2: Let's Encrypt Certificates (Recommended for Staging/Production)

For a proper staging environment, use Let's Encrypt certificates:

1. SSH into the EC2 instance:
   ```bash
   ssh -i "ultimate-marketing-staging.pem" ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com
   ```

2. Install Certbot:
   ```bash
   sudo apt-get update
   sudo apt-get install -y certbot
   ```

3. Generate certificates (make sure nginx is not running on port 80):
   ```bash
   sudo docker-compose -f docker-compose.ec2.yml down
   sudo certbot certonly --standalone -d staging.tangible-studios.com
   ```

4. Copy the certificates to the nginx directory:
   ```bash
   sudo mkdir -p ~/ultimate_marketing_team/docker/nginx/ssl
   sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/fullchain.pem ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.crt
   sudo cp /etc/letsencrypt/live/staging.tangible-studios.com/privkey.pem ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.key
   sudo chown -R ubuntu:ubuntu ~/ultimate_marketing_team/docker/nginx/ssl
   ```

5. Restart the services:
   ```bash
   cd ~/ultimate_marketing_team
   sudo docker-compose -f docker-compose.ec2.yml up -d
   ```

6. Set up auto-renewal:
   ```bash
   echo "0 0 * * * sudo certbot renew --post-hook 'cp /etc/letsencrypt/live/staging.tangible-studios.com/fullchain.pem ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.crt && cp /etc/letsencrypt/live/staging.tangible-studios.com/privkey.pem ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.key && cd ~/ultimate_marketing_team && docker-compose -f docker-compose.ec2.yml restart nginx'" | sudo tee -a /etc/crontab
   ```

## Alternative: Manual Certificate Upload

If you have certificates from another provider:

1. Upload the certificates to the EC2 instance:
   ```bash
   scp -i "ultimate-marketing-staging.pem" your_certificate.crt ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com:~/
   scp -i "ultimate-marketing-staging.pem" your_private_key.key ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com:~/
   ```

2. SSH into the EC2 instance and move the certificates:
   ```bash
   ssh -i "ultimate-marketing-staging.pem" ubuntu@ec2-44-202-29-233.compute-1.amazonaws.com
   sudo mkdir -p ~/ultimate_marketing_team/docker/nginx/ssl
   sudo mv ~/your_certificate.crt ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.crt
   sudo mv ~/your_private_key.key ~/ultimate_marketing_team/docker/nginx/ssl/staging.tangible-studios.com.key
   sudo chown -R ubuntu:ubuntu ~/ultimate_marketing_team/docker/nginx/ssl
   ```

3. Restart Nginx:
   ```bash
   cd ~/ultimate_marketing_team
   sudo docker-compose -f docker-compose.ec2.yml restart nginx
   ```

## Verifying SSL Configuration

1. Check SSL connection:
   ```bash
   openssl s_client -connect staging.tangible-studios.com:443 -servername staging.tangible-studios.com
   ```

2. Verify expiration date:
   ```bash
   echo | openssl s_client -servername staging.tangible-studios.com -connect staging.tangible-studios.com:443 2>/dev/null | openssl x509 -noout -dates
   ```