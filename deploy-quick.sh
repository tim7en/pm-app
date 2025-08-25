#!/bin/bash

# PM-App Quick Deployment Script
# For updating an existing production deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/opt/pm-app"
BACKUP_DIR="/opt/pm-app-backups"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if we're in the right directory
if [[ ! -f "docker-compose.caddy.yml" ]]; then
    error "docker-compose.caddy.yml not found. Please run this script from the PM-App directory."
fi

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
fi

log "Starting PM-App deployment..."

# Create backup before deployment
log "Creating backup..."
BACKUP_NAME="pm-app-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup current deployment
if docker-compose -f docker-compose.caddy.yml ps | grep -q "Up"; then
    docker-compose -f docker-compose.caddy.yml exec pm-app tar -czf "/tmp/$BACKUP_NAME.tar.gz" -C /app . 2>/dev/null || true
    docker cp $(docker-compose -f docker-compose.caddy.yml ps -q pm-app):/tmp/$BACKUP_NAME.tar.gz "$BACKUP_DIR/" 2>/dev/null || true
fi

# Pull latest images
log "Pulling latest Docker images..."
docker-compose -f docker-compose.caddy.yml pull

# Stop services gracefully
log "Stopping current services..."
docker-compose -f docker-compose.caddy.yml down --timeout 30

# Remove old containers and images
log "Cleaning up old containers..."
docker container prune -f
docker image prune -f

# Build and start services
log "Building and starting services..."
docker-compose -f docker-compose.caddy.yml up -d --build

# Wait for services to be ready
log "Waiting for services to start..."
sleep 30

# Health check
log "Performing health check..."
MAX_RETRIES=12
RETRY_COUNT=0

while [[ $RETRY_COUNT -lt $MAX_RETRIES ]]; do
    if curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log "✅ Application health check passed!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    warn "Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying in 10 seconds..."
    sleep 10
done

if [[ $RETRY_COUNT -eq $MAX_RETRIES ]]; then
    error "❌ Application failed health check after $MAX_RETRIES attempts"
fi

# Check Caddy status
log "Checking Caddy status..."
if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    log "✅ Caddy health check passed!"
else
    warn "⚠️  Caddy health check failed, but continuing..."
fi

# Show container status
log "Container status:"
docker-compose -f docker-compose.caddy.yml ps

# Show recent logs
log "Recent application logs:"
docker-compose -f docker-compose.caddy.yml logs --tail=20 pm-app

# Cleanup old backups (keep last 10)
log "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -type f | sort -r | tail -n +11 | xargs -r rm -f

log "🎉 Deployment completed successfully!"
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo -e "${BLUE}Application URL:${NC} https://198.163.207.39"
echo -e "${BLUE}Backup Created:${NC} $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo -e "${BLUE}View Logs:${NC} sudo docker-compose -f docker-compose.caddy.yml logs -f"
echo -e "${BLUE}Check Status:${NC} sudo docker-compose -f docker-compose.caddy.yml ps"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "- View all logs: sudo docker-compose -f docker-compose.caddy.yml logs -f"
echo "- Restart app: sudo docker-compose -f docker-compose.caddy.yml restart pm-app"
echo "- Check health: curl -f https://198.163.207.39/api/health"
echo "- Monitor resources: sudo docker stats"
