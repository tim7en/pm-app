# Ubuntu 20.04 LTS Production Deployment Guide

This guide provides step-by-step instructions for deploying your PM-App on Ubuntu 20.04 LTS cloud server.

## Prerequisites

- Ubuntu 20.04 LTS server (minimum 2GB RAM)
- Root or sudo access
- Internet connection
- Your PM-App source code (via Git repository or file transfer)

## Quick Deployment (Automated)

### Step 1: Connect to Your Server

```bash
ssh your-username@your-server-ip
```

### Step 2: Download Deployment Scripts

```bash
# Option A: If you have Git repository
git clone https://github.com/yourusername/pm-app.git
cd pm-app

# Option B: Download scripts directly
wget https://raw.githubusercontent.com/yourusername/pm-app/main/ubuntu-setup.sh
wget https://raw.githubusercontent.com/yourusername/pm-app/main/deploy-app.sh
chmod +x ubuntu-setup.sh deploy-app.sh
```

### Step 3: Run Server Setup

```bash
# This installs Node.js, PM2, Nginx, PostgreSQL, and configures security
./ubuntu-setup.sh
```

### Step 4: Deploy Application

```bash
# This deploys your PM-App and starts it with PM2
./deploy-app.sh
```

## Manual Deployment (Step by Step)

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 2: Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version
```

### Step 3: Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << 'EOF'
CREATE DATABASE pmapp;
CREATE USER pmapp_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE pmapp TO pmapp_user;
\q
EOF
```

### Step 4: Install PM2

```bash
sudo npm install -g pm2
pm2 startup
# Run the command that PM2 outputs
```

### Step 5: Install and Configure Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/pm-app << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://localhost:3000;
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

    # Socket.IO WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    client_max_body_size 50M;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Configure Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Step 7: Deploy Your Application

```bash
# Create application directory
sudo mkdir -p /var/www/pm-app
sudo chown -R $USER:$USER /var/www/pm-app
cd /var/www/pm-app

# Option A: Clone from Git repository
git clone https://github.com/yourusername/pm-app.git .

# Option B: Upload your files (if using SCP/SFTP)
# scp -r ./pm-app/* your-username@your-server-ip:/var/www/pm-app/
```

### Step 8: Create Environment File

```bash
cd /var/www/pm-app

# Create .env file
nano .env
```

Add the following content to `.env`:

```env
# Application Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://your-domain.com

# Database Configuration
DATABASE_URL="postgresql://pmapp_user:your_secure_password@localhost:5432/pmapp"

# Authentication
NEXTAUTH_SECRET="your-very-secure-random-secret-key-here"
NEXTAUTH_URL="http://your-domain.com"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email Configuration (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""

# AI Configuration (optional)
OPENAI_API_KEY=""

# Upload Configuration
UPLOAD_DIR="/var/www/pm-app/uploads"
MAX_FILE_SIZE=10485760
```

### Step 9: Install Dependencies and Build

```bash
cd /var/www/pm-app

# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Set up database
npx prisma db push

# Build the application
npm run build-simple || npm run build

# Create necessary directories
mkdir -p logs uploads public/uploads
chmod -R 777 uploads public/uploads
```

### Step 10: Create PM2 Configuration

```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pm-app',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/pm-app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 5,
    restart_delay: 5000,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git'],
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF
```

### Step 11: Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs

# Check status
pm2 status
pm2 logs
```

## SSL Setup (Recommended)

### Install Let's Encrypt SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Monitoring and Maintenance

### Useful Commands

```bash
# Check application status
pm2 status
pm2 logs pm-app
pm2 monit

# Restart application
pm2 restart pm-app

# Update application
cd /var/www/pm-app
git pull origin main
npm ci --only=production
npm run build
pm2 restart pm-app

# Check Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
free -h

# Database backup
pg_dump -U pmapp_user pmapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Log Locations

- PM2 Logs: `/var/www/pm-app/logs/`
- Nginx Logs: `/var/log/nginx/`
- System Logs: `/var/log/syslog`

## Troubleshooting

### Common Issues

1. **Application not starting:**
   ```bash
   pm2 logs pm-app
   # Check for database connection errors, missing environment variables
   ```

2. **502 Bad Gateway:**
   ```bash
   # Check if app is running
   pm2 status
   # Check Nginx configuration
   sudo nginx -t
   ```

3. **Database connection errors:**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   # Test database connection
   psql -U pmapp_user -d pmapp -h localhost
   ```

4. **Out of memory:**
   ```bash
   # Check memory usage
   free -h
   # Increase swap if needed
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSH key authentication enabled
- [ ] Regular security updates scheduled
- [ ] Database password changed from default
- [ ] SSL certificate installed
- [ ] Application running as non-root user
- [ ] File permissions properly set
- [ ] Regular backups configured

## Performance Optimization

### For 2GB RAM Server:

```bash
# Optimize PM2 for limited memory
pm2 start ecosystem.config.js --max-memory-restart 800M

# Set up swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize PostgreSQL
sudo nano /etc/postgresql/12/main/postgresql.conf
# Add these lines:
# shared_buffers = 256MB
# effective_cache_size = 1GB
# maintenance_work_mem = 64MB
# checkpoint_completion_target = 0.9
# wal_buffers = 16MB
# default_statistics_target = 100

sudo systemctl restart postgresql
```

Your PM-App should now be running at your domain or server IP address!
