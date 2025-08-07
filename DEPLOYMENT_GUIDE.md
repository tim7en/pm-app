# Deployment Guide for PM-App on Ubuntu 20.04 LTS

## Server Specifications
- **RAM**: 2 GB
- **Storage**: 15 GB HDD
- **CPU**: 1 vCPU
- **OS**: Ubuntu 20.04 LTS

## Prerequisites
- SSH access to your server
- Domain name pointing to your server IP
- Basic Linux command line knowledge

## Step 1: Server Setup

1. **Connect to your server**:
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Upload and run the setup script**:
   ```bash
   # Upload deploy-ubuntu.sh to your server
   chmod +x deploy-ubuntu.sh
   ./deploy-ubuntu.sh
   ```

## Step 2: Upload Your Project

### Option A: Using Git (Recommended)
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Production deployment"
   git push origin master
   ```

2. **Update the repository URL** in `deploy-app.sh`:
   ```bash
   REPO_URL="https://github.com/your-username/pm-app.git"
   ```

### Option B: Direct Upload
1. **Create a tar archive**:
   ```bash
   tar -czf pm-app.tar.gz --exclude=node_modules --exclude=.git .
   ```

2. **Upload to server**:
   ```bash
   scp pm-app.tar.gz your-username@your-server-ip:/var/www/
   ```

3. **Extract on server**:
   ```bash
   cd /var/www
   tar -xzf pm-app.tar.gz
   mv pm-app/* pm-app/
   ```

## Step 3: Environment Configuration

1. **Upload your .env file**:
   ```bash
   scp .env your-username@your-server-ip:/var/www/pm-app/
   ```

## Step 4: Deploy Application

1. **Run deployment script**:
   ```bash
   cd /var/www/pm-app
   chmod +x deploy-app.sh
   ./deploy-app.sh
   ```

## Step 5: SSL Setup (Important for Production)

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate**:
   ```bash
   sudo certbot --nginx -d hollow-gray-snipe-carey-swknu.app.uztelecom.uz
   ```

3. **Verify auto-renewal**:
   ```bash
   sudo certbot renew --dry-run
   ```

## Monitoring and Maintenance

### Check Application Status
```bash
pm2 status
pm2 logs
```

### Monitor System Resources
```bash
htop           # CPU and memory usage
df -h          # Disk usage
free -h        # Memory usage
```

### Update Application
```bash
cd /var/www/pm-app
./deploy-app.sh
```

## Performance Optimization for 2GB RAM

The deployment includes several optimizations:

1. **Memory Management**:
   - PM2 configured with memory restart at 1GB
   - Node.js heap limited to 1.5GB
   - 1GB swap file created

2. **System Optimization**:
   - Swappiness set to 10 (prefer RAM over swap)
   - Cache pressure optimized

3. **Application Optimization**:
   - Single PM2 instance (suitable for 1 vCPU)
   - Production build with optimizations

## Troubleshooting

### Common Issues

1. **Out of Memory**:
   ```bash
   # Check memory usage
   free -h
   # Restart application
   pm2 restart all
   ```

2. **Application Won't Start**:
   ```bash
   # Check logs
   pm2 logs
   # Check environment variables
   pm2 env 0
   ```

3. **Database Issues**:
   ```bash
   # Reset database
   cd /var/www/pm-app
   npx prisma db push --force-reset
   ```

### Backup Strategy

1. **Database Backup**:
   ```bash
   cp /var/www/pm-app/prisma/dev.db /backup/dev.db.$(date +%Y%m%d)
   ```

2. **Application Backup**:
   ```bash
   tar -czf /backup/pm-app-$(date +%Y%m%d).tar.gz /var/www/pm-app
   ```

## Security Considerations

1. **Firewall**: Only ports 22, 80, and 443 are open
2. **SSL**: HTTPS enforced for production
3. **Updates**: Regular system updates recommended
4. **Monitoring**: Consider setting up log monitoring

## Final Checklist

- [ ] Server setup completed
- [ ] Application deployed and running
- [ ] SSL certificate installed
- [ ] Domain pointing to server
- [ ] PM2 auto-startup configured
- [ ] Backup strategy implemented
- [ ] Monitoring in place

Your application should now be accessible at:
**https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz**
