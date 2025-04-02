#!/bin/bash
# Script to set up proper frontend content on staging server

set -e

# Load deployment configuration
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

# Create a custom index.html file
CUSTOM_HTML="tmp_index_html"
mkdir -p $CUSTOM_HTML

cat > $CUSTOM_HTML/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Ultimate Marketing Team</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
      color: #333;
    }
    header {
      background-color: #1a73e8;
      color: white;
      padding: 2rem;
      text-align: center;
    }
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 2rem;
    }
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      padding: 2rem;
      margin-bottom: 2rem;
    }
    h1 { margin-top: 0; }
    .endpoints {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 2rem;
    }
    .endpoint {
      background-color: #f1f3f4;
      padding: 1rem;
      border-radius: 6px;
      border-left: 4px solid #1a73e8;
    }
    .status {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-left: 0.5rem;
    }
    .status.active {
      background-color: #e6f4ea;
      color: #137333;
    }
    footer {
      text-align: center;
      padding: 1rem;
      color: #6c757d;
      font-size: 0.875rem;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>Ultimate Marketing Team - Staging Environment</h1>
  </header>
  
  <div class="container">
    <div class="card">
      <h2>Welcome to the Staging Environment</h2>
      <p>This is the staging environment for the Ultimate Marketing Team application. Below you'll find information about the available services and endpoints.</p>
      <div class="status active">✅ Environment Active</div>
    </div>
    
    <div class="card">
      <h2>Services</h2>
      <div class="endpoints">
        <div class="endpoint">
          <h3>Frontend</h3>
          <p>The main user interface for the application.</p>
          <p><strong>URL:</strong> <a href="/" target="_blank">/</a></p>
        </div>
        
        <div class="endpoint">
          <h3>API Gateway</h3>
          <p>Main API services for the application.</p>
          <p><strong>URL:</strong> <a href="/api/" target="_blank">/api/</a></p>
          <p><strong>Health Check:</strong> <a href="/health" target="_blank">/health</a></p>
        </div>
        
        <div class="endpoint">
          <h3>Health API</h3>
          <p>Service health monitoring endpoints.</p>
          <p><strong>URL:</strong> <a href="/health-api/" target="_blank">/health-api/</a></p>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>System Status</h2>
      <p>The following components are currently deployed:</p>
      <ul>
        <li>Nginx Webserver with SSL</li>
        <li>Frontend Container</li>
        <li>API Gateway Container</li>
        <li>PostgreSQL Database</li>
      </ul>
    </div>
  </div>
  
  <footer>
    <p>Ultimate Marketing Team © 2025</p>
  </footer>
</body>
</html>
EOF

echo "🔄 Setting up proper frontend content on staging server..."
echo "🔹 Target: $SSH_USER@$SSH_HOST"

# Copy the index.html file to the server
scp -i "$SSH_KEY" -P "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no $CUSTOM_HTML/index.html "$SSH_USER@$SSH_HOST:~/index.html"

# Run commands on the server
ssh -i "$SSH_KEY" -p "$SSH_PORT" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "
cd $REMOTE_DIR

echo '🔹 Stopping frontend container...'
docker-compose stop frontend
docker-compose rm -f frontend

echo '🔹 Creating custom HTML directory...'
mkdir -p nginx/html
cp ~/index.html nginx/html/index.html

echo '🔹 Updating docker-compose.yml...'
# Update the frontend section in docker-compose.yml to mount the custom HTML
sed -i '/frontend:/,/networks:/s|image: \${FRONTEND_IMAGE:-nginx:alpine}|image: nginx:alpine\\n    volumes:\\n      - ./nginx/html:/usr/share/nginx/html|' docker-compose.yml

echo '🔹 Starting frontend container with custom content...'
export COMPOSE_HTTP_TIMEOUT=300
docker-compose up -d frontend

echo '🔹 Checking frontend container...'
docker ps | grep frontend

echo '🔹 Checking Nginx configuration...'
sudo nginx -t
sudo systemctl reload nginx

echo '🔹 Testing custom content...'
curl -s http://localhost:3000 | grep -o 'Ultimate Marketing Team'

echo '✅ Frontend content updated successfully!'
"

# Clean up temporary files
rm -rf $CUSTOM_HTML

echo "✅ Frontend content update completed!"
echo "🌐 Your application should now be accessible at https://staging.tangible-studios.com"