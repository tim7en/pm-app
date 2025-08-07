# PM-App Ubuntu 20.04 LTS Production Deployment Guide

This guide provides comprehensive step-by-step instructions for deploying your PM-App on a fresh Ubuntu 20.04 LTS virtual machine.

## Prerequisites

- Fresh Ubuntu 20.04 LTS server (minimum 2GB RAM, 4GB recommended)
- Root or sudo access
- Internet connection
- Your PM-App source code (this repository)
- Domain name or server IP address

## Quick Deployment (Automated - Recommended)

**Note**: This automated method requires deployment scripts. For a manual approach, skip to the "Manual Deployment" section below.

### Step 1: Connect to Your Server

```bash
ssh -i "D:\app-admin.pem" uz-user@198.163.207.39
ssh your-username@your-server-ip
```

### Step 2: Download and Prepare Repository

```bash
# Clone the repository
git clone https://github.com/tim7en/pm-app.git
cd pm-app

# Make deployment scripts executable (if they exist)
chmod +x ubuntu-setup.sh deploy-app.sh 2>/dev/null || echo "Deployment scripts not found, using manual installation"
```

### Step 3: Run Automated Setup (if scripts exist)

```bash
# This installs Node.js, PM2, Nginx, and configures everything
./ubuntu-setup.sh && ./deploy-app.sh
```

**If automated scripts fail or don't exist, continue with manual deployment below.**

## Manual Deployment (Step by Step)

### Step 1: System Update and Basic Tools

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git unzip software-properties-common build-essential

# Install snap (for potential future use)
sudo apt install -y snapd
```

### Step 2: Install Node.js 20

```bash
# Add NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and npm
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x or higher

# Increase npm timeout for slow connections
npm config set timeout 300000
```

### Step 3: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 startup script
pm2 startup

# IMPORTANT: Run the command that PM2 outputs (it will look like):
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Verify PM2 installation
pm2 --version
```

### Step 4: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx

# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
```

### Step 5: Configure Firewall (Security)

### Step 5: Configure Firewall (Security)

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (IMPORTANT: Don't lock yourself out!)
sudo ufw allow OpenSSH

# Allow Nginx (HTTP and HTTPS)
sudo ufw allow 'Nginx Full'

# Allow port 3000 for direct access (optional, for testing)
sudo ufw allow 3000

# Check firewall status
sudo ufw status
```

### Step 6: Deploy Your Application

```bash
# Create application directory
sudo mkdir -p /var/www/pm-app
sudo chown -R $USER:$USER /var/www/pm-app

# Navigate to application directory
cd /var/www/pm-app

# Clone your repository
git clone https://github.com/tim7en/pm-app.git .

# Alternative: If you uploaded files via SCP/SFTP, they should already be here
# scp -r ./pm-app/* your-username@your-server-ip:/var/www/pm-app/
```

### Step 7: Create Environment Configuration

```bash
# Create production environment file
cd /var/www/pm-app
cp .env.example .env

# Edit the environment file
nano .env
```

**Add the following content to `.env` (replace with your actual values):**

```env
# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (SQLite - no additional setup needed)
DATABASE_URL="file:./db/production.db"

# NextAuth Configuration
NEXTAUTH_SECRET="your-very-secure-random-secret-key-at-least-32-characters-long"
NEXTAUTH_URL="http://your-domain.com"
# If using IP: NEXTAUTH_URL="http://YOUR_SERVER_IP"

# Socket.IO Configuration
SOCKET_IO_PATH="/api/socketio"

# Google OAuth (Optional - leave empty if not using)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: AI Integration
# OPENAI_API_KEY=""

# Optional: Analytics and Monitoring
# GOOGLE_ANALYTICS_ID=""
# SENTRY_DSN=""
```

**Important**: Replace `your-domain.com` with your actual domain or server IP address.

### Step 8: Install Dependencies and Build Application

```bash
cd /var/www/pm-app

# Install production dependencies
npm ci --omit=dev

# Generate Prisma client
npx prisma generate

# Create database directory
mkdir -p db

# Initialize the database
npx prisma db push

# Build the Next.js application
npm run build

# Create necessary directories
mkdir -p logs uploads public/uploads

# Set proper permissions
chmod -R 755 uploads public/uploads
sudo chown -R $USER:$USER /var/www/pm-app
```

### Step 9: Configure Nginx for PM-App

```bash
# Create Nginx configuration for PM-App
sudo tee /etc/nginx/sites-available/pm-app << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    # Replace 'your-domain.com' with your actual domain or remove this line and use IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Main application proxy
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

    # Socket.IO WebSocket support (crucial for real-time features)
    location /api/socketio/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files with caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File uploads configuration
    client_max_body_size 50M;
    client_body_timeout 120s;
}
EOF

# Replace placeholder domain with actual domain or IP
# If using IP instead of domain, uncomment and run this:
# sudo sed -i 's/server_name your-domain.com www.your-domain.com;/server_name YOUR_SERVER_IP;/' /etc/nginx/sites-available/pm-app

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### Step 10: Create PM2 Configuration

```bash
# Create PM2 ecosystem configuration file
cd /var/www/pm-app

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
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
    ignore_watch: ['node_modules', 'logs', '.git', '.next'],
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
EOF
```

### Step 11: Start the Application

```bash
# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 to start on system boot
pm2 startup
# IMPORTANT: Run the command that PM2 outputs

