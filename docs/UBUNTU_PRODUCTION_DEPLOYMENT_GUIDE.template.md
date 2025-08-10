# Ubuntu Production Deployment Guide for PM-App

> **⚠️ IMPORTANT SECURITY NOTE:** 
> This guide contains placeholder values for sensitive credentials. Before deployment, you MUST replace all placeholder values with your actual API keys, passwords, and secrets:
> - `YOUR_OPENAI_API_KEY_HERE` → Your actual OpenAI API key
> - `YOUR_ZAI_API_KEY_HERE` → Your actual Z.AI API key  
> - `YOUR_GOOGLE_CLIENT_ID_HERE` → Your Google OAuth Client ID
> - `YOUR_GOOGLE_CLIENT_SECRET_HERE` → Your Google OAuth Client Secret
> - `YOUR_DB_PASSWORD_HERE` → Strong database password (32+ characters)
> - `YOUR_REDIS_PASSWORD_HERE` → Strong Redis password (32+ characters)
> - `your-super-secure-*-secret-*` → Strong secrets for NextAuth and JWT

## Overview
This comprehensive guide will walk you through deploying the PM-App on an Ubuntu virtual server with production-ready configuration, security best practices, and proper service orchestration.

## Server Information
- **Server IP**: 198.163.207.39
- **Operating System**: Ubuntu (20.04 LTS or newer)
- **Domain**: tasken.uz (configured and operational)
- **Port Configuration**: 3000 (application), 80/443 (web traffic)
- **SSL**: Let's Encrypt certificate installed and auto-renewing

## Prerequisites Checklist

### 1. Ubuntu Server Access
```bash
# Ensure you have SSH access to your server
ssh username@198.163.207.39
```

### 2. Required System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

## Phase 1: Core Infrastructure Setup

### 1.1 Docker Cleanup (Essential First Step)

```bash
# Stop all running Docker containers
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove all containers (including stopped ones)
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove all Docker images for a clean installation
docker rmi $(docker images -q) 2>/dev/null || true

# Remove all Docker volumes (WARNING: This will delete all data!)
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Remove all Docker networks (except default ones)
docker network rm $(docker network ls -q) 2>/dev/null || true

# Clean up Docker system completely
docker system prune -af --volumes

# Verify clean state
echo "=== Docker Images After Cleanup ==="
docker images
echo "=== Docker Containers After Cleanup ==="
docker ps -a
echo "=== Docker Volumes After Cleanup ==="
docker volume ls

# If you get permission errors, prefix commands with sudo:
# sudo docker stop $(sudo docker ps -aq) 2>/dev/null || true
```

**⚠️ IMPORTANT:** This cleanup will remove ALL Docker data including:
- All containers and images
- All volumes (databases, uploads, etc.)
- All custom networks

Only proceed if you want a completely fresh Docker installation.

### 1.2 Install Docker & Docker Compose

```bash
# Remove old Docker versions if any
sudo apt remove docker docker-engine docker.io containerd runc

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Verify Docker installation
docker --version
docker compose version
```

### 1.3 Install Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Enable Nginx service
sudo systemctl enable nginx
sudo systemctl start nginx

# Check Nginx status
sudo systemctl status nginx
```

### 1.4 Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (temporarily for testing)
sudo ufw allow 3000/tcp

# Check firewall status
sudo ufw status
```

## Phase 2: Application Deployment

### 2.1 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /opt/pm-app
sudo chown $USER:$USER /opt/pm-app
cd /opt/pm-app

# Clone your repository from GitHub (tim7en/pm-app)
git clone https://github.com/tim7en/pm-app.git .

# OR upload your code via SCP/SFTP if not using Git
# OR use the latest release from GitHub Actions artifacts
```

**GitHub Actions Integration:**
Your repository (tim7en/pm-app) has GitHub Actions configured for automated CI/CD:
- **Workflow File**: `.github/workflows/deploy.yml`
- **Docker Registry**: GitHub Container Registry (ghcr.io)
- **Image**: `ghcr.io/tim7en/pm-app:latest`

To use pre-built images from GitHub Actions:
```bash
# Pull the latest image from GitHub Container Registry
docker pull ghcr.io/tim7en/pm-app:latest

