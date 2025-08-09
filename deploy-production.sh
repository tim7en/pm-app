#!/bin/bash

# Production Docker Build and Deploy Script for PM-App
# This script builds and deploys the PM-App for production

set -e

echo "🚀 PM-App Production Deployment Script"
echo "======================================"

# Configuration
IMAGE_NAME="pm-app"
IMAGE_TAG="latest"
CONTAINER_NAME="pm-app-production"
PORT="3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Docker is running
check_docker() {
    log_info "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    log_success "Docker is running"
}

# Check if environment file exists
check_env() {
    log_info "Checking environment configuration..."
    if [ ! -f ".env.production" ]; then
        log_warning ".env.production not found. Creating from template..."
        cp .env.production.template .env.production 2>/dev/null || true
        log_warning "Please update .env.production with your actual values before running again."
        exit 1
    fi
    log_success "Environment configuration found"
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    echo "This may take several minutes..."
    
    if docker build -f Dockerfile.production -t ${IMAGE_NAME}:${IMAGE_TAG} .; then
        log_success "Docker image built successfully"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

# Stop existing container
stop_existing() {
    log_info "Stopping existing container if running..."
    if docker ps -q -f name=${CONTAINER_NAME} | grep -q .; then
        docker stop ${CONTAINER_NAME}
        docker rm ${CONTAINER_NAME}
        log_success "Existing container stopped and removed"
    else
        log_info "No existing container found"
    fi
}

# Run container
run_container() {
    log_info "Starting production container..."
    
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        -p ${PORT}:3000 \
        --env-file .env.production \
        -v $(pwd)/data:/app/data \
        -v $(pwd)/uploads:/app/uploads \
        -v $(pwd)/logs:/app/logs \
        ${IMAGE_NAME}:${IMAGE_TAG}
    
    log_success "Container started successfully"
}

# Check container health
check_health() {
    log_info "Checking container health..."
    sleep 10
    
    for i in {1..30}; do
        if curl -f http://localhost:${PORT}/api/health &> /dev/null; then
            log_success "Application is healthy and running on http://localhost:${PORT}"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "Health check failed. Check container logs:"
    docker logs ${CONTAINER_NAME}
    exit 1
}

# Show container info
show_info() {
    echo ""
    log_success "🎉 PM-App Production Deployment Complete!"
    echo ""
    echo "Container Info:"
    echo "  Name: ${CONTAINER_NAME}"
    echo "  Image: ${IMAGE_NAME}:${IMAGE_TAG}"
    echo "  Port: ${PORT}"
    echo "  URL: http://localhost:${PORT}"
    echo ""
    echo "Useful Commands:"
    echo "  View logs: docker logs ${CONTAINER_NAME}"
    echo "  Stop app: docker stop ${CONTAINER_NAME}"
    echo "  Start app: docker start ${CONTAINER_NAME}"
    echo "  Remove app: docker rm ${CONTAINER_NAME}"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    check_docker
    check_env
    
    echo ""
    read -p "Do you want to proceed with the production build? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    echo ""
    build_image
    stop_existing
    run_container
    check_health
    show_info
}

# Run main function
main "$@"
