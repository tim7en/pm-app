#!/bin/bash

# PM-App Docker Launch Script
# This script handles building and running the PM-App in Docker containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        if [ -f ".env.docker" ]; then
            print_warning ".env file not found. Copying from .env.docker template..."
            cp .env.docker .env
            print_warning "Please edit .env file with your actual API keys and configuration"
        else
            print_error ".env file not found. Please create one based on .env.docker template"
            exit 1
        fi
    fi
    print_success ".env file found"
}

# Function to stop and remove existing containers
cleanup() {
    print_status "Cleaning up existing containers..."
    docker-compose down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down --remove-orphans 2>/dev/null || true
    print_success "Cleanup completed"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images..."
    docker-compose build --no-cache
    print_success "Docker images built successfully"
}

# Function to run in production mode
run_production() {
    print_status "Starting PM-App in production mode..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check if services are running
    if docker-compose ps | grep -q "Up"; then
        print_success "PM-App is running in production mode!"
        print_status "Application: http://localhost:3000"
        print_status "Nginx proxy: http://localhost:80"
        print_status "View logs: docker-compose logs -f pm-app"
        print_status "Stop services: docker-compose down"
    else
        print_error "Failed to start services. Check logs with: docker-compose logs"
        exit 1
    fi
}

# Function to run in development mode
run_development() {
    print_status "Starting PM-App in development mode..."
    docker-compose -f docker-compose.dev.yml up -d
    
    print_status "Waiting for development server to start..."
    sleep 15
    
    if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        print_success "PM-App is running in development mode!"
        print_status "Application: http://localhost:3000"
        print_status "Hot reloading enabled"
        print_status "View logs: docker-compose -f docker-compose.dev.yml logs -f"
        print_status "Stop services: docker-compose -f docker-compose.dev.yml down"
    else
        print_error "Failed to start development server. Check logs with: docker-compose -f docker-compose.dev.yml logs"
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -p, --production    Run in production mode (default)"
    echo "  -d, --development   Run in development mode"
    echo "  -b, --build         Force rebuild of Docker images"
    echo "  -c, --cleanup       Clean up containers and volumes"
    echo "  --logs              Show application logs"
    echo "  --status            Show container status"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run in production mode"
    echo "  $0 -d               # Run in development mode"
    echo "  $0 -b -p            # Rebuild and run in production"
    echo "  $0 --cleanup        # Clean up all containers"
}

# Function to show logs
show_logs() {
    if docker-compose ps | grep -q "pm-app"; then
        docker-compose logs -f pm-app
    elif docker-compose -f docker-compose.dev.yml ps | grep -q "pm-app-dev"; then
        docker-compose -f docker-compose.dev.yml logs -f pm-app-dev
    else
        print_error "No running PM-App containers found"
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Production containers:"
    docker-compose ps 2>/dev/null || echo "No production containers running"
    
    print_status "Development containers:"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "No development containers running"
}

# Main script logic
main() {
    local mode="production"
    local build_flag=false
    local cleanup_flag=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -p|--production)
                mode="production"
                shift
                ;;
            -d|--development)
                mode="development"
                shift
                ;;
            -b|--build)
                build_flag=true
                shift
                ;;
            -c|--cleanup)
                cleanup_flag=true
                shift
                ;;
            --logs)
                show_logs
                exit 0
                ;;
            --status)
                show_status
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Run main operations
    print_status "Starting PM-App Docker deployment..."
    
    check_docker
    
    if [ "$cleanup_flag" = true ]; then
        cleanup
        print_success "Cleanup completed. Exiting."
        exit 0
    fi
    
    check_env_file
    
    if [ "$build_flag" = true ]; then
        cleanup
        build_images
    fi
    
    if [ "$mode" = "development" ]; then
        run_development
    else
        run_production
    fi
    
    print_success "PM-App Docker deployment completed!"
}

# Run main function with all arguments
main "$@"
