# PM-App Production Deployment Guide

This guide covers deploying PM-App to production on Ubuntu 20.04 LTS with Docker, Caddy, and HTTPS.

## 🎯 Production Environment

- **Server**: Ubuntu 20.04 LTS
- **IP Address**: 198.163.207.39
- **Web Server**: Caddy (automatic HTTPS)
- **Container**: Docker + Docker Compose
- **Database**: External PostgreSQL (recommended)
- **SSL/TLS**: Automatic via Let's Encrypt

## 🚀 Quick Deployment

### Prerequisites

1. Ubuntu 20.04 LTS server with root access
2. External PostgreSQL database configured
3. Domain name pointed to 198.163.207.39 (optional, can use IP)

### Initial Setup

1. **Run the setup script** (as root):
```bash
sudo wget https://raw.githubusercontent.com/your-repo/pm-app/main/deploy-ubuntu-20.04.sh
sudo chmod +x deploy-ubuntu-20.04.sh
sudo ./deploy-ubuntu-20.04.sh
```

2. **Copy your application** to `/opt/pm-app`:
```bash
sudo git clone https://github.com/your-repo/pm-app.git /opt/pm-app
cd /opt/pm-app
```

3. **Configure environment** variables:
```bash
sudo nano /opt/pm-app/.env.production
```

Update the following variables:
```env
# Database Configuration (required)
DATABASE_URL=postgresql://username:password@your-db-host:5432/pmapp

# Security Secrets (generate new ones)
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-minimum-32-chars
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-chars

# Optional: Update other services
REDIS_PASSWORD=your-secure-redis-password
```

4. **Start the application**:
```bash
sudo systemctl start pm-app
sudo systemctl status pm-app
```

### Quick Updates

For subsequent deployments, use the quick deploy script:
```bash
cd /opt/pm-app
sudo ./deploy-quick.sh
```

## 🔧 Configuration Files

### Docker Compose

The application uses `docker-compose.caddy.yml` with:
- **pm-app**: Main Next.js application
- **caddy**: Reverse proxy with automatic HTTPS
- **redis**: Session storage and caching
- **healthcheck**: Monitoring service
- **log-rotator**: Log management

### Caddy Configuration

`Caddyfile` handles:
- Automatic HTTPS via Let's Encrypt
- HTTP to HTTPS redirects
- Security headers
- Rate limiting
- WebSocket support for real-time features
- Static asset caching

### Environment Variables

Key production environment variables:

```env
# Core Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# HTTPS Configuration
NEXTAUTH_URL=https://198.163.207.39
FORCE_HTTPS=true
TRUST_PROXY=true

# Security
ALLOWED_ORIGINS=https://198.163.207.39
CORS_ORIGIN=https://198.163.207.39

# Database (required)
DATABASE_URL=postgresql://username:password@host:5432/pmapp

# Authentication (generate new secrets)
NEXTAUTH_SECRET=your-secure-secret
JWT_SECRET=your-secure-secret
```

## 🗄️ Database Setup

### External PostgreSQL

1. **Create database and user**:
```sql
CREATE DATABASE pmapp;
CREATE USER pmapp_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE pmapp TO pmapp_user;
```

2. **Update connection string**:
```env
DATABASE_URL=postgresql://pmapp_user:secure_password@your-db-host:5432/pmapp?sslmode=require
```

3. **Run migrations** (first deployment):
```bash
cd /opt/pm-app
sudo docker-compose -f docker-compose.caddy.yml exec pm-app npx prisma migrate deploy
```

## 🔒 Security Features

### Firewall Configuration
- UFW enabled with ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- fail2ban configured for SSH and web protection

### SSL/TLS
- Automatic HTTPS via Caddy and Let's Encrypt
- HTTP/2 and HTTP/3 support
- Strong security headers
- HSTS enabled

### Container Security
- Non-root user in containers
- Read-only filesystem where possible
- Resource limits
- Security options enabled

## 📊 Monitoring & Maintenance

### Health Checks

Application health endpoint:
```bash
curl https://198.163.207.39/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "uptime": "5h 23m",
  "memory": {
    "rss": "145MB",
    "heapUsed": "89MB",
    "heapTotal": "123MB"
  },
  "database": "connected",
  "environment": "production"
}
```