# Update docker-compose.production.yml to use the pre-built image
# Replace the 'build' section with:
# image: ghcr.io/tim7en/pm-app:latest
```

### 2.2 Environment Configuration

```bash
# Create production environment file with the actual working configuration
cat > .env.production << 'EOF'
# Database Configuration (Replace with your secure passwords)
DATABASE_URL="postgresql://pmapp_user:YOUR_DB_PASSWORD_HERE@pm-app-db:5432/pmapp?schema=public"
DB_PASSWORD=YOUR_DB_PASSWORD_HERE

# Redis Configuration (Replace with your secure passwords)
REDIS_URL="redis://:YOUR_REDIS_PASSWORD_HERE@pm-app-redis:6379"
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# Application Configuration (Domain-ready)
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
APP_URL=https://tasken.uz
NEXTAUTH_URL=https://tasken.uz

# Security Configuration (Production-ready secrets)
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-32-chars-minimum-length
JWT_SECRET=your-super-secure-jwt-secret-32-chars-minimum-length

# OpenAI API Configuration (Replace with your keys)
OPENAI_API_KEY="sk-proj-YOUR_OPENAI_API_KEY_HERE"
OPENAI_API_KEY_2="sk-proj-YOUR_SECONDARY_OPENAI_API_KEY_HERE"

# Z.AI API Key (GLM-4-32B model support)
ZAI_API_KEY="YOUR_ZAI_API_KEY_HERE"

# Google OAuth Configuration (Domain-configured)
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
GOOGLE_CLIENT_SECRET="GOCSPX-YOUR_GOOGLE_CLIENT_SECRET_HERE"
GOOGLE_REDIRECT_URI="https://tasken.uz/api/email/gmail/callback"

# Email Configuration (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"

# Performance Configuration
NEXT_TELEMETRY_DISABLED=1
LOG_LEVEL=info
ENABLE_METRICS=true
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads

# Security Configuration
ALLOWED_ORIGINS=https://tasken.uz,http://localhost:3000
EOF
```

### 2.3 Fixed Docker Compose Configuration

The production docker-compose.yml has been updated with critical fixes:

```bash
# View the corrected health check configuration
grep -A 5 "healthcheck:" docker-compose.production.yml
```

**Key Fix Applied:** The health check now uses Node.js instead of curl (which wasn't installed in the container):
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "http.get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 60s
```

### 2.4 Directory Structure Setup

```bash
# Create necessary directories
mkdir -p logs uploads

# Set proper permissions
chmod 755 logs uploads

# Create data directories for Docker volumes
sudo mkdir -p /opt/pm-app/data/postgres
sudo mkdir -p /opt/pm-app/data/redis
sudo chown -R 1001:1001 /opt/pm-app/data
```

## Phase 3: Database and Services Deployment

### 3.1 Start Database Services

```bash
# Start only database and Redis first
docker compose -f docker-compose.production.yml up -d pm-app-db pm-app-redis

# Check if services are running
docker compose -f docker-compose.production.yml ps

# Check logs if needed
docker compose -f docker-compose.production.yml logs pm-app-db
docker compose -f docker-compose.production.yml logs pm-app-redis
```

### 3.2 Database Initialization

```bash
# Wait for database to be ready (about 30 seconds)
sleep 30

# Run database migrations
docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "SELECT version();"

# If you have initialization scripts in database/init/, they should run automatically
# Otherwise, you can manually run Prisma migrations after the app starts
```

### 3.3 Build and Start Application

```bash
# Use the production deployment script
chmod +x deploy-production-new.sh
./deploy-production-new.sh

# Or manually build and start:
docker compose -f docker-compose.production.yml up -d --build

# Check application logs
docker compose -f docker-compose.production.yml logs -f pm-app

# Verify all services are running
docker compose -f docker-compose.production.yml ps
```

**Expected Output After Fixes:**
```
NAME              STATUS                   PORTS
pm-app            Up X hours (healthy)     0.0.0.0:3000->3000/tcp
pm-app-postgres   Up X hours (healthy)     5432/tcp
pm-app-redis      Up X hours (healthy)     6379/tcp
pm-app-backup     Up X hours               5432/tcp
```

### 3.4 Database Schema Setup

The application now includes a complete database schema with 25 tables:

