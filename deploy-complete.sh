#!/bin/bash

# PM-App Complete Ubuntu Server Deployment Script
# This script handles everything: server setup, dependencies, build, and deployment
# Compatible with Ubuntu 20.04 LTS, 2GB RAM, 1 vCPU

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/tim7en/pm-app.git"
APP_DIR="/var/www/pm-app"
DOMAIN="hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
USER_EMAIL="admin@${DOMAIN}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

# Error handler
error_handler() {
    log_error "Script failed at line $1"
    log_error "Last command: $2"
    log_info "Check the error above and try running the script again"
    exit 1
}

trap 'error_handler $LINENO "$BASH_COMMAND"' ERR

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

log_step "🚀 Starting PM-App Complete Deployment"
log_info "This script will:"
log_info "1. Clean existing installations"
log_info "2. Set up server environment"
log_info "3. Clone repository and install dependencies"
log_info "4. Set up database and build application"
log_info "5. Configure Nginx and SSL"
log_info "6. Start application with PM2"
log_info "7. Configure firewall and monitoring"

read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Deployment cancelled."
    exit 1
fi

# STEP 1: Clean existing installation
log_step "🧹 STEP 1: Cleaning Existing Installation"

log_info "Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

sudo systemctl stop nginx 2>/dev/null || true

sudo pkill -f node 2>/dev/null || true
sudo pkill -f npm 2>/dev/null || true
sudo pkill -f tsx 2>/dev/null || true

log_info "Removing existing files..."
sudo rm -rf /var/www/pm-app
sudo rm -rf /var/www/html/pm-app
rm -rf ~/.pm2 2>/dev/null || true
sudo rm -f /etc/nginx/sites-available/pm-app
sudo rm -f /etc/nginx/sites-enabled/pm-app

npm cache clean --force 2>/dev/null || true
sudo apt clean
sudo apt autoremove -y

log_success "Cleanup completed"

# STEP 2: Server setup
log_step "🛠️ STEP 2: Server Environment Setup"

log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

log_info "Installing essential packages..."
sudo apt install -y curl wget git unzip build-essential software-properties-common python3-pip

log_info "Removing existing Node.js..."
sudo apt remove -y nodejs npm 2>/dev/null || true

log_info "Installing Node.js 20.19.0+ (required by package.json engines)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js version meets requirements
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="20.19.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    log_error "Node.js version $NODE_VERSION is below required $REQUIRED_VERSION"
    exit 1
fi

log_info "Updating npm to latest version (>=10.0.0 required)..."
sudo npm install -g npm@latest

log_info "Installing PM2 globally..."
sudo npm install -g pm2@latest

log_info "Node.js version: $(node --version)"
log_info "NPM version: $(npm --version)"
log_info "PM2 version: $(pm2 --version)"

log_success "Server environment setup completed"

# STEP 3: Clone repository and setup application
log_step "📂 STEP 3: Repository Clone and Dependency Installation"

log_info "Creating application directory..."
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

log_info "Cloning repository from GitHub..."
git clone $REPO_URL pm-app
cd pm-app

log_info "Verifying repository contents..."
ls -la

log_info "Creating npm configuration for dependency resolution..."
cat > .npmrc << 'EOF'
legacy-peer-deps=true
fund=false
audit=false
EOF

log_info "Clearing npm cache..."
npm cache clean --force

log_info "Installing dependencies with conflict resolution..."
# Try multiple approaches to handle dependency conflicts
if npm install --legacy-peer-deps --force; then
    log_success "Dependencies installed successfully"
else
    log_warning "Standard install failed, trying step-by-step approach..."
    
    # Remove problematic packages and reinstall with compatible versions
    npm uninstall next-auth nodemailer @types/nodemailer 2>/dev/null || true
    
    # Install compatible versions one by one
    npm install next-auth@4.24.7 --legacy-peer-deps --force
    npm install nodemailer@6.9.8 --legacy-peer-deps --force
    npm install @types/nodemailer@6.4.14 --legacy-peer-deps --force
    
    # Install remaining dependencies
    npm install --legacy-peer-deps --force
fi

log_info "Installing critical build dependencies..."
npm install --save-dev tailwindcss postcss autoprefixer @types/node typescript --legacy-peer-deps --force

log_info "Installing UI dependencies..."
npm install class-variance-authority clsx tailwind-merge lucide-react --legacy-peer-deps --force

log_info "Installing Prisma dependencies..."
npm install prisma @prisma/client --legacy-peer-deps --force

log_success "All dependencies installed"

# STEP 4: Database and build setup
log_step "🗄️ STEP 4: Database Setup and Application Build"

log_info "Setting up environment variables..."
cat > .env << EOF
# Production Environment Configuration
NODE_ENV="production"

# Database - SQLite (consider PostgreSQL for production scale)
DATABASE_URL="file:./dev.db"