### Log Management

View application logs:
```bash
sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml logs -f pm-app
```

View Caddy logs:
```bash
sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml logs -f caddy
```

Log files locations:
- Application: `/var/log/pm-app/`
- Caddy: Docker volume `caddy_logs`
- System: `/var/log/pm-app-deploy.log`

### Automated Backups

Backups run daily at 2 AM:
- Application files: `/opt/pm-app-backups/`
- Database: External (configure separately)
- Uploads: `/opt/pm-app-backups/`

Manual backup:
```bash
sudo /usr/local/bin/pm-app-backup.sh
```

### Monitoring

Health monitoring every 5 minutes:
```bash
sudo crontab -l  # View cron jobs
sudo tail -f /var/log/pm-app-monitor.log  # Monitor logs
```

## 🛠️ Management Commands

### Service Management
```bash
# Start/stop service
sudo systemctl start pm-app
sudo systemctl stop pm-app
sudo systemctl restart pm-app
sudo systemctl status pm-app

# Enable/disable auto-start
sudo systemctl enable pm-app
sudo systemctl disable pm-app
```

### Container Management
```bash
cd /opt/pm-app

# View status
sudo docker-compose -f docker-compose.caddy.yml ps

# View logs
sudo docker-compose -f docker-compose.caddy.yml logs -f

# Restart specific service
sudo docker-compose -f docker-compose.caddy.yml restart pm-app
sudo docker-compose -f docker-compose.caddy.yml restart caddy

# Update and restart
sudo docker-compose -f docker-compose.caddy.yml pull
sudo docker-compose -f docker-compose.caddy.yml up -d
```

### Resource Monitoring
```bash
# Container resource usage
sudo docker stats

# System resources
htop
df -h
free -h
```

## 🔧 Troubleshooting

### Common Issues

1. **Application won't start**:
   - Check environment variables: `sudo nano /opt/pm-app/.env.production`
   - Check database connectivity
   - View logs: `sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml logs pm-app`

2. **HTTPS not working**:
   - Ensure port 443 is open: `sudo ufw status`
   - Check Caddy logs: `sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml logs caddy`
   - Verify DNS points to 198.163.207.39

3. **Database connection issues**:
   - Test database connection from server
   - Check firewall rules on database server
   - Verify SSL requirements

4. **Performance issues**:
   - Check resource usage: `sudo docker stats`
   - Review application logs for errors
   - Monitor database performance

### Log Analysis
```bash
# Recent errors
sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml logs --tail=100 pm-app | grep -i error

# Connection issues
sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml logs caddy | grep -i "connection\|timeout"

# Health check failures
sudo tail -f /var/log/pm-app-monitor.log
```

## 📋 Maintenance Checklist

### Weekly
- [ ] Check application health
- [ ] Review logs for errors
- [ ] Monitor resource usage
- [ ] Verify backups are running

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Update Docker images: `sudo docker-compose -f /opt/pm-app/docker-compose.caddy.yml pull`
- [ ] Review and clean old logs
- [ ] Test backup restoration
- [ ] Review security logs

### Security Updates
- [ ] Monitor Ubuntu security updates
- [ ] Update Docker images regularly
- [ ] Review firewall rules
- [ ] Check SSL certificate expiration
- [ ] Audit user access

## 🆘 Emergency Procedures

### Rollback
```bash
cd /opt/pm-app
sudo docker-compose -f docker-compose.caddy.yml down
# Restore from backup
sudo tar -xzf /opt/pm-app-backups/pm-app-backup-YYYYMMDD_HHMMSS.tar.gz -C /opt/pm-app/
sudo docker-compose -f docker-compose.caddy.yml up -d
```

### Database Emergency
1. Stop application: `sudo systemctl stop pm-app`
2. Restore database from backup
3. Update DATABASE_URL if needed
4. Start application: `sudo systemctl start pm-app`

### Contact Information
- Server Admin: [Your Contact]
- Database Admin: [Your Contact]
- Emergency Contact: [Your Contact]

---

**🎉 Your PM-App is now production-ready on Ubuntu 20.04 LTS with HTTPS!**

Access your application at: **https://198.163.207.39**
