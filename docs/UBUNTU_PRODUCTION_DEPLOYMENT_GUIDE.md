# Ubuntu Production Deployment Guide for PM-App

## Overview
This comprehensive guide will walk you through deploying the PM-App on an Ubuntu virtual server with production-ready configuration, security best practices, and proper service orchestration.

## Server Information
- **Server IP**: 198.163.207.39
- **Operating System**: Ubuntu (assumed 20.04 LTS or newer)
- **Domain**: Will be configured during deployment
- **Port Configuration**: 3000 (application), 80/443 (web traffic)

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

### 1.1 Install Docker & Docker Compose

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

### 1.2 Install Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Enable Nginx service
sudo systemctl enable nginx
sudo systemctl start nginx

# Check Nginx status
sudo systemctl status nginx
```

### 1.3 Firewall Configuration

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

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/tim7en/pm-app.git .

# OR upload your code via SCP/SFTP if not using Git
```

### 2.2 Environment Configuration

```bash
# Create production environment file
cat > .env.production << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://pmapp_user:YOUR_SECURE_DB_PASSWORD@pm-app-db:5432/pmapp
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD

# Redis Configuration
REDIS_URL=redis://:YOUR_SECURE_REDIS_PASSWORD@pm-app-redis:6379
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
APP_URL=http://198.163.207.39

# NextAuth Configuration
NEXTAUTH_URL=http://198.163.207.39
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_32_CHARS_MIN

# Google OAuth (replace with your credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI Configuration (if using AI features)
OPENAI_API_KEY=your_openai_api_key

# Email Configuration (optional)
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EOF
```

### 2.3 Generate Secure Passwords and Update Configuration

```bash
# Generate secure passwords for production
echo "Database Password: $(openssl rand -base64 32)"
echo "Redis Password: $(openssl rand -base64 32)"
echo "NextAuth Secret: $(openssl rand -base64 32)"
echo "JWT Secret: $(openssl rand -base64 32)"

# Copy production environment template
cp .env.production .env.production.local

# Update .env.production.local with generated passwords and your actual values
nano .env.production.local

# Example content for .env.production.local:
cat > .env.production.local << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://pmapp_user:YOUR_SECURE_DB_PASSWORD@pm-app-db:5432/pmapp?schema=public"
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD

# Redis Configuration  
REDIS_URL="redis://:YOUR_SECURE_REDIS_PASSWORD@pm-app-redis:6379"
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# NextAuth Configuration
NEXTAUTH_URL=http://198.163.207.39
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_32_CHARS_MIN

# JWT Configuration
JWT_SECRET=YOUR_JWT_SECRET_32_CHARS_MIN

# Google OAuth (update with your credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI API Keys
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_KEY_2=your_backup_openai_api_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@198.163.207.39
EOF
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

### 3.4 Database Schema Setup (if needed)

```bash
# If Prisma migrations need to be run manually
docker compose -f docker-compose.production.yml exec pm-app npx prisma migrate deploy

# Or reset and seed database (only for fresh installations)
# docker compose -f docker-compose.production.yml exec pm-app npx prisma migrate reset --force
```

## Phase 4: Nginx Reverse Proxy Configuration

### 4.1 Create Nginx Configuration

```bash
# Create site configuration
sudo tee /etc/nginx/sites-available/pm-app << 'EOF'
server {
    listen 80;
    server_name 198.163.207.39;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Client upload limit
    client_max_body_size 100M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files (if served by Nginx)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }

    # Logs
    access_log /var/log/nginx/pm-app.access.log;
    error_log /var/log/nginx/pm-app.error.log;
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 4.2 SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# If you have a domain name, replace 198.163.207.39 with your domain
# For IP-only setup, you'll need to use self-signed certificates or skip HTTPS

# For domain-based SSL:
# sudo certbot --nginx -d yourdomain.com

# For IP-based setup, create self-signed certificate:
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/pm-app.key \
    -out /etc/ssl/certs/pm-app.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=198.163.207.39"