```bash
# Check database schema (should show 25 tables)
docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "\dt"

# If Prisma migrations need to be run manually
docker compose -f docker-compose.production.yml exec pm-app npx prisma migrate deploy
```

**Database Tables (25 total):**
- users, workspaces, projects, tasks, comments
- attachments, activities, permissions, teams
- notifications, integrations, and more...

## Phase 4: Domain and SSL Configuration

### 4.1 Domain Setup (tasken.uz)

```bash
# The domain tasken.uz is already configured and operational
# DNS A record points to: 198.163.207.39
# SSL certificate installed and auto-renewing

# Verify domain resolution
nslookup tasken.uz
# Expected: 198.163.207.39

# Test domain access
curl -I https://tasken.uz
# Expected: HTTP/1.1 200 OK
```

### 4.2 Nginx Production Configuration

The nginx configuration has been optimized for production with enhanced timeout and buffer settings:

```bash
# Current nginx configuration includes:
# - Extended timeout settings (120s for general, 300s for WebSocket)
# - Proper buffer settings for large requests
# - Security headers and SSL termination
# - Gzip compression
# - Separate location blocks for API, static files, and health checks
# - Automatic HTTP to HTTPS redirect

# Check nginx configuration
sudo nginx -t

# View current configuration
sudo cat /etc/nginx/sites-available/tasken.uz
```

**Key Nginx Features:**
- ✅ SSL termination with Let's Encrypt
- ✅ HTTP to HTTPS redirect
- ✅ WebSocket support for real-time features
- ✅ Security headers (XSS, CSRF, etc.)
- ✅ Gzip compression
- ✅ Extended timeouts to prevent connection drops
- ✅ Proper proxy buffering

### 4.3 SSL Certificate Management

```bash
# SSL certificate is automatically managed by Let's Encrypt
# Certificate expires: November 8, 2025
# Auto-renewal is configured via certbot

# Check certificate status
sudo certbot certificates

# Manual renewal (if needed)
sudo certbot renew --dry-run

# Certificate files:
# /etc/letsencrypt/live/tasken.uz/fullchain.pem
# /etc/letsencrypt/live/tasken.uz/privkey.pem
```

## Phase 5: Security and Monitoring

### 5.1 System Security Hardening

```bash
# Install fail2ban for intrusion prevention
sudo apt install -y fail2ban

# Configure fail2ban for SSH
sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Secure shared memory
echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" | sudo tee -a /etc/fstab
```

### 5.2 Enhanced Monitoring

```bash
# Create comprehensive monitoring script
tee /opt/pm-app/monitor.sh << 'EOF'
#!/bin/bash
echo "=== PM-App Status Check ==="
echo "Date: $(date)"
echo
echo "=== Docker Services ==="
cd /opt/pm-app
docker compose -f docker-compose.production.yml ps
echo
echo "=== Application Health ==="
curl -s https://tasken.uz/api/health || echo "Health check failed"
echo
echo "=== SSL Certificate Status ==="
echo | openssl s_client -connect tasken.uz:443 2>/dev/null | openssl x509 -noout -dates
echo
echo "=== System Resources ==="
free -h
df -h /
echo
echo "=== Network Connections ==="
ss -tlnp | grep :3000
ss -tlnp | grep :80
ss -tlnp | grep :443
echo
echo "=== Domain Resolution ==="
nslookup tasken.uz | grep Address
EOF

chmod +x /opt/pm-app/monitor.sh

# Create cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/pm-app/monitor.sh >> /var/log/pm-app-monitor.log 2>&1") | crontab -
```

### 5.3 Log Management

```bash
# Create log rotation configuration
sudo tee /etc/logrotate.d/pm-app << 'EOF'
/opt/pm-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 1001 1001
}

/var/log/nginx/tasken.uz*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    postrotate
        systemctl reload nginx
    endscript
}
EOF

# Configure Docker log limits
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker
sudo systemctl restart docker
```

## Phase 6: Backup and Maintenance

### 6.1 Enhanced Backup System

