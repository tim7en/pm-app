#!/bin/bash

# PM-App Ubuntu VM Deployment Script
# Deploy PM-App using Docker on Ubuntu VM with best practices

set -e  # Exit on any error

echo "=========================================="
echo "    PM-App Ubuntu VM Deployment"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Install Docker (optional, for containerized deployment)
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
echo "📦 Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/pm-app
sudo chown $USER:$USER /var/www/pm-app
cd /var/www/pm-app

# Create logs directory
mkdir -p logs

# Setup Nginx (reverse proxy)
echo "🌐 Setting up Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pm-app > /dev/null <<EOF
server {
    listen 80;
    server_name hollow-gray-snipe-carey-swknu.app.uztelecom.uz;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hollow-gray-snipe-carey-swknu.app.uztelecom.uz;

    # SSL certificates (you'll need to configure these)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;

    # For now, comment out SSL and use HTTP only
    # Uncomment above SSL lines when you have certificates

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.IO support
    location /api/socketio {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site (temporarily disable SSL)
sudo sed -i 's/listen 443 ssl http2;/listen 80;/' /etc/nginx/sites-available/pm-app
sudo sed -i '/ssl_certificate/d' /etc/nginx/sites-available/pm-app
sudo ln -sf /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
sudo systemctl restart nginx

# Setup UFW firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw --force enable

# Setup swap (important for 2GB RAM)
echo "💾 Setting up swap file..."
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low memory
echo "⚡ Optimizing system for low memory..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Upload your project files to /var/www/pm-app"
echo "2. Copy your .env file with production settings"
echo "3. Run: npm install"
echo "4. Run: npx prisma generate"
echo "5. Run: npx prisma db push"
echo "6. Run: npm run build"
echo "7. Start with PM2: pm2 start ecosystem.config.js"
echo ""
echo "🌐 Your app will be available at: http://hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
echo ""
echo "⚠️  SSL Setup Required:"
echo "   - Obtain SSL certificates for HTTPS"
echo "   - Update Nginx config with certificate paths"
echo "   - Restart Nginx after SSL setup"
