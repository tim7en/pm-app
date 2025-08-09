# PM-App Ubuntu Deployment Guide
## Quick Production Setup for Ubuntu 20.04 LTS (noVNC Console)

**Two deployment options for noVNC command prompt:**

### 🚀 **Option 1: Automated via Download (5 minutes)**
```bash
# Download and run the complete deployment script
wget https://raw.githubusercontent.com/tim7en/pm-app/master/deploy-complete.sh
chmod +x deploy-complete.sh && ./deploy-complete.sh
```

### 📖 **Option 2: Manual via Git Clone (15 minutes)**
Follow the streamlined steps below for custom control.

---

## 🤖 **AUTOMATED DEPLOYMENT (noVNC Console)**

### One-Command Setup
```bash
# Download deployment script directly from GitHub
wget https://raw.githubusercontent.com/tim7en/pm-app/master/deploy-complete.sh

# Run deployment (will prompt for confirmations)
chmod +x deploy-complete.sh && ./deploy-complete.sh
```

**Alternative if wget fails:**
```bash
# Using curl instead
curl -O https://raw.githubusercontent.com/tim7en/pm-app/master/deploy-complete.sh
chmod +x deploy-complete.sh && ./deploy-complete.sh
```

**What it does:**
- ✅ Installs Node.js 20.x, PM2, Nginx
- ✅ Clones repository and resolves dependencies  
- ✅ Sets up Prisma database
- ✅ Configures SSL, firewall, monitoring
- ✅ Optimizes for 2GB RAM

**Result:** Live application at your domain in ~5 minutes.

---

## 📁 **CUSTOM ENVIRONMENT FILES (noVNC)**

Create `.env` files directly on server. **Note:** The application requires several API keys for full functionality:

**Required Variables:**
- `OPENAI_API_KEY` & `OPENAI_API_KEY_2` - For AI features (get from OpenAI dashboard)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Gmail integration (Google Cloud Console)
- `SMTP_*` variables - For email sending (Gmail app password recommended)

**Method 1: Create using nano editor**
```bash
# Create and edit .env file directly
nano /var/www/pm-app/.env
# Paste your environment variables, then Ctrl+X, Y, Enter to save
```

**Method 2: Download from GitHub/web**
```bash
# If you have .env in a private repository or file hosting
wget https://yourserver.com/environment.txt -O /var/www/pm-app/.env
chmod 600 /var/www/pm-app/.env
```

**Method 3: Create via command line**
```bash
# Quick setup with basic variables (minimum required)
cat > /var/www/pm-app/.env << 'EOF'
NODE_ENV="production"
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-domain.com"
JWT_SECRET="your-jwt-secret-here"
OPENAI_API_KEY="your-openai-key-here"
OPENAI_API_KEY_2="your-backup-openai-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://your-domain.com/api/email/gmail/callback"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"
PORT="3000"
EOF
```

---

## 📖 **MANUAL DEPLOYMENT (noVNC Console)**

### Step 1: Server Setup (2 minutes)
```bash
# Clean existing installations
sudo pkill -f pm2 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo rm -rf /var/www/pm-app ~/.pm2 /etc/nginx/sites-*/pm-app
sudo npm cache clean --force 2>/dev/null || true
sudo apt clean && sudo apt autoremove -y

# Install Node.js 20.19.0+ and PM2 (required by package.json engines)
sudo apt update && sudo apt install -y curl wget git build-essential python3-pip
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g npm@latest pm2@latest

# Verify installation meets requirements
node --version  # Should be 20.19.0+
npm --version   # Should be 10.0.0+
pm2 --version
```

### Step 2: Application Setup (3 minutes)
```bash
# Create application directory and clone repository
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www

# Clone repository directly from GitHub
git clone https://github.com/tim7en/pm-app.git
cd pm-app

# Verify clone was successful
ls -la

# Install dependencies with proper configuration
echo -e "legacy-peer-deps=true\nfund=false\naudit=false" > .npmrc
npm install --legacy-peer-deps --force

# Install additional required packages
npm install --save-dev tailwindcss postcss autoprefixer @types/node typescript --legacy-peer-deps
npm install class-variance-authority clsx tailwind-merge lucide-react prisma @prisma/client --legacy-peer-deps

echo "✅ Dependencies installed successfully"
```