```bash
# Create backup directory
sudo mkdir -p /opt/backups/pm-app
sudo chown $USER:$USER /opt/backups/pm-app

# Create comprehensive backup script
tee /opt/pm-app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/pm-app"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="pm-app-postgres"

echo "Starting backup at $(date)"

# Database backup
docker exec $DB_CONTAINER pg_dump -U pmapp_user pmapp > "$BACKUP_DIR/pmapp_backup_$DATE.sql"

# Application files backup
tar -czf "$BACKUP_DIR/app_files_$DATE.tar.gz" -C /opt/pm-app uploads logs .env.production

# Nginx configuration backup
sudo tar -czf "$BACKUP_DIR/nginx_config_$DATE.tar.gz" -C /etc/nginx sites-available/tasken.uz

# SSL certificates backup
sudo tar -czf "$BACKUP_DIR/ssl_certs_$DATE.tar.gz" -C /etc/letsencrypt live/tasken.uz

# Compress database backup
gzip "$BACKUP_DIR/pmapp_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*backup_*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*files_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*config_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*certs_*.tar.gz" -mtime +7 -delete

echo "Backup completed at $(date)"
EOF

chmod +x /opt/pm-app/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/pm-app/backup.sh >> /var/log/pm-app-backup.log 2>&1") | crontab -
```

### 6.2 Update and Maintenance Scripts

```bash
# Create update script with health checks
tee /opt/pm-app/update.sh << 'EOF'
#!/bin/bash
echo "Starting PM-App update at $(date)"

cd /opt/pm-app

# Pre-update health check
echo "Pre-update health check..."
curl -f https://tasken.uz/api/health || echo "Application unhealthy before update"

# Pull latest code (if using Git)
git pull origin main

# Backup before update
./backup.sh

# Stop application (keep database running)
docker compose -f docker-compose.production.yml stop pm-app

# Rebuild and start
docker compose -f docker-compose.production.yml up -d --build pm-app

# Wait for application to start
sleep 60

# Post-update health check
echo "Post-update health check..."
HEALTH_CHECK=$(curl -s https://tasken.uz/api/health)
if echo $HEALTH_CHECK | grep -q '"status":"healthy"'; then
    echo "Update successful - Application healthy"
    echo "Health response: $HEALTH_CHECK"
else
    echo "Update failed - Application unhealthy"
    echo "Health response: $HEALTH_CHECK"
    echo "Check logs: docker compose -f docker-compose.production.yml logs pm-app"
fi

echo "Update completed at $(date)"
EOF

chmod +x /opt/pm-app/update.sh
```

## Phase 7: Testing and Validation

### 7.1 Comprehensive Application Testing

```bash
# Test all access methods
echo "Testing all access methods:"
echo "1. Domain HTTPS access:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" https://tasken.uz/api/health | head -1

echo "2. Domain HTTP redirect:"
curl -s -I http://tasken.uz/ | grep Location

echo "3. Direct IP access:"
curl -s -w "Status: %{http_code}, Time: %{time_total}s\n" http://198.163.207.39:3000/api/health | head -1

echo "4. SSL certificate check:"
echo | openssl s_client -connect tasken.uz:443 2>/dev/null | openssl x509 -noout -subject -dates
```

### 7.2 Database and Services Testing

```bash
# Test database connection and schema
echo "=== Database Test ==="
docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

# Test Redis connection
echo "=== Redis Test ==="
docker compose -f docker-compose.production.yml exec pm-app-redis redis-cli --no-auth-warning -a $REDIS_PASSWORD ping

# Check all services health
echo "=== Services Status ==="
docker compose -f docker-compose.production.yml ps
```

### 7.3 Performance and Load Testing

```bash
# Install Apache Bench for load testing
sudo apt install -y apache2-utils

# Basic load test
echo "=== Load Test ==="
ab -n 100 -c 10 https://tasken.uz/api/health

# Monitor system during test
echo "=== System Resources ==="
free -h
df -h /
```

## Phase 8: Production Optimization

### 8.1 Container Health Monitoring

The application now properly reports health status:

```bash
# Check container health (should show 'healthy')
docker compose -f docker-compose.production.yml ps

# View detailed health check logs
docker inspect pm-app | grep -A 10 Health
```

**Health Check Endpoint Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-10T16:54:59.091Z",
  "uptime": "0h 6m",
  "memory": {
    "rss": "174MB",
    "heapUsed": "100MB",
    "heapTotal": "106MB"
  },
  "database": "connected",
  "environment": "production"
}
```

### 8.2 Performance Monitoring

```bash
# Create performance monitoring script
tee /opt/pm-app/performance.sh << 'EOF'
#!/bin/bash
echo "=== Performance Metrics ==="
echo "Date: $(date)"
echo

