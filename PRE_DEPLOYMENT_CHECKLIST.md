# Pre-Deployment Checklist for PM-App Production

## ✅ Server Requirements

### Ubuntu 20.04 LTS Server
- [ ] Server IP: 198.163.207.39 accessible via SSH
- [ ] Root or sudo access configured
- [ ] Minimum 2GB RAM, 2 CPU cores
- [ ] At least 20GB free disk space
- [ ] Internet connectivity for package downloads

### Network Configuration
- [ ] Port 22 (SSH) accessible for deployment
- [ ] Port 80 (HTTP) open for Let's Encrypt verification
- [ ] Port 443 (HTTPS) open for secure traffic
- [ ] DNS records configured (if using domain name)

## ✅ Database Setup

### External PostgreSQL Database
- [ ] PostgreSQL server running and accessible
- [ ] Database `pmapp` created
- [ ] User `pmapp_user` created with full privileges
- [ ] Database connection string ready
- [ ] SSL/TLS enabled on database (recommended)
- [ ] Firewall configured to allow connections from 198.163.207.39

Example connection string format:
```
postgresql://username:password@host:5432/pmapp?sslmode=require
```

## ✅ Security Configuration

### SSL/TLS Certificates
- [ ] Let's Encrypt will handle automatic certificates
- [ ] No manual certificate setup needed
- [ ] Ensure server can reach Let's Encrypt servers

### Secrets and API Keys
- [ ] Generate new NEXTAUTH_SECRET (min 32 characters)
- [ ] Generate new JWT_SECRET (min 32 characters)
- [ ] Update OAuth redirect URIs to use HTTPS
- [ ] Review and update API keys for production

Required secrets to generate:
```bash
# Generate secure secrets (32+ characters each)
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 16  # For REDIS_PASSWORD
```

## ✅ Application Configuration

### Environment Variables
- [ ] `.env.production` file configured with production values
- [ ] Database URL updated with actual credentials
- [ ] NEXTAUTH_URL set to `https://198.163.207.39`
- [ ] All secrets updated with production values
- [ ] CORS origins configured correctly

### OAuth Configuration
- [ ] Google OAuth redirect URI updated to HTTPS
- [ ] Other OAuth providers updated (if applicable)
- [ ] Test OAuth flows in staging environment

### Email Configuration
- [ ] SMTP settings configured for production
- [ ] Email templates tested
- [ ] From address configured

## ✅ Code and Dependencies

### Application Code
- [ ] Latest code committed to repository
- [ ] All tests passing
- [ ] Database migrations up to date
- [ ] Build process verified
- [ ] No debug code or console.logs in production

### Dependencies
- [ ] All production dependencies listed in package.json
- [ ] No development-only packages in production build
- [ ] Security vulnerabilities checked (`npm audit`)

## ✅ Backup Strategy

### Database Backups
- [ ] External database backup strategy configured
- [ ] Backup restoration process tested
- [ ] Backup retention policy defined

### Application Backups
- [ ] File backup locations planned
- [ ] Upload directory backup strategy
- [ ] Configuration backup included

## ✅ Monitoring and Logging

### Health Monitoring
- [ ] Health check endpoint tested (`/api/health`)
- [ ] Monitoring alerts configured
- [ ] Log aggregation planned

### Performance Monitoring
- [ ] Resource monitoring tools identified
- [ ] Performance baselines established
- [ ] Scaling plan documented

## ✅ Deployment Process

### Staging Environment
- [ ] Staging environment tested with production-like configuration
- [ ] Database migration tested in staging
- [ ] Performance testing completed
- [ ] Load testing performed (if applicable)

### Production Deployment
- [ ] Deployment window scheduled
- [ ] Rollback plan prepared
- [ ] Team notifications sent
- [ ] Documentation updated

## ✅ Post-Deployment Verification

### Functional Testing
- [ ] Application loads correctly via HTTPS
- [ ] User authentication works
- [ ] Database connections established
- [ ] File uploads working
- [ ] WebSocket connections functional (if applicable)

### Security Testing
- [ ] HTTPS redirect working
- [ ] Security headers present
- [ ] SSL certificate valid
- [ ] No sensitive data exposed

### Performance Testing
- [ ] Response times acceptable
- [ ] Resource usage within limits
- [ ] Database performance optimal
- [ ] CDN configuration (if applicable)

## 🚀 Deployment Commands Summary

### Initial Setup (First Time Only)
```bash
# 1. Download and run setup script
sudo wget https://raw.githubusercontent.com/your-repo/pm-app/main/deploy-ubuntu-20.04.sh
sudo chmod +x deploy-ubuntu-20.04.sh
sudo ./deploy-ubuntu-20.04.sh

# 2. Clone application
sudo git clone https://github.com/your-repo/pm-app.git /opt/pm-app
cd /opt/pm-app

# 3. Configure environment
sudo nano .env.production

# 4. Start application
sudo systemctl start pm-app
```

### Regular Updates
```bash
cd /opt/pm-app
sudo git pull origin main
sudo ./deploy-quick.sh
```

### Verification Commands
```bash
# Check service status
sudo systemctl status pm-app

# View logs
sudo docker-compose -f docker-compose.caddy.yml logs -f

# Test health endpoint
curl -f https://198.163.207.39/api/health

# Check containers
sudo docker-compose -f docker-compose.caddy.yml ps
```

## ⚠️ Important Notes

1. **Security First**: Always use HTTPS in production and keep secrets secure
2. **Database Separation**: Use external managed database for production
3. **Backup Everything**: Automated backups are configured but test restoration
4. **Monitor Resources**: Keep an eye on CPU, memory, and disk usage
5. **Update Regularly**: Keep system packages and Docker images updated
6. **Test Thoroughly**: Always test in staging before production deployment

## 📞 Emergency Contacts

- **System Administrator**: [Your Contact]
- **Database Administrator**: [Your Contact]
- **Development Team**: [Your Contact]
- **Hosting Provider**: [Your Contact]

---

**✅ Checklist Complete? Ready for Production Deployment!**

Once all items are checked, proceed with the deployment using the provided scripts.