### Step 3: Database & Build (2 minutes)
```bash
# Setup basic environment file
cat > .env << 'EOF'
NODE_ENV="production"
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="XaQ8vN9mK2pR7wL5tY6hU3jF8bZ4cV1eS0dG9xA2qW5rT8nM7kP3vL6yH1uJ4"
NEXTAUTH_URL="https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
JWT_SECRET="P9mK2wN5vQ8xA1bY4tR7cL0eS3gZ6hU9jF2pW5nM8kV1xT4yL7qG0aB3dE6fH9"
OPENAI_API_KEY="your-openai-key-here"
OPENAI_API_KEY_2="your-backup-openai-key-here"
ZAI_API_KEY="your-zai-api-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz/api/email/gmail/callback"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"
PORT="3000"
EOF

echo "✅ Environment file created - edit with: nano .env"

# Database setup
npx prisma generate
npx prisma db push --force-reset

# Verify database creation
ls -la *.db 2>/dev/null || echo "Database will be created on first run"

# Build application
npm run build

# Create logs directory
mkdir -p logs

echo "✅ Database and build setup complete"
```

### Step 4: Web Server (2 minutes)
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx site configuration (includes Socket.IO support)
sudo tee /etc/nginx/sites-available/pm-app > /dev/null << 'EOF'
server {
    listen 80;
    server_name hollow-gray-snipe-carey-swknu.app.uztelecom.uz;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.IO support for real-time features
    location /api/socketio {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site and remove default
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/pm-app /etc/nginx/sites-enabled/

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx configured and running"
```

### Step 5: Start Application (1 minute)
```bash
# Create PM2 ecosystem configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pm-app',
    script: 'server.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    node_args: '--max-old-space-size=1536'
  }]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration and setup auto-start
pm2 save
pm2 startup

# Copy and run the command that PM2 displays (it will show something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo "✅ Application started with PM2"
echo "📝 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs pm-app"
```

### Step 6: Security & Optimization (1 minute)
```bash
# Configure UFW firewall
sudo ufw --force reset
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ Firewall configured"

# Create swap file for memory optimization (2GB RAM servers)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swap settings
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
echo 'vm.vfs_cache_pressure=50' | sudo tee -a /etc/sysctl.conf

echo "✅ Memory optimization complete"
echo "📊 Check memory: free -h"
```

### Step 7: SSL Certificate (Optional - 2 minutes)
```bash
# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (interactive - follow prompts)
sudo certbot --nginx -d hollow-gray-snipe-carey-swknu.app.uztelecom.uz

# Follow the prompts:
# 1. Enter your email address
# 2. Accept terms (Y)
# 3. Share email with EFF (Y/N - your choice)
# 4. Choose option 2 to redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run

echo "✅ SSL certificate configured"
echo "🌐 Your site is now available at: https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
```

---

## ✅ **VERIFICATION & MANAGEMENT (noVNC)**

### Quick Status Check
```bash
# Check all services status
pm2 status                           # Application status
sudo systemctl status nginx --no-pager  # Web server status
sudo ufw status                      # Firewall status
free -h                             # Memory usage
df -h                               # Disk usage

# Test application endpoints
curl http://localhost:3000/api/health    # Health check
curl http://hollow-gray-snipe-carey-swknu.app.uztelecom.uz  # External access test

# Test Socket.IO endpoint (should show upgrade headers)
curl -I http://localhost:3000/api/socketio
```

### Daily Management Commands
```bash
# View application logs
pm2 logs pm-app

# Restart application (if changes made)
pm2 restart pm-app

# Stop application
pm2 stop pm-app

# Monitor system resources
htop                    # Press 'q' to quit
```

### Test Application Features
```bash
# Test AI features (requires OPENAI_API_KEY)
curl -X POST http://localhost:3000/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}' || echo "AI features may require API key setup"

# Test database connection
curl http://localhost:3000/api/health | grep -i database || echo "Check database connectivity"

# Test Socket.IO real-time features
curl -I http://localhost:3000/api/socketio | grep -i upgrade || echo "Socket.IO may need configuration"
```

### Quick Application Updates
```bash
# Navigate to application directory
cd /var/www/pm-app

# Pull latest changes from GitHub
git pull origin master

# Update dependencies and rebuild
npm ci --legacy-peer-deps --only=production
npm run build

# Restart application
pm2 restart pm-app

