#!/bin/bash

# PM-App Ubuntu 20.04 LTS Production Deployment Script
# Run this script as root or with sudo privileges

set -e  # Exit on any error

echo "🚀 Starting PM-App Production Deployment on Ubuntu 20.04 LTS"
echo "=========================================================="

# Color codes for output
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
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. This is acceptable for initial setup."
fi

# Update system
print_step "1. Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_step "2. Installing essential packages..."
apt install -y curl wget git nginx software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 20.x
print_step "3. Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js version: $NODE_VERSION"
print_status "NPM version: $NPM_VERSION"

# Install PM2 globally
print_step "4. Installing PM2 process manager..."
npm install -g pm2

# Create application directory
print_step "5. Creating application directory..."
mkdir -p /var/www/pm-app
cd /var/www/pm-app

# Set proper permissions
print_step "6. Setting up user and permissions..."
# Create pm-app user if it doesn't exist
if ! id "pm-app" &>/dev/null; then
    useradd -r -s /bin/false pm-app
    print_status "Created pm-app user"
fi

# Download the project
print_step "7. Downloading PM-App from GitHub..."
if [ -d ".git" ]; then
    print_status "Git repository already exists, pulling latest changes..."
    git pull origin master
else
    print_status "Cloning PM-App repository..."
    git clone https://github.com/tim7en/pm-app.git .
fi

# Install dependencies
print_step "8. Installing Node.js dependencies..."
npm ci --only=production

# Build the application
print_step "9. Building the application..."
npm run build

# Generate Prisma client
print_step "10. Setting up database..."
npx prisma generate
npx prisma db push

# Set proper ownership
chown -R pm-app:pm-app /var/www/pm-app

# Create PM2 ecosystem file
print_step "11. Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pm-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/pm-app',
    instances: 1,
    exec_mode: 'fork',
    user: 'pm-app',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm-app/error.log',
    out_file: '/var/log/pm-app/out.log',
    log_file: '/var/log/pm-app/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1536'
  }]
}
EOF

# Create log directory
mkdir -p /var/log/pm-app
chown pm-app:pm-app /var/log/pm-app

# Configure Nginx
print_step "12. Configuring Nginx..."
cat > /etc/nginx/sites-available/pm-app << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Socket.IO specific configuration
    location /api/socketio/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Configure firewall
print_step "13. Configuring UFW firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443

# Optimize system for 2GB RAM
print_step "14. Optimizing system for low memory..."

# Create swap file if it doesn't exist
if [ ! -f /swapfile ]; then
    print_status "Creating 1GB swap file..."
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Optimize memory settings
cat >> /etc/sysctl.conf << 'EOF'

# PM-App Memory Optimizations
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10
EOF

sysctl -p

# Install and configure fail2ban for security
print_step "15. Installing security tools..."
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl start fail2ban

# Start services
print_step "16. Starting services..."
systemctl restart nginx
systemctl enable nginx

print_status "System setup completed!"
print_warning "Next steps:"
echo "1. Create and configure your .env file:"
echo "   cp /var/www/pm-app/.env.example /var/www/pm-app/.env"
echo "   nano /var/www/pm-app/.env"
echo ""
echo "2. Start the PM-App:"
echo "   cd /var/www/pm-app"
echo "   pm2 start ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "3. Optional: Set up SSL with Let's Encrypt:"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d your-domain.com"
echo ""
print_status "Setup script completed successfully!"