# Update Nginx config for HTTPS (optional)
sudo tee -a /etc/nginx/sites-available/pm-app << 'EOF'

server {
    listen 443 ssl;
    server_name 198.163.207.39;

    ssl_certificate /etc/ssl/certs/pm-app.crt;
    ssl_certificate_key /etc/ssl/private/pm-app.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Same configuration as HTTP server above
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
    }

    access_log /var/log/nginx/pm-app-ssl.access.log;
    error_log /var/log/nginx/pm-app-ssl.error.log;
}
EOF

# Restart Nginx
sudo systemctl restart nginx
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

### 5.2 Log Management

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

### 5.3 Monitoring Setup

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Create monitoring script
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
curl -s http://localhost:3000/api/health || echo "Health check failed"
echo
echo "=== System Resources ==="
free -h
df -h /
echo
echo "=== Network Connections ==="
ss -tlnp | grep :3000
ss -tlnp | grep :80
ss -tlnp | grep :443
EOF

chmod +x /opt/pm-app/monitor.sh

# Create cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/pm-app/monitor.sh >> /var/log/pm-app-monitor.log 2>&1") | crontab -
```

## Phase 6: Backup and Maintenance

### 6.1 Database Backup Setup

```bash
# Create backup directory
sudo mkdir -p /opt/backups/pm-app
sudo chown $USER:$USER /opt/backups/pm-app

# Create backup script
tee /opt/pm-app/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/pm-app"
DATE=$(date +%Y%m%d_%H%M%S)
DB_CONTAINER="pm-app-postgres"

echo "Starting backup at $(date)"

# Database backup
docker exec $DB_CONTAINER pg_dump -U pmapp_user pmapp > "$BACKUP_DIR/pmapp_backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/pmapp_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "pmapp_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed at $(date)"
EOF

chmod +x /opt/pm-app/backup.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/pm-app/backup.sh >> /var/log/pm-app-backup.log 2>&1") | crontab -
```

### 6.2 Update and Maintenance Scripts

```bash
# Create update script
tee /opt/pm-app/update.sh << 'EOF'
#!/bin/bash
echo "Starting PM-App update at $(date)"

cd /opt/pm-app

# Pull latest code (if using Git)
git pull origin main

# Backup before update
./backup.sh

# Stop application
docker compose -f docker-compose.production.yml stop pm-app

# Rebuild and start
docker compose -f docker-compose.production.yml up -d --build pm-app

# Wait for application to start
sleep 30

# Check health
curl -f http://localhost:3000/api/health && echo "Update successful" || echo "Update failed - check logs"

echo "Update completed at $(date)"
EOF

chmod +x /opt/pm-app/update.sh
```

## Phase 7: Testing and Validation

### 7.1 Application Testing

```bash
# Test application accessibility
curl -I http://198.163.207.39

# Test API endpoints
curl http://198.163.207.39/api/health

# Check Docker services
docker compose -f docker-compose.production.yml ps

# Check logs for errors
docker compose -f docker-compose.production.yml logs --tail=50 pm-app
```

### 7.2 Database Testing

```bash
# Test database connection
docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "SELECT version();"

# Check database size and tables
docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "\\dt"
```

### 7.3 Performance Testing

```bash
# Install Apache Bench for load testing
sudo apt install -y apache2-utils

# Basic load test (adjust as needed)
ab -n 100 -c 10 http://198.163.207.39/

# Monitor during test
htop
```

## Phase 8: Post-Deployment Configuration

### 8.1 Domain Setup (if applicable)

```bash
# If you have a domain name:
# 1. Update DNS A record to point to 198.163.207.39
# 2. Update .env.production with your domain
# 3. Update Nginx configuration
# 4. Install SSL certificate with certbot
```

### 8.2 Environment Variables Update

```bash
# Update APP_URL and NEXTAUTH_URL if using domain
sed -i 's|APP_URL=http://198.163.207.39|APP_URL=https://yourdomain.com|g' .env.production
sed -i 's|NEXTAUTH_URL=http://198.163.207.39|NEXTAUTH_URL=https://yourdomain.com|g' .env.production

