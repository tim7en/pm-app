#!/bin/bash

# Production Deployment Script for PM-App
# This script deploys the application using docker-compose in production mode

set -e  # Exit on any error

echo "🚀 PM-App Production Deployment"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check Docker
check_docker() {
    log_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    log_success "Docker is running"
}

# Clean up function
cleanup() {
    log_info "Cleaning up old Docker resources..."
    
    # Stop any running development services
    docker compose down 2>/dev/null || true
    
    # Clean up unused images and containers
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Deploy function
deploy() {
    log_info "Starting production deployment..."
    
    # Set production environment variables
    export NODE_ENV=production
    export DB_PASSWORD=${DB_PASSWORD:-change_this_password}
    export REDIS_PASSWORD=${REDIS_PASSWORD:-change_this_password}
    export NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-prod-super-secure-nextauth-secret-32-chars-minimum-length}
    export JWT_SECRET=${JWT_SECRET:-prod-super-secure-jwt-secret-32-chars-minimum-length}
    
    log_info "Environment: $NODE_ENV"
    log_info "Application URL: http://198.163.207.39:3000"
    
    # Build and start services
    log_info "Building and starting production services..."
    docker compose -f docker-compose.production.yml up -d --build
    
    # Wait for services
    log_info "Waiting for services to initialize..."
    sleep 30
    
    # Check services status
    log_info "Checking service status..."
    docker compose -f docker-compose.production.yml ps
    
    # Test database
    log_info "Testing database connection..."
    if docker compose -f docker-compose.production.yml exec -T pm-app-db pg_isready -U pmapp_user -d pmapp; then
        log_success "Database is ready"
    else
        log_error "Database connection failed"
        return 1
    fi
    
    # Run migrations
    log_info "Running database migrations..."
    docker compose -f docker-compose.production.yml exec -T pm-app npx prisma migrate deploy || {
        log_warning "Migration failed, but continuing..."
    }
    
    # Health check
    log_info "Performing health check..."
    local retries=10
    for ((i=1; i<=retries; i++)); do
        if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
            log_success "Application is healthy!"
            break
        elif [ $i -eq $retries ]; then
            log_error "Health check failed after $retries attempts"
            log_info "Application logs:"
            docker compose -f docker-compose.production.yml logs --tail=20 pm-app
            return 1
        else
            log_info "Health check attempt $i/$retries..."
            sleep 10
        fi
    done
    
    log_success "Production deployment completed successfully!"
}

# Show status
show_status() {
    echo ""
    echo "📊 Production Status:"
    echo "===================="
    docker compose -f docker-compose.production.yml ps
    
    echo ""
    echo "📍 Application URLs:"
    echo "   • Main: http://198.163.207.39:3000"
    echo "   • Health: http://198.163.207.39:3000/api/health"
    
    echo ""
    echo "🔧 Management Commands:"
    echo "   • Logs: docker compose -f docker-compose.production.yml logs -f"
    echo "   • Stop: docker compose -f docker-compose.production.yml down"
    echo "   • Restart: docker compose -f docker-compose.production.yml restart"
    echo "   • Status: docker compose -f docker-compose.production.yml ps"
}

# Main execution
main() {
    check_docker
    cleanup
    
    if deploy; then
        show_status
        echo ""
        log_success "🎉 Production deployment successful!"
    else
        log_error "❌ Production deployment failed!"
        exit 1
    fi
}

# Run main function
main "$@"
