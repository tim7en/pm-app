#!/bin/bash

# PM-App Application Deployment Script
# Run this after ubuntu-setup.sh to deploy the PM application
# Usage: ./deploy-app.sh

set -e

echo "🚀 Deploying PM-App Application"
echo "================================"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_DIR="/var/www/pm-app"
REPO_URL="https://github.com/yourusername/pm-app.git"  # Update with your repo
APP_USER="www-data"
NODE_ENV="production"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root!"
    exit 1
fi

print_step "1. Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please run ubuntu-setup.sh first."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Please run ubuntu-setup.sh first."
    exit 1
fi

print_status "Prerequisites check passed ✓"

print_step "2. Setting up application directory..."

# Create app directory if it doesn't exist
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Navigate to app directory
cd $APP_DIR

print_step "3. Downloading/updating application code..."

# Stop existing PM2 processes
print_status "Stopping existing processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Download or update code
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    git pull origin main || git pull origin master || {
        print_warning "Git pull failed, continuing with existing code..."
    }
else
    print_status "Please copy your application files to $APP_DIR"
    print_status "Or clone your repository:"
    print_status "git clone YOUR_REPO_URL $APP_DIR"
    
    # If no git repo, check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "No package.json found in $APP_DIR"
        print_error "Please copy your PM-App files to this directory first"
        exit 1
    fi
fi

print_step "4. Creating environment file..."

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file from template..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Created .env from .env.example"
        print_warning "Please edit .env file with your actual values:"
        print_warning "nano .env"
        
        read -p "Press Enter after you've configured the .env file..."
    else
        cat > .env << 'EOF'
# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://your-domain.com

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/pmapp"

# Authentication
NEXTAUTH_SECRET="your-very-secure-random-secret-key-here"
NEXTAUTH_URL="http://your-domain.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email Configuration (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# AI Configuration (optional)
OPENAI_API_KEY=""

# Upload Configuration
UPLOAD_DIR="/var/www/pm-app/uploads"
MAX_FILE_SIZE=10485760
EOF
        print_warning "Created basic .env file"
        print_warning "Please edit .env file with your actual values:"
        print_warning "nano .env"
        
        read -p "Press Enter after you've configured the .env file..."
    fi
else
    print_status "Environment file exists ✓"
fi

print_step "5. Installing dependencies..."
npm ci --only=production

print_step "6. Setting up database..."

# Check if Prisma schema exists
if [ -f "prisma/schema.prisma" ]; then
    print_status "Generating Prisma client..."
    npx prisma generate
    
    print_status "Setting up database schema..."
    npx prisma db push --accept-data-loss
else
    print_warning "No Prisma schema found, skipping database setup"
fi

print_step "7. Building application..."

# Create Next.js optimized production build
print_status "Creating production build..."
npm run build-simple || npm run build || {
    print_error "Build failed! Please check the errors above."
    exit 1
}

print_step "8. Setting up directories and permissions..."

# Create necessary directories
mkdir -p logs
mkdir -p uploads
mkdir -p public/uploads

# Set correct permissions
sudo chown -R $USER:$USER $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 777 uploads 2>/dev/null || true
chmod -R 777 public/uploads 2>/dev/null || true

print_step "9. Starting application with PM2..."

# Check if ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    print_status "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pm-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/pm-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 5,
    restart_delay: 5000,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
fi

# Start application with PM2
print_status "Starting PM-App with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration and setup startup
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

print_step "10. Verifying deployment..."

# Wait a moment for the app to start
sleep 5

# Check PM2 status
pm2 status

# Check if application is responding
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_status "Application is responding ✓"
else
    print_warning "Application might not be responding on port 3000"
    print_status "Check logs with: pm2 logs"
fi

print_step "11. Final configuration..."

# Display final information
echo ""
echo "✅ PM-App Deployment Complete!"
echo "=============================="
echo ""
echo "🌐 Application URL: http://localhost:3000"
echo "📊 PM2 Status: pm2 status"
echo "📋 View Logs: pm2 logs pm-app"
echo "🔄 Restart App: pm2 restart pm-app"
echo "⏹️  Stop App: pm2 stop pm-app"
echo ""
echo "📁 Application Directory: $APP_DIR"
echo "📄 Environment File: $APP_DIR/.env"
echo "📊 PM2 Config: $APP_DIR/ecosystem.config.js"
echo ""

if command -v nginx &> /dev/null; then
    echo "🌐 Nginx Configuration:"
    echo "   - Check: sudo nginx -t"
    echo "   - Reload: sudo systemctl reload nginx"
    echo "   - Access via: http://your-domain.com"
    echo ""
fi

echo "🎉 Your PM-App is now running in production!"
echo ""
echo "Next steps:"
echo "1. Configure your domain DNS to point to this server"
echo "2. Set up SSL certificate (recommended: Let's Encrypt)"
echo "3. Configure firewall rules if needed"
echo "4. Set up regular backups"
echo ""
echo "For troubleshooting:"
echo "- Check application logs: pm2 logs"
echo "- Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "- Check system resources: htop or pm2 monit"