# Restart application to apply changes
docker compose -f docker-compose.production.yml restart pm-app
```

## Troubleshooting Guide

### Common Issues and Solutions

1. **Application won't start:**
   ```bash
   # Check logs
   docker compose -f docker-compose.production.yml logs pm-app
   
   # Check environment variables
   docker compose -f docker-compose.production.yml exec pm-app env | grep -E '(DATABASE_URL|NODE_ENV)'
   ```

2. **Database connection issues:**
   ```bash
   # Check database is running
   docker compose -f docker-compose.production.yml ps pm-app-db
   
   # Test database connection
   docker compose -f docker-compose.production.yml exec pm-app-db psql -U pmapp_user -d pmapp -c "SELECT 1;"
   ```

3. **High memory usage:**
   ```bash
   # Check container resources
   docker stats
   
   # Adjust memory limits in docker-compose.production.yml if needed
   ```

4. **SSL certificate issues:**
   ```bash
   # Check certificate validity
   openssl x509 -in /etc/ssl/certs/pm-app.crt -text -noout
   
   # Restart Nginx
   sudo systemctl restart nginx
   ```

### Emergency Recovery

```bash
# Stop all services
docker compose -f docker-compose.production.yml down

# Restore from backup
gunzip /opt/backups/pm-app/pmapp_backup_YYYYMMDD_HHMMSS.sql.gz
docker compose -f docker-compose.production.yml up -d pm-app-db
sleep 30
docker exec -i pm-app-postgres psql -U pmapp_user -d pmapp < /opt/backups/pm-app/pmapp_backup_YYYYMMDD_HHMMSS.sql

# Restart all services
docker compose -f docker-compose.production.yml up -d
```

## Maintenance Schedule

### Daily Tasks (Automated)
- Database backups (2:00 AM)
- Health monitoring (every 5 minutes)
- Log rotation

### Weekly Tasks
- Check backup integrity
- Review error logs
- Update system packages
- Monitor disk usage

### Monthly Tasks
- Security updates
- SSL certificate renewal (if using Let's Encrypt)
- Performance review
- Backup cleanup

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication (disable password auth)
- [ ] Regular security updates
- [ ] Fail2ban configured
- [ ] Strong passwords for all services
- [ ] SSL/TLS encryption
- [ ] Database access restricted to application
- [ ] Regular backups tested
- [ ] Log monitoring in place
- [ ] Non-root user for applications

## Performance Optimization

### Docker Optimizations
```bash
# Adjust Docker resources based on your server specs
# Edit docker-compose.production.yml memory and CPU limits

# Clean up Docker system periodically
docker system prune -f
docker volume prune -f
```

### Nginx Optimizations
```bash
# Add to Nginx configuration for better performance
# worker_processes auto;
# worker_connections 1024;
# keepalive_timeout 65;
# gzip on;
# gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

## Contact and Support

After deployment, your PM-App will be accessible at:
- **HTTP**: http://198.163.207.39
- **HTTPS**: https://198.163.207.39 (if SSL configured)

For ongoing support:
1. Monitor `/var/log/pm-app-monitor.log` for system status
2. Check application logs with `docker compose logs`
3. Use the monitoring script: `/opt/pm-app/monitor.sh`

## Conclusion

This guide provides a comprehensive production deployment for your PM-App on Ubuntu. The setup includes:

✅ **Infrastructure**: Docker, Nginx, PostgreSQL, Redis  
✅ **Security**: Firewall, SSL, fail2ban, secure passwords  
✅ **Monitoring**: Health checks, logging, automated backups  
✅ **Maintenance**: Update scripts, backup rotation, performance monitoring  

Your application should now be running securely and efficiently in production!
