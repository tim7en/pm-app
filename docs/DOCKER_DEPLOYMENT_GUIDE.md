# Docker Deployment Guide for PM-App

This guide provides comprehensive instructions for deploying PM-App using Docker with external database separation for production use.

## Overview

The PM-App Docker deployment includes:
- **Main Application**: Next.js app running in a secure container
- **PostgreSQL Database**: Separate database container for data persistence
- **Redis Cache**: Optional caching layer for improved performance
- **Nginx Reverse Proxy**: Production-ready web server and SSL termination
- **Automated Backups**: Daily database backups with retention management

## Prerequisites

- Docker Engine 20.10+ 
- Docker Compose 2.0+
- At least 4GB RAM and 20GB disk space
- Domain name (for production) with SSL certificates

## Quick Start (Development)

1. **Clone and Setup**
```bash
git clone <repository-url>
cd pm-app
cp .env.docker.example .env.docker
cp .env.production.example .env.production
```

2. **Configure Environment**
Edit `.env.docker` and set secure passwords:
```bash
DB_PASSWORD=your_secure_database_password
REDIS_PASSWORD=your_secure_redis_password
APP_URL=http://localhost:3000
```

3. **Start Services**
```bash
# Development with SQLite (original setup)
docker-compose up -d

# Production with PostgreSQL (recommended)
docker-compose -f docker-compose.production.yml up -d
```

4. **Initialize Database**
```bash
# Wait for services to be ready, then run migrations
docker exec pm-app npm run db:migrate:deploy
```

5. **Access Application**
- App: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Production Deployment

### 1. Server Preparation

**System Requirements:**
- Ubuntu 20.04+ or similar Linux distribution
- 4GB+ RAM, 2+ CPU cores
- 50GB+ SSD storage
- Docker and Docker Compose installed

**Install Docker:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/pm-app
cd /opt/pm-app

# Clone repository
git clone <repository-url> .

# Create required directories
mkdir -p {backups,nginx/ssl,database/init}
```

### 3. Environment Configuration

**Configure Docker Environment:**
```bash
cp .env.docker.example .env.docker
sudo nano .env.docker
```

Set secure passwords:
```env
DB_PASSWORD=generate_a_very_secure_password_here
REDIS_PASSWORD=generate_another_secure_password_here
APP_URL=https://your-domain.com
BACKUP_RETENTION_DAYS=30
```

**Configure Application Environment:**
```bash
cp .env.production.example .env.production
sudo nano .env.production
```

Essential settings:
```env
NODE_ENV=production
APP_URL=https://your-domain.com
DATABASE_URL=postgresql://pmapp_user:your_db_password@pm-app-db:5432/pmapp
NEXTAUTH_SECRET=generate_a_long_random_secret_key
NEXTAUTH_URL=https://your-domain.com
```

### 4. SSL Certificate Setup

**Option A: Let's Encrypt (Recommended)**
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
```

**Option B: Self-signed (Development Only)**
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=your-domain.com"
```

### 5. Deploy Application

```bash
# Build and start services
docker-compose -f docker-compose.production.yml up -d --build

# Wait for database to be ready
docker-compose -f docker-compose.production.yml logs pm-app-db

# Run database migrations
docker exec pm-app npm run db:migrate:deploy

# Verify deployment
curl -f http://localhost/api/health
```

## Database Separation Benefits

The production setup separates the database from the application container:

1. **Data Persistence**: Database data survives app container updates
2. **Scalability**: Database can be scaled independently
3. **Backups**: Easier to backup and restore just the database
4. **Security**: Database access controlled through Docker network
5. **Performance**: Dedicated resources for database operations

## Management Commands

**View Logs:**
```bash
# All services
docker-compose -f docker-compose.production.yml logs

# Specific service
docker-compose -f docker-compose.production.yml logs pm-app
docker-compose -f docker-compose.production.yml logs pm-app-db
```

**Database Operations:**
```bash
# Connect to database
docker exec -it pm-app-postgres psql -U pmapp_user -d pmapp

# Run migrations
docker exec pm-app npm run db:migrate:deploy

# Generate Prisma client
docker exec pm-app npm run db:generate

# Reset database (development only)
docker exec pm-app npm run db:reset
```

**Backup and Restore:**
```bash
# Manual backup
docker exec pm-app-postgres pg_dump -U pmapp_user pmapp > backup.sql

# Restore from backup
docker exec -i pm-app-postgres psql -U pmapp_user -d pmapp < backup.sql

# View automatic backups
ls -la backups/
```

**Application Updates:**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart app
docker-compose -f docker-compose.production.yml up -d --build pm-app

# Run any new migrations
docker exec pm-app npm run db:migrate:deploy
```

## Monitoring and Maintenance

**Health Checks:**
```bash
# Check service status
docker-compose -f docker-compose.production.yml ps

# Health check endpoints
curl http://localhost/api/health
curl http://localhost/health  # Nginx health
```

**Resource Monitoring:**
```bash
# View resource usage
docker stats

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## Troubleshooting

**Common Issues:**

1. **Database Connection Errors**
   - Check if PostgreSQL container is running: `docker ps`
   - Verify environment variables in `.env.production`
   - Check database logs: `docker logs pm-app-postgres`

2. **SSL Certificate Issues**
   - Verify certificate files exist in `nginx/ssl/`
   - Check Nginx configuration syntax
   - Restart Nginx container

3. **Application Won't Start**
   - Check application logs: `docker logs pm-app`
   - Verify all environment variables are set
   - Ensure database migrations have run

4. **Performance Issues**
   - Monitor resource usage: `docker stats`
   - Check application logs for errors
   - Consider adding Redis caching

**Getting Help:**
- Check application logs for specific error messages
- Verify all environment variables are correctly set
- Ensure all required ports are available and not blocked by firewall

## Security Considerations

1. **Use Strong Passwords**: Generate secure passwords for database and Redis
2. **SSL/TLS**: Always use HTTPS in production
3. **Firewall**: Configure firewall to only allow necessary ports (80, 443)
4. **Updates**: Regularly update Docker images and host system
5. **Backups**: Test backup and restore procedures regularly
6. **Monitoring**: Set up log monitoring and alerting

## Scaling Considerations

For high-traffic deployments:

1. **Multiple App Instances**: Use Docker Swarm or Kubernetes
2. **Database Scaling**: Consider PostgreSQL read replicas
3. **Load Balancing**: Add multiple Nginx instances
4. **Caching**: Enable Redis for session storage and caching
5. **CDN**: Use a CDN for static assets

This deployment setup provides a robust, scalable foundation for running PM-App in production with proper database separation and security measures.