# Check application status
pm2 status
pm2 logs pm-app --lines 50

# Monitor the application
pm2 monit
```

### Step 12: Verify Installation

```bash
# Check if the application is running
pm2 status

# Check if port 3000 is listening
sudo netstat -tulpn | grep :3000

# Check Nginx status
sudo systemctl status nginx

# Test the application
curl http://localhost:3000
# You should see HTML content

# Test through Nginx
curl http://localhost
# Should also return HTML content

# Check logs if there are issues
pm2 logs pm-app
sudo tail -f /var/log/nginx/error.log
```

## SSL Setup (Highly Recommended for Production)

### Install Let's Encrypt SSL Certificate

**Only proceed if you have a domain name. Skip this section if using IP address.**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your actual domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms of service
# 3. Choose whether to share email with EFF
# 4. Select redirect option (recommended: 2 - redirect HTTP to HTTPS)

# Test automatic renewal
sudo certbot renew --dry-run

# Set up automatic renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

## Final Configuration Steps

### Step 13: Configure Domain/IP in Environment

```bash
cd /var/www/pm-app

# Edit .env file to update NEXTAUTH_URL
nano .env

# Update this line with your actual domain or IP:
# If using domain: NEXTAUTH_URL="https://your-domain.com"
# If using IP: NEXTAUTH_URL="http://YOUR_SERVER_IP"
```

### Step 14: Update Nginx Configuration (if using IP)

```bash
# If you're using server IP instead of domain name, update Nginx config:
sudo nano /etc/nginx/sites-available/pm-app

# Replace this line:
# server_name your-domain.com www.your-domain.com;
# With:
# server_name YOUR_SERVER_IP;

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### Step 15: Restart Application

```bash
# Restart the application to load new environment variables
pm2 restart pm-app

# Verify everything is working
pm2 status
pm2 logs pm-app --lines 20
```

## Testing Your Deployment

### Access Your Application

1. **With Domain**: Navigate to `http://your-domain.com` (or `https://` if SSL is set up)
2. **With IP**: Navigate to `http://YOUR_SERVER_IP`

### Test Key Features

```bash
# Test Socket.IO connection
curl -s http://localhost:3000/api/socketio/

# Check if database is working
ls -la /var/www/pm-app/db/

# Verify log files
tail -f /var/www/pm-app/logs/combined.log
```

## Monitoring and Maintenance

### Essential Commands for Daily Management

```bash
# Check application status
pm2 status
pm2 logs pm-app --lines 50
pm2 monit

# Restart application
pm2 restart pm-app

# Stop application
pm2 stop pm-app

# View real-time logs
pm2 logs pm-app -f

# Check system resources
htop           # Interactive process viewer
df -h          # Disk usage
free -h        # Memory usage
uname -a       # System information
```

### Application Updates

```bash
# Navigate to application directory
cd /var/www/pm-app

# Pull latest changes
git pull origin master  # or main branch

# Install any new dependencies
npm ci --omit=dev

# Regenerate Prisma client (if schema changed)
npx prisma generate

# Apply database changes (if any)
npx prisma db push

# Rebuild the application
npm run build

# Restart with PM2
pm2 restart pm-app

# Check if update was successful
pm2 logs pm-app --lines 20
```

### Backup Your Data

```bash
# Create backup directory
mkdir -p ~/backups

# Backup SQLite database
cp /var/www/pm-app/db/production.db ~/backups/production_$(date +%Y%m%d_%H%M%S).db

# Backup uploads (if any)
tar -czf ~/backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www/pm-app uploads/

# Backup environment file
cp /var/www/pm-app/.env ~/backups/.env_$(date +%Y%m%d_%H%M%S)

# List backups
ls -la ~/backups/
```

### Log Locations and Analysis

```bash
# Application logs (PM2)
tail -f /var/www/pm-app/logs/combined.log
tail -f /var/www/pm-app/logs/err.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo tail -f /var/log/syslog

# Check log file sizes
du -sh /var/www/pm-app/logs/*
du -sh /var/log/nginx/*
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start

```bash
# Check PM2 status and logs
pm2 status
pm2 logs pm-app --lines 50

# Common causes and solutions:
# - Database connection issues: Check DATABASE_URL in .env
# - Port 3000 already in use: sudo lsof -i :3000
# - Missing dependencies: npm ci --omit=dev
# - Build issues: npm run build
# - Permission issues: sudo chown -R $USER:$USER /var/www/pm-app
```

#### 2. 502 Bad Gateway Error

```bash
# Check if application is running
pm2 status

# If not running, start it
pm2 start ecosystem.config.js

# Check Nginx configuration
sudo nginx -t

# Restart Nginx if needed
sudo systemctl restart nginx

