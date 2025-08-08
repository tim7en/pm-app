# Ubuntu 20.04 LTS Deployment - Complete Guide

## 🎯 Your PM-App is Production Ready!

Your application has been successfully prepared for Ubuntu 20.04 LTS deployment. Here's everything you need to deploy on your cloud server.

## 📦 Deployment Package

Your deployment package includes:

1. **ubuntu-setup.sh** - Complete server setup script
2. **deploy-app.sh** - Application deployment script  
3. **quick-deploy-ubuntu.sh** - One-command full deployment
4. **UBUNTU_DEPLOYMENT_GUIDE.md** - Detailed step-by-step guide
5. **ecosystem.config.js** - PM2 production configuration
6. **.env.example** - Environment template

## 🚀 Quick Deployment (Recommended)

### Option 1: One-Command Deployment

```bash
# On your Ubuntu server
wget https://raw.githubusercontent.com/yourusername/pm-app/main/quick-deploy-ubuntu.sh
chmod +x quick-deploy-ubuntu.sh
./quick-deploy-ubuntu.sh
```

### Option 2: Two-Step Deployment

```bash
# Step 1: Server Setup
wget https://raw.githubusercontent.com/yourusername/pm-app/main/ubuntu-setup.sh
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh

# Step 2: Deploy App
wget https://raw.githubusercontent.com/yourusername/pm-app/main/deploy-app.sh
chmod +x deploy-app.sh
./deploy-app.sh
```

### Option 3: Manual File Transfer

1. Upload your PM-App files to your Ubuntu server
2. Copy the deployment scripts to your server
3. Run the scripts as shown above

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] Ubuntu 20.04 LTS server (minimum 2GB RAM)
- [ ] Root or sudo access to the server
- [ ] Your PM-App source code
- [ ] Database credentials ready
- [ ] Domain name pointed to your server (optional)

## 🔧 What Gets Installed

The deployment scripts will install and configure:

### System Components
- **Node.js 20.x** - Latest LTS version
- **PostgreSQL 12** - Production database
- **Nginx** - Reverse proxy and web server
- **PM2** - Process manager for Node.js
- **UFW Firewall** - Security configuration
- **htop** - System monitoring

### Application Setup
- **Production build** - Optimized for performance
- **Database schema** - Prisma migrations
- **SSL ready** - Let's Encrypt support
- **Auto-restart** - PM2 process management
- **Log management** - Structured logging
- **Memory optimization** - For 2GB RAM servers

## 🌐 Access Your Application

After deployment, your app will be available at:

- **Local**: http://localhost:3000
- **Public IP**: http://YOUR_SERVER_IP
- **Domain**: http://your-domain.com (after DNS setup)

## 🔒 Security Features

- Firewall configured (ports 22, 80, 443)
- Application runs as non-root user
- Database password protection
- Environment variables secured
- SSL certificate ready
- Regular security updates

## 📊 Monitoring & Management

### PM2 Commands
```bash
pm2 status              # Check application status
pm2 logs pm-app         # View application logs
pm2 restart pm-app      # Restart application
pm2 stop pm-app         # Stop application
pm2 monit               # Real-time monitoring
```

### System Commands
```bash
htop                    # System resources
sudo systemctl status nginx  # Nginx status
sudo nginx -t           # Test Nginx config
df -h                   # Disk usage
free -h                 # Memory usage
```

### Log Locations
- **Application**: `/var/www/pm-app/logs/`
- **Nginx**: `/var/log/nginx/`
- **System**: `/var/log/syslog`

## 🔧 Environment Configuration

The deployment creates a production `.env` file with these variables:

```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=http://your-domain.com
DATABASE_URL="postgresql://pmapp_user:password@localhost:5432/pmapp"
NEXTAUTH_SECRET="your-secure-secret"
NEXTAUTH_URL="http://your-domain.com"
```

**Important**: Update these values with your actual credentials before deployment.

## 🚨 Troubleshooting

### Common Issues & Solutions

**Application won't start:**
```bash
pm2 logs pm-app         # Check application logs
pm2 restart pm-app      # Try restarting
```

**502 Bad Gateway:**
```bash
pm2 status              # Check if app is running
sudo nginx -t           # Test Nginx configuration
sudo systemctl restart nginx
```

**Database connection error:**
```bash
sudo systemctl status postgresql
psql -U pmapp_user -d pmapp -h localhost
```

**Out of memory:**
```bash
free -h                 # Check memory usage
pm2 restart pm-app      # Restart to free memory
```

## 🔄 Updates & Maintenance

### Update Application
```bash
cd /var/www/pm-app
git pull origin main
npm ci --only=production
npm run build
pm2 restart pm-app
```

### Database Backup
```bash
pg_dump -U pmapp_user pmapp > backup_$(date +%Y%m%d_%H%M%S).sql
```

### SSL Certificate Setup
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📞 Support

If you encounter issues during deployment:

1. Check the **UBUNTU_DEPLOYMENT_GUIDE.md** for detailed instructions
2. Review the logs: `pm2 logs pm-app`
3. Verify system resources: `htop`
4. Test Nginx configuration: `sudo nginx -t`

## 🎉 Success Indicators

Your deployment is successful when you see:

- ✅ PM2 shows "online" status
- ✅ Application responds at http://YOUR_SERVER_IP
- ✅ No errors in `pm2 logs pm-app`
- ✅ Nginx test passes: `sudo nginx -t`
- ✅ Database connection works

## 📈 Performance Optimization

For optimal performance on your 2GB server:

- PM2 memory limit set to 1GB
- Nginx gzip compression enabled
- PostgreSQL optimized for 2GB RAM
- Swap file configured (2GB)
- Static file caching enabled

Your PM-App is now ready for production deployment on Ubuntu 20.04 LTS!