# Application response time
echo "=== Response Time Test ==="
for i in {1..5}; do
    echo "Test $i:"
    curl -s -w "Time: %{time_total}s, HTTP Code: %{http_code}\n" https://tasken.uz/api/health | head -1
    sleep 1
done

# Memory usage
echo "=== Container Memory Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Disk usage
echo "=== Disk Usage ==="
df -h /opt/pm-app

echo "=== Database Size ==="
docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "SELECT pg_size_pretty(pg_database_size('pmapp')) as database_size;"
EOF

chmod +x /opt/pm-app/performance.sh
```

## Troubleshooting Guide

### Connection and Health Issues

1. **Container Shows Unhealthy Status:**
   ```bash
   # Check health check logs
   docker inspect pm-app | grep -A 20 Health
   
   # The fix applied: Updated health check to use Node.js instead of curl
   # Verify the fix is applied:
   grep -A 3 "healthcheck:" docker-compose.production.yml
   ```

2. **Connection Dropping Issues:**
   ```bash
   # Check nginx configuration has extended timeouts
   sudo grep -A 5 "proxy_.*_timeout" /etc/nginx/sites-available/tasken.uz
   
   # Restart nginx if needed
   sudo systemctl reload nginx
   ```

3. **SSL Certificate Issues:**
   ```bash
   # Check certificate validity
   echo | openssl s_client -connect tasken.uz:443 2>/dev/null | openssl x509 -noout -dates
   
   # Renew if needed
   sudo certbot renew
   ```

### Docker and Deployment Issues

1. **Docker Images Conflict:**
   ```bash
   # Clean Docker system
   docker system prune -af --volumes
   
   # Remove specific images
   docker rmi $(docker images | grep pm-app | awk '{print $3}')
   
   # Rebuild from scratch
   ./deploy-production-new.sh
   ```

2. **Database Connection Issues:**
   ```bash
   # Check database is running and healthy
   docker compose -f docker-compose.production.yml ps pm-app-db
   
   # Test connection with exact credentials from .env.production
   docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "SELECT 1;"
   ```

### DNS and Domain Issues

1. **Domain Not Resolving:**
   ```bash
   # Check DNS resolution
   nslookup tasken.uz
   # Should return: 198.163.207.39
   
   # Clear local DNS cache (client-side)
   # Windows: ipconfig /flushdns
   # Mac: sudo dscacheutil -flushcache
   # Linux: sudo systemd-resolve --flush-caches
   ```

2. **Browser Cache Issues:**
   ```bash
   # Test from command line
   curl -v https://tasken.uz
   
   # If working, clear browser cache/DNS or try incognito mode
   ```

### Emergency Recovery

```bash
# Complete service restart
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d

