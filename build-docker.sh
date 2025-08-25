#!/bin/bash

# Quick Docker Build Script for PM-App Production
# This script builds the Docker image without running it

set -e

echo "🐳 Building PM-App Production Docker Image"
echo "=========================================="

# Configuration
IMAGE_NAME="pm-app"
IMAGE_TAG="production"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info &> /dev/null; then
    log_error "Docker is not running. Please start Docker first."
    exit 1
fi

log_info "Docker is running"

# Build the Docker image
log_info "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
log_info "This may take several minutes..."

if docker build -f Dockerfile.prod -t ${IMAGE_NAME}:${IMAGE_TAG} .; then
    log_success "Docker image built successfully!"
    echo ""
    echo "Image Details:"
    docker images | grep ${IMAGE_NAME} | grep ${IMAGE_TAG}
    echo ""
    echo "To run the container:"
    echo "  docker run -d --name pm-app-prod -p 3000:3000 --env-file .env.production ${IMAGE_NAME}:${IMAGE_TAG}"
    echo ""
    echo "To use the full deployment script:"
    echo "  ./deploy-production.sh"
else
    log_error "Failed to build Docker image"
    exit 1
fi
