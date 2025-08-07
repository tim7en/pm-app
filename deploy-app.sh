#!/bin/bash

# Project Deployment Script
# Run this script after server setup to deploy your application

set -e

APP_DIR="/var/www/pm-app"
REPO_URL="https://github.com/tim7en/pm-app.git"  # Update with your actual repo URL

echo "🚀 Deploying PM-App..."

# Navigate to app directory
cd $APP_DIR

# Stop existing PM2 processes
echo "⏹️ Stopping existing processes..."
pm2 stop all || true
pm2 delete all || true

# Pull latest code (if using Git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest code..."
    git pull origin master
else
    echo "📥 Cloning repository..."
    cd /var/www
    sudo rm -rf pm-app
    git clone $REPO_URL pm-app
    sudo chown -R $USER:$USER pm-app
    cd pm-app
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Setting up database..."
npx prisma db push

# Build the application
echo "🔨 Building application..."
npm run build

# Create logs directory
mkdir -p logs

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup | tail -1 | sudo bash

# Show status
pm2 status

echo "✅ Deployment complete!"
echo "🌐 Application is running at: http://hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status        - Check application status"
echo "   pm2 logs          - View application logs"
echo "   pm2 restart all   - Restart application"
echo "   pm2 stop all      - Stop application"