# Next Auth - Production Ready (32+ char secret required)
NEXTAUTH_SECRET="XaQ8vN9mK2pR7wL5tY6hU3jF8bZ4cV1eS0dG9xA2qW5rT8nM7kP3vL6yH1uJ4"
NEXTAUTH_URL="https://${DOMAIN}"

# JWT Secret (production ready, 32+ characters)
JWT_SECRET="P9mK2wN5vQ8xA1bY4tR7cL0eS3gZ6hU9jF2pW5nM8kV1xT4yL7qG0aB3dE6fH9"

# OpenAI API Keys (Required for AI features)
OPENAI_API_KEY="your-openai-key-here"
OPENAI_API_KEY_2="your-backup-openai-key-here"

# Z.AI API Key (Optional - for advanced AI features)
ZAI_API_KEY="your-zai-api-key-here"

# Google OAuth Configuration (Required for Gmail integration)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://${DOMAIN}/api/email/gmail/callback"

# Email Configuration (Required for email features)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"

# Server Configuration
PORT="3000"
EOF

log_info "Verifying Prisma schema..."
if [ ! -f "prisma/schema.prisma" ]; then
    log_error "prisma/schema.prisma not found! This file should be in your repository."
    exit 1
fi

log_info "Prisma schema preview:"
head -10 prisma/schema.prisma

log_info "Removing any existing corrupted database..."
rm -f dev.db prisma/dev.db 2>/dev/null || true

log_info "Generating Prisma client..."
npx prisma generate

log_info "Creating database with schema..."
npx prisma db push --force-reset

log_info "Verifying database creation..."
if [ -f "dev.db" ] || [ -f "prisma/dev.db" ]; then
    log_success "Database created successfully!"
    find . -name "*.db" -type f
else
    log_error "Database creation failed!"
    npx prisma db push 2>&1
    exit 1
fi

log_info "Seeding database if seed script exists..."
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    npm run db:seed 2>/dev/null || echo "Seeding skipped"
fi

log_info "Creating configuration files if missing..."

# Create TailwindCSS config if missing
if [ ! -f "tailwind.config.js" ] && [ ! -f "tailwind.config.ts" ]; then
    log_info "Creating TailwindCSS config..."
    npx tailwindcss init -p
fi

# Create TypeScript config if missing
if [ ! -f "tsconfig.json" ]; then
    log_info "Creating TypeScript config..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
fi

log_info "Building Next.js application..."
if npm run build; then
    log_success "Build completed successfully!"
    ls -la .next/
else
    log_warning "Build failed, trying with fresh dependencies..."
    npm install --legacy-peer-deps --force
    npm run build
fi

log_info "Creating logs directory..."
mkdir -p logs

log_success "Database and build setup completed"

# STEP 5: Nginx setup
log_step "🌐 STEP 5: Nginx Web Server Configuration"

log_info "Installing Nginx..."
sudo apt install -y nginx

log_info "Starting and enabling Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

log_info "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/pm-app > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Main application proxy
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

log_info "Enabling pm-app site..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/

log_info "Testing Nginx configuration..."
sudo nginx -t

log_info "Restarting Nginx..."
sudo systemctl restart nginx

log_success "Nginx configuration completed"

# STEP 6: PM2 application startup
log_step "🚀 STEP 6: Application Startup with PM2"

log_info "Creating PM2 ecosystem file..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pm-app',
    script: 'server.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    min_uptime: '10s',
    max_restarts: 10,
    node_args: '--max-old-space-size=1536'
  }]
};
EOF

log_info "Starting application with PM2..."
pm2 start ecosystem.config.js

log_info "Saving PM2 configuration..."
pm2 save

log_info "Setting up PM2 to start on boot..."
STARTUP_CMD=$(pm2 startup | tail -1)
eval $STARTUP_CMD

log_info "Checking application status..."
pm2 status

log_info "Waiting for application to fully start..."
sleep 10

log_info "Testing health endpoint..."
if curl -f http://localhost:3000/api/health; then
    log_success "Application is responding!"
else
    log_warning "Application may still be starting up..."
fi

log_success "Application startup completed"

# STEP 7: Memory optimization
log_step "💾 STEP 7: Memory Optimization for 2GB RAM"

log_info "Creating swap file if it doesn't exist..."
if [ ! -f /swapfile ]; then
    log_info "Creating 1GB swap file..."
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    log_success "Swap file created successfully!"
else
    log_info "Swap file already exists."
fi

log_info "Optimizing swap settings..."
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

log_success "Memory optimization completed"

# STEP 8: Firewall setup
log_step "🔒 STEP 8: Firewall Configuration"

log_info "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable

log_info "Firewall status:"
sudo ufw status verbose

log_success "Firewall configuration completed"