# Check if port 3000 is accessible
curl http://localhost:3000
```

#### 3. Socket.IO Not Working (Real-time features broken)

```bash
# Check Nginx config for Socket.IO support
sudo nano /etc/nginx/sites-available/pm-app

# Ensure this section exists:
# location /api/socketio/ {
#     proxy_pass http://localhost:3000;
#     proxy_http_version 1.1;
#     proxy_set_header Upgrade $http_upgrade;
#     proxy_set_header Connection "upgrade";
# }

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. Database Issues

```bash
# Check if database file exists
ls -la /var/www/pm-app/db/

# Recreate database if missing
cd /var/www/pm-app
npx prisma db push

# Check database permissions
sudo chown -R $USER:$USER /var/www/pm-app/db/
```

#### 5. Out of Memory Issues

```bash
# Check memory usage
free -h

# If memory is low, add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Restart application
pm2 restart pm-app
```

#### 6. Permission Denied Errors

```bash
# Fix file permissions
sudo chown -R $USER:$USER /var/www/pm-app
chmod -R 755 /var/www/pm-app
chmod -R 777 /var/www/pm-app/uploads
chmod -R 777 /var/www/pm-app/db
```

#### 7. Environment Variables Not Loading

```bash
# Check .env file exists and has correct format
cat /var/www/pm-app/.env

# Restart application to reload environment
pm2 restart pm-app

# Check if variables are loaded
pm2 show pm-app
```

### Diagnostic Commands

```bash
# System health check
echo "=== System Information ==="
uname -a
echo "=== Memory Usage ==="
free -h
echo "=== Disk Usage ==="
df -h
echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)"
echo "=== Network Ports ==="
sudo netstat -tulpn | grep -E ':(80|443|3000)'
echo "=== PM2 Status ==="
pm2 status
echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager
```

## Security Checklist

### Essential Security Measures

- [ ] **Firewall configured (UFW enabled)**
  ```bash
  sudo ufw status
  ```

- [ ] **SSH key authentication enabled** (disable password auth)
  ```bash
  sudo nano /etc/ssh/sshd_config
  # Set: PasswordAuthentication no
  sudo systemctl restart ssh
  ```

- [ ] **Regular security updates scheduled**
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

- [ ] **Strong NEXTAUTH_SECRET set** (at least 32 characters)
- [ ] **SSL certificate installed** (if using domain)
- [ ] **Application running as non-root user**
- [ ] **File permissions properly set** (755 for directories, 644 for files)
- [ ] **Database file secured** (only accessible by app user)
- [ ] **Regular backups configured**
- [ ] **Log files monitored** for security issues

### Additional Security Hardening

```bash
# Fail2ban for SSH protection
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Hide Nginx version
sudo nano /etc/nginx/nginx.conf
# Add in http block: server_tokens off;

# Set up automatic security updates
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades
```

## Performance Optimization

### For 2GB RAM Server

```bash
# Optimize PM2 for limited memory
pm2 delete pm-app
pm2 start ecosystem.config.js

# Set up swap file (if not already done)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize Nginx
sudo nano /etc/nginx/nginx.conf
# Uncomment and adjust these values:
# worker_processes auto;
# worker_connections 1024;
# keepalive_timeout 65;
# client_max_body_size 50M;

sudo systemctl restart nginx
```

### For 4GB+ RAM Server

```bash
# You can increase PM2 instances for better performance
# Edit ecosystem.config.js
nano /var/www/pm-app/ecosystem.config.js

# Change:
# instances: 1,
# To:
# instances: 2,  # or 'max' for auto-detection

pm2 restart pm-app
```

## Quick Reference Commands

### Daily Operations
```bash
# Check everything is running
pm2 status && sudo systemctl status nginx

# View recent logs
pm2 logs pm-app --lines 20

# Restart application
pm2 restart pm-app

# Update application
cd /var/www/pm-app && git pull && npm run build && pm2 restart pm-app
```

### Emergency Commands
```bash
# Stop everything
pm2 stop pm-app && sudo systemctl stop nginx

# Start everything
sudo systemctl start nginx && pm2 start ecosystem.config.js

# Reset application (nuclear option)
pm2 delete pm-app && cd /var/www/pm-app && npm run build && pm2 start ecosystem.config.js
```

---

## Success! 🎉

Your PM-App should now be running successfully at:
- **With Domain**: `http://your-domain.com` (or `https://` if SSL configured)
- **With IP**: `http://YOUR_SERVER_IP`

### What to Expect:
1. **Login/Registration page** - Users can create accounts
2. **Dashboard** - Main project management interface
3. **Real-time updates** - Socket.IO powered live updates
4. **File uploads** - Working upload functionality
5. **Responsive design** - Mobile-friendly interface

### If You Encounter Issues:
1. **Check the logs**: `pm2 logs pm-app`
2. **Verify services**: `pm2 status` and `sudo systemctl status nginx`
3. **Test connectivity**: `curl http://localhost:3000`
4. **Review this guide** and ensure all steps were completed
5. **Contact support** with specific error messages

**Congratulations on successfully deploying your PM-App!**
