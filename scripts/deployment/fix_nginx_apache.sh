#!/bin/bash
# Quick script to fix Apache2/Nginx conflict on staging server
# Run this script with: ./scripts/deployment/fix_nginx_apache.sh

set -e

# Load deployment configuration (just need SSH_KEY, SSH_USER, SSH_HOST)
DEPLOY_CONFIG="config/env/deployment.env.staging"
if [ -f "$DEPLOY_CONFIG" ]; then
  echo "🔹 Loading deployment configuration from $DEPLOY_CONFIG"
  source "$DEPLOY_CONFIG"
else
  echo "❌ Deployment configuration file $DEPLOY_CONFIG not found!"
  exit 1
fi

# Check SSH key
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH key not found at $SSH_KEY"
  exit 1
fi
chmod 600 "$SSH_KEY"

echo "🚀 Starting Nginx/Apache conflict fix on staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Create temporary directory for Nginx configuration
TMP_DIR="tmp_nginx_fix"
mkdir -p $TMP_DIR

# Create a Nginx site configuration file for the server
echo "🔹 Creating Nginx site configuration..."
cat > $TMP_DIR/nginx_site_config << 'EOF'
server {
    listen 80;
    server_name staging.tangible-studios.com;
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name staging.tangible-studios.com;

    ssl_certificate /etc/letsencrypt/live/staging.tangible-studios.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.tangible-studios.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSockets
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health API service
    location /health-api/ {
        proxy_pass http://localhost:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Create direct fix script
cat > $TMP_DIR/nginx_apache_fix.sh << 'EOF'
#!/bin/bash
# Direct fix script for Nginx/Apache conflict

set -e
DOMAIN="staging.tangible-studios.com"
EMAIL="admin@tangible-studios.com"

echo "🔥 STARTING NGINX/APACHE CONFLICT FIX 🔥"

# 1. Stop and disable Apache2
echo "🔹 Stopping and disabling Apache2..."
sudo systemctl stop apache2 || true
sudo systemctl disable apache2 || true

# 2. Completely remove Apache2
echo "🔹 Completely removing Apache2..."
sudo apt-get purge -y apache2 apache2-utils apache2-bin apache2-data || true
sudo apt-get autoremove -y
sudo apt-get clean
sudo rm -rf /etc/apache2

# 3. Check what's using port 80/443
echo "🔹 Checking what's using ports 80 and 443..."
sudo netstat -tlnp | grep ':80'
sudo netstat -tlnp | grep ':443'

# 4. Install Nginx if needed
echo "🔹 Installing/restarting Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# 5. Configure Nginx
echo "🔹 Configuring Nginx site..."
sudo cp nginx_site_config /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 6. Test Nginx config
echo "🔹 Testing Nginx configuration..."
sudo nginx -t

# 7. Install Certbot and get certificates
echo "🔹 Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "🔹 Acquiring SSL certificates..."
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  sudo certbot --nginx --non-interactive --agree-tos --email $EMAIL -d $DOMAIN
else
  echo "Certificates already exist, skipping acquisition"
fi

# 8. Force Nginx restart and check
echo "🔹 Restarting Nginx and verifying..."
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx

# 9. Final port check
echo "🔹 Checking final port usage..."
sudo netstat -tlnp | grep ':80'
sudo netstat -tlnp | grep ':443'

echo "✅ NGINX/APACHE CONFLICT FIX COMPLETED"
EOF

# Copy files to server
echo "🔹 Copying fix files to server..."
scp -i "$SSH_KEY" -P "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $TMP_DIR/nginx_site_config $TMP_DIR/nginx_apache_fix.sh "$SSH_USER@$SSH_HOST:~/"

# Run fix script
echo "🔹 Running fix script on server..."
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "chmod +x ~/nginx_apache_fix.sh && ~/nginx_apache_fix.sh"

# Clean up
rm -rf $TMP_DIR

echo "✅ Nginx/Apache conflict fix script completed!"
echo "📝 Try accessing https://staging.tangible-studios.com"
echo "If the site still shows Apache2 default page, the service might need a few minutes to fully restart."