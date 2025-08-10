# Ubuntu Production Deployment Guide for PM-App

## Overview
This comprehensive guide will walk you through deploying the PM-App on an Ubuntu virtual server with production-ready configuration, security best practices, and proper service orchestration.

## Server Information
- **Server IP**: YOUR_SERVER_IP
- **Operating System**: Ubuntu (20.04 LTS or newer recommended)
- **Domain**: Will be configured during deployment
- **Port Configuration**: 3000 (application), 80/443 (web traffic)

## Prerequisites Checklist

### 1. Ubuntu Server Access
```bash
# Ensure you have SSH access to your server
ssh username@YOUR_SERVER_IP
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
APP_URL=http://YOUR_SERVER_IP

# NextAuth Configuration
NEXTAUTH_URL=http://YOUR_SERVER_IP
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
# Option 1: Generate secure passwords automatically (RECOMMENDED)
echo "=== GENERATED SECURE PASSWORDS ==="
echo "Database Password: $(openssl rand -base64 32)"
echo "Redis Password: $(openssl rand -base64 32)"
echo "NextAuth Secret: $(openssl rand -base64 32)"
echo "JWT Secret: $(openssl rand -base64 32)"
echo "=================================="
echo "SAVE THESE PASSWORDS! You'll need them for the configuration."
echo ""

# Option 2: Use manual passwords (if you prefer)
# You can use any secure passwords you want, but they should be:
# - At least 32 characters long
# - Include uppercase, lowercase, numbers, and special characters
# - Be unique for each service

# Copy production environment template
cp .env.production .env.production.local

# Update .env.production.local with your actual configuration
nano .env.production.local
```

### 2.4 Production Environment Configuration

Create your production environment file with the following configuration:

```bash
# Create .env.production.local with your actual values
cat > .env.production.local << 'EOF'
# Database Configuration (use generated password or your own secure password)
DATABASE_URL="postgresql://pmapp_user:YOUR_SECURE_DB_PASSWORD@pm-app-db:5432/pmapp?schema=public"
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD

# Redis Configuration (use generated password or your own secure password)  
REDIS_URL="redis://:YOUR_SECURE_REDIS_PASSWORD@pm-app-redis:6379"
REDIS_PASSWORD=YOUR_SECURE_REDIS_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
APP_URL=http://YOUR_SERVER_IP

# NextAuth Configuration (use generated secret or your own 32+ char secret)
NEXTAUTH_URL=http://YOUR_SERVER_IP
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_32_CHARS_MIN

# JWT Configuration (use generated secret or your own 32+ char secret)
JWT_SECRET=YOUR_JWT_SECRET_32_CHARS_MIN

# OpenAI API Configuration (required for AI features)
OPENAI_API_KEY="your_openai_api_key_here"
OPENAI_API_KEY_2="your_backup_openai_api_key_here"

# Z.AI API Key (secondary AI provider for GLM-4-32B model)
# Get your API key from: https://open.bigmodel.cn/
ZAI_API_KEY="your_zai_api_key_here"

# Google OAuth Configuration
# Get these from Google Cloud Console: https://console.cloud.google.com/
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://YOUR_SERVER_IP/api/email/gmail/callback"

# Email Configuration (Gmail SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"

# Security Configuration
ALLOWED_ORIGINS=http://YOUR_SERVER_IP,http://localhost:3000

# Performance Configuration
NEXT_TELEMETRY_DISABLED=1
LOG_LEVEL=info
ENABLE_METRICS=true
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/app/uploads
EOF
```

**📋 Password Recovery Information:**

**Q: What happens if I forget database passwords?**
- If you forget passwords **before first deployment**: Simply regenerate new ones and update the configuration
- If you forget passwords **after deployment**: You'll need to:
  1. Stop the services: `docker compose -f docker-compose.production.yml down`
  2. Remove the database volume: `docker volume rm pm-app_postgres_data`
  3. Update passwords in `.env.production.local`
  4. Redeploy: `./deploy-production-new.sh`
  5. **⚠️ WARNING: This will delete all database data!**

**Q: Can I use manual passwords instead of generated ones?**
- **Yes!** You can use any passwords you want, but ensure they are:
  - At least 32 characters long for secrets (NextAuth, JWT)
  - At least 16 characters long for database/Redis passwords
  - Include uppercase, lowercase, numbers, and special characters
  - Are unique for each service

**Q: How to change passwords after deployment?**
- For application secrets (NextAuth, JWT): Update `.env.production.local` and restart
- For database passwords: Requires database recreation (data loss)

### 2.5 API Provider References

#### OpenAI API
- **Website**: https://platform.openai.com/
- **Documentation**: https://platform.openai.com/docs/
- **API Keys**: https://platform.openai.com/account/api-keys
- **Models Used**: GPT-4, GPT-3.5-turbo
- **Pricing**: https://openai.com/pricing

#### Z.AI (GLM-4-32B Model)
- **Website**: https://open.bigmodel.cn/
- **Documentation**: https://open.bigmodel.cn/dev/api
- **API Keys**: https://open.bigmodel.cn/usercenter/apikeys
- **Models Used**: GLM-4-32B (32K context length)
- **Features**: Chinese and English language support
- **Pricing**: https://open.bigmodel.cn/pricing

#### Google OAuth Setup
- **Console**: https://console.cloud.google.com/
- **Setup Guide**: 
  1. Create new project or select existing
  2. Enable Google+ API and Gmail API
  3. Create OAuth 2.0 credentials
  4. Add authorized redirect URIs: `http://YOUR_SERVER_IP/api/email/gmail/callback`
  5. Copy Client ID and Client Secret

### 2.6 Directory Structure Setup

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

## Additional phases continue with Nginx setup, security, monitoring, etc...

This guide provides a secure template for deployment without exposing sensitive API keys or credentials. Replace all placeholder values with your actual configuration before deployment.