echo "✅ Application updated successfully"
```

---

## 🚨 **TROUBLESHOOTING (noVNC Console)**

### Common Issues & Quick Fixes

**Application won't start:**
```bash
# Check error logs for specific issues
pm2 logs pm-app

# Common issues and fixes:
# 1. Check Node.js version (must be 20.19.0+)
node --version

# 2. Check if port is in use
sudo netstat -tulpn | grep :3000

# 3. Kill any processes on port 3000
sudo lsof -ti:3000 | xargs sudo kill -9

# 4. Check environment variables
cd /var/www/pm-app && cat .env | grep -E "(OPENAI|DATABASE|NEXTAUTH)"

# 5. Reset database and restart
cd /var/www/pm-app
rm -f dev.db
npx prisma db push --force-reset
pm2 restart pm-app
```

**AI features not working:**
```bash
# Check if OpenAI API keys are configured
cd /var/www/pm-app
grep -E "OPENAI_API_KEY" .env

# Test API key validity (if configured)
curl -H "Authorization: Bearer $(grep OPENAI_API_KEY .env | cut -d'=' -f2 | tr -d '"')" \
  https://api.openai.com/v1/models | head -10
```

**Build errors:**
```bash
cd /var/www/pm-app
rm -rf node_modules .next
npm cache clean --force
npm install --legacy-peer-deps --force
npm run build
pm2 restart pm-app
```

**Prisma database errors:**
```bash
cd /var/www/pm-app
echo 'DATABASE_URL="file:./dev.db"' >> .env
npx prisma generate
npx prisma db push --force-reset
pm2 restart pm-app
```

**Can't access website:**
```bash
# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx

# Check firewall
sudo ufw status

# Test local connection
curl http://localhost:3000/api/health
```

### Quick Environment File Setup
```bash
# Create complete .env file with all required variables
cd /var/www/pm-app
cat > .env << 'EOF'
NODE_ENV="production"
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="XaQ8vN9mK2pR7wL5tY6hU3jF8bZ4cV1eS0dG9xA2qW5rT8nM7kP3vL6yH1uJ4"
NEXTAUTH_URL="https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
JWT_SECRET="P9mK2wN5vQ8xA1bY4tR7cL0eS3gZ6hU9jF2pW5nM8kV1xT4yL7qG0aB3dE6fH9"
OPENAI_API_KEY="your-openai-key-here"
OPENAI_API_KEY_2="your-backup-openai-key-here"
ZAI_API_KEY="your-zai-api-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz/api/email/gmail/callback"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"
PORT="3000"
EOF

chmod 600 .env
echo "✅ Environment file created - edit with: nano .env"
```

### Useful noVNC Commands
```bash
# Text editor for files
nano filename.txt       # Ctrl+X to exit, Y to save

# Copy/paste in terminal
# Ctrl+Shift+C to copy
# Ctrl+Shift+V to paste

# View file contents
cat filename.txt        # Show entire file
head -20 filename.txt   # Show first 20 lines
tail -20 filename.txt   # Show last 20 lines

# Search for text in files
grep "search-term" filename.txt

# Monitor real-time logs
tail -f /var/www/pm-app/logs/combined.log
```

---

## 🎉 **DEPLOYMENT COMPLETE (noVNC)**

### Your Application is Live! 
**🌐 URL:** https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz

### What's Running
- ✅ Node.js 20.x + PM2 process manager
- ✅ Nginx reverse proxy + SSL (if configured)
- ✅ SQLite database with Prisma
- ✅ UFW firewall + 1GB swap file

### Post-Deployment Tasks
1. **Test your application** - Open your domain in browser
2. **Edit environment variables** - Use `nano /var/www/pm-app/.env`
3. **Monitor your app** - Use `pm2 logs pm-app`
4. **Check system resources** - Use `free -h` and `df -h`

### Key noVNC Commands to Remember
```bash
# Application management
pm2 status              # Check app status
pm2 logs pm-app         # View logs  
pm2 restart pm-app      # Restart app

# System monitoring
free -h                 # Memory usage
df -h                   # Disk usage
sudo systemctl status nginx  # Web server status

# File editing
nano /var/www/pm-app/.env     # Edit environment file
```

### Quick Restart Sequence (if needed)
```bash
cd /var/www/pm-app
pm2 restart pm-app
sudo systemctl restart nginx
```

**🎯 Total deployment time: 5-15 minutes using noVNC console!** ⏱️

**Need help?** All commands are optimized for direct console access - no SSH required!
