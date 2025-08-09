#!/bin/bash

# PM-App Quick Deploy Script for Ubuntu 20.04 LTS
# This script combines server setup and application deployment

set -e

echo "🚀 PM-App Quick Deploy for Ubuntu 20.04 LTS"
echo "============================================"
echo ""
echo "This script will:"
echo "1. Set up Ubuntu server (Node.js, PM2, Nginx, PostgreSQL)"
echo "2. Deploy your PM-App application"
echo "3. Configure everything for production"
echo ""

# Color codes
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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Do not run this script as root!"
    print_error "Create a regular user and run with sudo access instead."
    exit 1
fi

# Get user confirmation
echo "📋 Pre-deployment checklist:"
echo "  ✓ Ubuntu 20.04 LTS server with 2GB+ RAM"
echo "  ✓ Sudo access on this server"
echo "  ✓ Your PM-App source code ready"
echo "  ✓ Database credentials ready"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

print_step "Phase 1: Server Setup"
print_status "Running ubuntu-setup.sh..."

# Check if ubuntu-setup.sh exists, if not download it
if [ ! -f "ubuntu-setup.sh" ]; then
    print_status "Downloading ubuntu-setup.sh..."
    curl -fsSL -o ubuntu-setup.sh https://raw.githubusercontent.com/yourusername/pm-app/main/ubuntu-setup.sh
    chmod +x ubuntu-setup.sh
fi

# Run server setup
./ubuntu-setup.sh

print_step "Phase 2: Application Deployment"
print_status "Running deploy-app.sh..."

# Check if deploy-app.sh exists, if not download it
if [ ! -f "deploy-app.sh" ]; then
    print_status "Downloading deploy-app.sh..."
    curl -fsSL -o deploy-app.sh https://raw.githubusercontent.com/yourusername/pm-app/main/deploy-app.sh
    chmod +x deploy-app.sh
fi

# Run application deployment
./deploy-app.sh

print_step "Phase 3: Final Configuration"

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "your-server-ip")

echo ""
echo "🎉 PM-App Deployment Complete!"
echo "============================="
echo ""
echo "🌐 Your application is now running!"
echo ""
echo "📍 Access URLs:"
echo "   Local: http://localhost:3000"
echo "   Public: http://$SERVER_IP"
echo "   Domain: http://your-domain.com (after DNS setup)"
echo ""
echo "🔧 Management Commands:"
echo "   Status: pm2 status"
echo "   Logs: pm2 logs pm-app"
echo "   Restart: pm2 restart pm-app"
echo "   Stop: pm2 stop pm-app"
echo ""
echo "📊 System Monitoring:"
echo "   Resources: pm2 monit"
echo "   System: htop"
echo "   Nginx: sudo systemctl status nginx"
echo ""
echo "📁 Important Paths:"
echo "   App Directory: /var/www/pm-app"
echo "   Environment: /var/www/pm-app/.env"
echo "   Logs: /var/www/pm-app/logs/"
echo "   Nginx Config: /etc/nginx/sites-available/pm-app"
echo ""

if command -v nginx &> /dev/null; then
    print_step "Setting up SSL (Optional)"
    echo ""
    echo "🔒 To enable HTTPS with Let's Encrypt:"
    echo "   1. Point your domain to this server: $SERVER_IP"
    echo "   2. Run: sudo certbot --nginx -d your-domain.com"
    echo ""
fi

echo "📚 For detailed instructions, see:"
echo "   - UBUNTU_DEPLOYMENT_GUIDE.md"
echo "   - DEPLOYMENT_GUIDE.md"
echo ""
echo "✅ Deployment successful! Your PM-App is ready for production use."

# Final verification
print_step "Running final verification..."

# Check if application is responding
sleep 3
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    print_status "✅ Application is responding correctly"
else
    print_warning "⚠️  Application might need a moment to start"
    print_status "Check status with: pm2 logs pm-app"
fi

# Show PM2 status
print_status "Current PM2 Status:"
pm2 status

echo ""
echo "🎯 Next Steps:"
echo "1. Configure your domain DNS to point to: $SERVER_IP"
echo "2. Set up SSL certificate: sudo certbot --nginx -d your-domain.com"
echo "3. Test all application features"
echo "4. Set up monitoring and backups"
echo ""
echo "💡 Need help? Check the troubleshooting section in UBUNTU_DEPLOYMENT_GUIDE.md"
