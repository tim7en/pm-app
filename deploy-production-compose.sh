#!/bin/bash

# Simple Production Docker Deployment for PM-App
# Uses docker-compose for production with separated database

set -e

echo "🚀 PM-App Production Docker Deployment"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check Docker and Docker Compose
check_requirements() {
    log_info "Checking requirements..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    log_success "Requirements satisfied"
}

# Create production environment file
setup_env() {
    log_info "Setting up production environment..."
    
    if [ ! -f ".env.production" ]; then
        log_warning "Creating .env.production from template"
        cat > .env.production << EOF
# Production Environment for PM-App
NODE_ENV=production
PORT=3000

# Database Configuration
DB_PASSWORD=secure_db_password_change_this
DATABASE_URL=postgresql://pmapp_user:secure_db_password_change_this@pm-app-db:5432/pmapp

# Redis Configuration  
REDIS_PASSWORD=secure_redis_password_change_this
REDIS_URL=redis://:secure_redis_password_change_this@pm-app-redis:6379

# Application Configuration
APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=change_this_secret_in_production
JWT_SECRET=change_this_jwt_secret_in_production

# Email Configuration (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# OpenAI Configuration (optional)
OPENAI_API_KEY=
OPENAI_API_KEY_2=
EOF
        log_warning "Please update .env.production with your actual values"
        echo "Press any key to continue after updating the file..."
        read -n 1
    fi
    
    log_success "Environment configured"
}

# Build and deploy
deploy() {
    log_info "Deploying PM-App with Docker Compose..."
    
    # Build and start services
    if docker-compose -f docker-compose.production.yml up -d --build; then
        log_success "Services started successfully"
    else
        log_error "Failed to start services"
        exit 1
    fi
}

# Check service health
check_health() {
    log_info "Checking service health..."
    
    sleep 15
    
    # Check database
    if docker-compose -f docker-compose.production.yml exec -T pm-app-db pg_isready -U pmapp_user -d pmapp; then
        log_success "Database is healthy"
    else
        log_error "Database health check failed"
    fi
    
    # Check application
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            log_success "Application is healthy and running on http://localhost:3000"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "Application health check failed"
    log_info "Check logs with: docker-compose -f docker-compose.production.yml logs pm-app"
}

# Show deployment info
show_info() {
    echo ""
    log_success "🎉 PM-App Production Deployment Complete!"
    echo ""
    echo "Services:"
    echo "  📱 Application: http://localhost:3000"
    echo "  🗄️  PostgreSQL: localhost:5432"
    echo "  🔴 Redis: localhost:6379"
    echo ""
    echo "Useful Commands:"
    echo "  View logs: docker-compose -f docker-compose.production.yml logs [service]"
    echo "  Stop services: docker-compose -f docker-compose.production.yml down"
    echo "  Update app: docker-compose -f docker-compose.production.yml up -d --build pm-app"
    echo "  Database backup: docker-compose -f docker-compose.production.yml exec pm-app-db pg_dump -U pmapp_user pmapp > backup.sql"
    echo ""
}

# Main execution
main() {
    check_requirements
    setup_env
    deploy
    check_health
    show_info
}

# Run deployment
main "$@"