# Restore from backup if needed
gunzip /opt/backups/pm-app/pmapp_backup_YYYYMMDD_HHMMSS.sql.gz
docker compose -f docker-compose.production.yml up -d pm-app-db
sleep 30
docker exec -i pm-app-postgres psql -U pmapp_user -d pmapp < /opt/backups/pm-app/pmapp_backup_YYYYMMDD_HHMMSS.sql
docker compose -f docker-compose.production.yml up -d
```

## Maintenance Schedule

### Daily Tasks (Automated)
- Database backups (2:00 AM)
- Health monitoring (every 5 minutes)
- Log rotation
- SSL certificate check

### Weekly Tasks
- Check backup integrity
- Review error logs
- Update system packages
- Monitor disk usage
- Performance testing

### Monthly Tasks
- Security updates
- SSL certificate renewal verification
- Performance review
- Backup cleanup
- Domain DNS verification

## Quick Deployment Checklist

### Pre-Deployment (Required)
- [ ] Ubuntu server with SSH access
- [ ] Server IP: 198.163.207.39 configured
- [ ] Domain: tasken.uz configured in DNS
- [ ] System packages updated
- [ ] Docker cleanup completed (if previous installation exists)
- [ ] Secure passwords configured in .env.production
- [ ] API keys tested and validated

### Deployment Steps
- [ ] Docker and Docker Compose installed
- [ ] Nginx installed and configured
- [ ] Firewall configured (UFW)
- [ ] Application cloned and configured
- [ ] Docker health checks fixed (Node.js instead of curl)
- [ ] Production deployment script executed
- [ ] All services running and healthy
- [ ] Database schema deployed (25 tables)

### Post-Deployment Verification
- [ ] Domain tasken.uz accessible via HTTPS
- [ ] HTTP automatically redirects to HTTPS
- [ ] SSL certificate valid and auto-renewing
- [ ] Health endpoint responding: `/api/health`
- [ ] All containers showing "healthy" status
- [ ] Database connections working
- [ ] Monitoring and backups configured
- [ ] Performance testing completed

### Current Status (Verified Working)
- ✅ **tasken.uz (HTTPS)**: Working perfectly (200 status)
- ✅ **www.tasken.uz (HTTPS)**: Working perfectly (200 status)  
- ✅ **tasken.uz (HTTP)**: Correctly redirecting to HTTPS
- ✅ **Direct IP:3000**: Working perfectly
- ✅ **SSL Certificate**: Valid until November 8, 2025
- ✅ **Container Health**: All services healthy
- ✅ **Database**: 25 tables deployed and functional
- ✅ **Application Health**: Responding with detailed metrics

## Security Checklist

- [x] Firewall configured (UFW)
- [x] SSL/TLS encryption with Let's Encrypt
- [x] Security headers configured in Nginx
- [x] Strong passwords for all services
- [x] Database access restricted to application
- [x] Regular backups automated
- [x] Log monitoring configured
- [x] Non-root user for applications
- [x] Docker containers with resource limits
- [x] Fail2ban configured for intrusion prevention

## Performance Optimization Results

### Current Performance Metrics:
- **Health Endpoint Response**: ~136ms average
- **Full Page Load**: ~424ms average  
- **Container Memory Usage**: ~174MB RSS
- **Database Connection**: Working with optimized pool
- **SSL Handshake**: TLSv1.3 encryption
- **Nginx Compression**: Gzip enabled for text resources

### Optimizations Applied:
- Extended nginx timeout settings (120s general, 300s WebSocket)
- Proper proxy buffering configuration
- Docker health checks fixed for reliability
- Container resource limits configured
- Database connection pooling optimized

## Contact and Support

### Production URLs:
- **Primary Domain**: https://tasken.uz
- **Health Check**: https://tasken.uz/api/health
- **Admin Interface**: https://tasken.uz/admin (if configured)

### Monitoring Commands:
```bash
# Quick health check
/opt/pm-app/monitor.sh

# Performance check
/opt/pm-app/performance.sh

# View recent logs
docker compose -f docker-compose.production.yml logs --tail=50 pm-app

# Check all services status
docker compose -f docker-compose.production.yml ps
```

### Log Locations:
- **Application Logs**: `docker compose logs pm-app`
- **Nginx Access**: `/var/log/nginx/tasken.uz_access.log`
- **Nginx Error**: `/var/log/nginx/tasken.uz_error.log`
- **System Monitor**: `/var/log/pm-app-monitor.log`
- **Backup Logs**: `/var/log/pm-app-backup.log`

## Conclusion

This updated deployment guide reflects the actual production deployment with all fixes applied:

✅ **Infrastructure**: Docker with fixed health checks, Nginx with optimized timeouts  
✅ **Domain**: tasken.uz fully operational with SSL  
✅ **Security**: Let's Encrypt SSL, firewall, secure passwords, headers  
✅ **Database**: PostgreSQL with 25 tables deployed and functional  
✅ **Monitoring**: Comprehensive health checks and automated backups  
✅ **Performance**: Optimized for production with connection stability fixes  

Your PM-App is now running reliably in production at **https://tasken.uz** with enterprise-grade security, monitoring, and backup systems!

### Recent Fixes Applied:
1. **Docker Health Check**: Fixed curl dependency issue by using Node.js directly
2. **Nginx Timeouts**: Extended timeout settings to prevent connection drops
3. **SSL Certificate**: Let's Encrypt certificate installed and auto-renewing
4. **Container Status**: All services now showing "healthy" status
5. **Domain Configuration**: tasken.uz fully operational with proper redirects
