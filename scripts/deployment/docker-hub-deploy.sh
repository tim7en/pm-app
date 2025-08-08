#!/bin/bash

# Docker Hub Deployment Script for PM-App
# This script builds and pushes your PM app to Docker Hub

set -e

# Configuration
DOCKER_USERNAME="tim7en"
APP_NAME="pm-app"
VERSION=${1:-"latest"}

echo "🐳 Building and deploying PM-App to Docker Hub..."
echo "Version: $VERSION"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username:"; then
    echo "🔐 Please login to Docker Hub first:"
    docker login
fi

# Build the image
echo "🔨 Building Docker image..."
docker build -t $DOCKER_USERNAME/$APP_NAME:$VERSION .

# Tag as latest if not already
if [ "$VERSION" != "latest" ]; then
    docker tag $DOCKER_USERNAME/$APP_NAME:$VERSION $DOCKER_USERNAME/$APP_NAME:latest
fi

# Push to Docker Hub
echo "📤 Pushing to Docker Hub..."
docker push $DOCKER_USERNAME/$APP_NAME:$VERSION

if [ "$VERSION" != "latest" ]; then
    docker push $DOCKER_USERNAME/$APP_NAME:latest
fi

echo "✅ Successfully deployed to Docker Hub!"
echo "🌐 Your app is now available at:"
echo "   docker pull $DOCKER_USERNAME/$APP_NAME:$VERSION"
echo "   docker pull $DOCKER_USERNAME/$APP_NAME:latest"

# Generate deployment command
echo ""
echo "🚀 Quick deployment command for your server:"
echo "docker run -d --name pm-app --env-file .env.production -p 80:3000 -v pm-app-data:/app/data --restart unless-stopped $DOCKER_USERNAME/$APP_NAME:latest"

echo ""
echo "📋 Next steps:"
echo "1. Copy the deployment command above"
echo "2. SSH to your server: ssh user@your-server.com"
echo "3. Create .env.production file with your real secrets"
echo "4. Run the deployment command"
echo "5. Setup SSL with Let's Encrypt"