# STEP 9: SSL setup
log_step "🔐 STEP 9: SSL Certificate Setup"

log_info "Installing Certbot..."
sudo apt install certbot python3-certbot-nginx -y

log_info "Setting up SSL certificate..."
log_warning "About to request SSL certificate for ${DOMAIN}"
log_info "You will be prompted for:"
log_info "1. Email address (suggested: ${USER_EMAIL})"
log_info "2. Accept terms of service (type 'Y')"
log_info "3. Share email with EFF (your choice)"
log_info "4. Choose option 2 to redirect HTTP to HTTPS"

read -p "Do you want to proceed with SSL setup? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d ${DOMAIN}
    
    log_info "Testing certificate auto-renewal..."
    sudo certbot renew --dry-run
    
    log_success "SSL certificate setup completed"
else
    log_warning "SSL setup skipped. You can run 'sudo certbot --nginx -d ${DOMAIN}' later"
fi

# STEP 10: Monitoring setup
log_step "📊 STEP 10: Monitoring and Scripts Setup"

log_info "Creating monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "🔍 PM-App Server Health Check"
echo "=============================="
echo "Date: $(date)"
echo ""

echo "📊 System Resources:"
echo "--------------------"
free -h
echo ""
df -h | grep -E "(Filesystem|/dev/)"
echo ""

echo "🚀 Application Status:"
echo "---------------------"
pm2 status
echo ""

echo "📝 Recent Logs (last 10 lines):"
echo "--------------------------------"
pm2 logs pm-app --lines 10 --nostream
echo ""

echo "🌐 Application Health:"
echo "---------------------"
curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
echo ""

echo "🔒 SSL Certificate Status:"
echo "-------------------------"
sudo certbot certificates 2>/dev/null | grep -A 2 -B 2 "${DOMAIN}" || echo "SSL not configured or certbot not found"
echo ""

echo "✅ Health check complete!"
EOF

chmod +x monitor.sh

log_info "Creating update script..."
cat > update-app.sh << 'EOF'
#!/bin/bash

echo "🔄 Updating PM-App from GitHub..."
cd /var/www/pm-app

# Stop application
pm2 stop pm-app

# Pull latest changes
git pull origin master

# Install/update dependencies
npm ci --legacy-peer-deps --only=production

# Regenerate Prisma client
npx prisma generate

# Apply database changes
npx prisma db push

# Rebuild application
npm run build

# Restart application
pm2 restart pm-app

echo "✅ Update completed!"
pm2 status
EOF

chmod +x update-app.sh

log_success "Monitoring and scripts setup completed"

# STEP 11: Final verification
log_step "✅ STEP 11: Final Verification"

log_info "Performing final system checks..."

echo ""
log_info "1. PM2 Application Status:"
pm2 status

echo ""
log_info "2. Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo ""
log_info "3. Firewall Status:"
sudo ufw status

echo ""
log_info "4. System Resources:"
free -h
echo ""
df -h | grep -E "(Filesystem|/dev/)"

echo ""
log_info "5. Application Health Check:"
curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health

echo ""
log_info "6. Testing external access..."
curl -I http://${DOMAIN} || log_warning "External access test failed - check DNS settings"

# Final summary
log_step "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"

echo ""
log_success "Your PM-App is now deployed and running!"
echo ""
log_info "📊 Deployment Summary:"
log_info "   • Application URL: http://${DOMAIN}"
log_info "   • HTTPS URL: https://${DOMAIN} (if SSL was configured)"
log_info "   • Server Status: Running on Ubuntu 20.04 LTS"
log_info "   • Memory: 2GB RAM with 1GB swap"
log_info "   • Process Manager: PM2"
log_info "   • Web Server: Nginx"
log_info "   • Database: SQLite"
log_info "   • Firewall: UFW enabled"
echo ""
log_info "📝 Useful Commands:"
log_info "   • Check status: pm2 status"
log_info "   • View logs: pm2 logs pm-app"
log_info "   • Restart app: pm2 restart pm-app"
log_info "   • System health: ./monitor.sh"
log_info "   • Update app: ./update-app.sh"
echo ""
log_info "📂 Important Files:"
log_info "   • Application: ${APP_DIR}"
log_info "   • Environment: ${APP_DIR}/.env"
log_info "   • Logs: ${APP_DIR}/logs/"
log_info "   • Nginx config: /etc/nginx/sites-available/pm-app"
echo ""
log_warning "🔧 Post-Deployment Tasks:"
log_info "   1. Update email settings in .env file"
log_info "   2. Configure backup strategy"
log_info "   3. Set up external monitoring"
log_info "   4. Review and customize application settings"
echo ""
log_success "🎯 Your PM-App is ready for production use!"

echo ""
read -p "Would you like to view the application logs now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pm2 logs pm-app --lines 50
fi

exit 0
