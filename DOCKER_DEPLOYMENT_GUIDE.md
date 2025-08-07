# PM-App Docker Deployment Guide

This guide provides comprehensive instructions for deploying PM-App using Docker containers, ensuring dependency isolation and conflict-free deployment.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available
- 2GB free disk space

### Option 1: Windows Users (Recommended)
```cmd
# Run the automated launcher
docker-launch.bat
```

### Option 2: Linux/Mac Users
```bash
# Make script executable and run
chmod +x docker-launch.sh
./docker-launch.sh
```

### Option 3: Manual Docker Commands
```bash
# Copy environment template
cp .env.docker .env

# Edit environment variables
nano .env  # or your preferred editor

# Build and run in production mode
docker-compose up -d

# Or run in development mode
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Deployment Modes

### Production Mode (Recommended)
- Optimized multi-stage build
- Nginx reverse proxy with caching
- Health checks and monitoring
- Automatic restarts
- Volume persistence

```bash
# Using launcher script
./docker-launch.sh -p

# Manual command
docker-compose up -d
```

**Accessible at:**
- Application: http://localhost:3000
- Nginx proxy: http://localhost:80

### Development Mode
- Hot reloading enabled
- Source code mounted as volume
- Development dependencies included
- Debug-friendly configuration

```bash
# Using launcher script
./docker-launch.sh -d

# Manual command
docker-compose -f docker-compose.dev.yml up -d
```

## 🔧 Configuration

### Environment Variables
Copy `.env.docker` to `.env` and configure:

**Required Variables:**
```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=file:./data/dev.db

# Authentication
NEXTAUTH_SECRET=your-secure-secret-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-here
```

**Optional API Integrations:**
```env
# OpenAI (for AI features)
OPENAI_API_KEY=your-openai-key
OPENAI_API_KEY_2=backup-key

# Google OAuth (for Gmail)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Volume Persistence
The following data is persisted across container restarts:
- Database: `pm-app-data` volume
- Logs: `pm-app-logs` volume  
- Uploads: `pm-app-uploads` volume

## 🛠️ Management Commands

### Using Launcher Scripts

**Windows (docker-launch.bat):**
- Interactive menu with options
- Automatic Docker checks
- Built-in troubleshooting

**Linux/Mac (docker-launch.sh):**
```bash
./docker-launch.sh --help           # Show all options
./docker-launch.sh -p               # Production mode
./docker-launch.sh -d               # Development mode
./docker-launch.sh -b -p            # Rebuild and run
./docker-launch.sh --logs           # View logs
./docker-launch.sh --status         # Container status
./docker-launch.sh --cleanup        # Clean up
```

### Manual Docker Commands

**Start services:**
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

**View logs:**
```bash
# Production
docker-compose logs -f pm-app

# Development  
docker-compose -f docker-compose.dev.yml logs -f pm-app-dev
```

**Stop services:**
```bash
# Production
docker-compose down

# Development
docker-compose -f docker-compose.dev.yml down
```

**Restart application:**
```bash
docker-compose restart pm-app
```

**Update application:**
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🏗️ Architecture

### Multi-Stage Build
1. **Builder stage:** Installs all dependencies, builds application
2. **Runtime stage:** Minimal production image with only necessary files

### Services
- **pm-app:** Main Next.js application with Socket.IO
- **nginx:** Reverse proxy with caching and rate limiting
- **db-backup:** Automated daily database backups (optional)

### Security Features
- Non-root user execution
- Security headers via Nginx
- Rate limiting
- Health checks
- Resource limits

## 🔍 Troubleshooting

### Common Issues

**Application won't start:**
```bash
# Check logs
docker-compose logs pm-app

# Verify environment
docker-compose exec pm-app env | grep -E "(NODE_ENV|DATABASE_URL)"

# Restart services
docker-compose restart
```

**Build fails:**
```bash
# Clean build cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Port conflicts:**
```bash
# Check what's using port 3000
netstat -tulpn | grep :3000

# Kill conflicting processes
sudo lsof -ti:3000 | xargs kill -9
```

**Database issues:**
```bash
# Reset database
docker-compose exec pm-app npx prisma db push --force-reset

# Check database file
docker-compose exec pm-app ls -la data/
```

**Memory issues:**
```bash
# Check container memory usage
docker stats

# Increase memory limits in docker-compose.yml
# deploy.resources.limits.memory: "2G"
```

### Health Checks
```bash
# Check application health
curl http://localhost:3000/api/health

# Check nginx health  
curl http://localhost:80/health

# Internal container health
docker-compose exec pm-app curl localhost:3000/api/health
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Application logs
docker-compose logs -f pm-app | grep -E "(ERROR|WARN)"

# Database performance
docker-compose exec pm-app du -sh data/dev.db
```

## 🔄 Updates and Maintenance

### Regular Updates
```bash
# Update source code
git pull origin master

# Rebuild and restart
./docker-launch.sh -b -p
```

### Database Backups
Automatic daily backups are created in `./backups/` directory:
```bash
# Manual backup
docker-compose exec pm-app cp data/dev.db /app/backups/manual-backup-$(date +%Y%m%d).db

# Restore from backup
docker-compose exec pm-app cp /app/backups/backup-20241201.db data/dev.db
docker-compose restart pm-app
```

### Log Management
```bash
# Rotate logs
docker-compose exec pm-app find logs -name "*.log" -size +100M -delete

# Archive old logs
docker-compose exec pm-app tar czf logs-archive-$(date +%Y%m%d).tar.gz logs/*.log
```

## 📊 Performance Optimization

### Resource Limits
Configured in `docker-compose.yml`:
- Memory: 1.5GB limit, 512MB reserved
- CPU: 1.0 limit, 0.5 reserved

### Nginx Optimizations
- Gzip compression enabled
- Static file caching
- Connection pooling
- Rate limiting

### Database Optimization
- SQLite with WAL mode
- Regular VACUUM operations
- Backup retention (7 days)

## 🚨 Production Deployment

For production deployment:

1. **Update environment variables:**
   - Set proper `NEXTAUTH_URL`
   - Configure real SMTP settings
   - Add SSL certificates to `./ssl/`

2. **Enable SSL in nginx.conf:**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
   }
   ```

3. **Use external database (optional):**
   ```env
   DATABASE_URL=postgresql://user:password@db-host:5432/pmapp
   ```

4. **Configure monitoring:**
   - Add health check endpoints
   - Set up log aggregation
   - Configure alerts

## ✅ Success Verification

After deployment, verify:
- [ ] Application loads at http://localhost:3000
- [ ] Health check responds: `curl http://localhost:3000/api/health`
- [ ] Database is accessible
- [ ] WebSocket connections work
- [ ] File uploads function
- [ ] API endpoints respond

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review container logs: `docker-compose logs`
3. Verify environment configuration
4. Test with minimal configuration
5. Check Docker resources and disk space

---

**🎯 Total setup time: 5-10 minutes for production deployment!**
