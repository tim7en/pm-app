# Domain Migration Summary: uzwire.uz → tasken.uz

## Overview
Successfully updated the PM-App deployment documentation to use the new domain `tasken.uz` instead of `uzwire.uz`.

## Changes Made

### Files Updated
- **Primary File**: `/docs/UBUNTU_PRODUCTION_DEPLOYMENT_GUIDE.template.md`
  - Total replacements: 42 instances of `uzwire.uz` → `tasken.uz`

### Specific Sections Updated

#### 1. Server Information
- Domain reference in overview section
- Production URLs configuration

#### 2. Environment Variables
```bash
# Updated URLs
APP_URL=https://tasken.uz
NEXTAUTH_URL=https://tasken.uz
GOOGLE_REDIRECT_URI="https://tasken.uz/api/email/gmail/callback"
ALLOWED_ORIGINS=https://tasken.uz,http://localhost:3000
```

#### 3. Domain Setup & Configuration
- DNS configuration commands
- Domain resolution verification
- SSL certificate paths and references

#### 4. Nginx Configuration
- Server configuration file paths: `/etc/nginx/sites-available/tasken.uz`
- SSL certificate paths: `/etc/letsencrypt/live/tasken.uz/`
- Log file paths: `/var/log/nginx/tasken.uz_*.log`

#### 5. Monitoring & Health Checks
- Health check URLs: `https://tasken.uz/api/health`
- SSL certificate verification commands
- Performance testing endpoints

#### 6. Backup & Maintenance Scripts
- Nginx configuration backup paths
- SSL certificate backup paths
- Monitoring script URLs

#### 7. Deployment & Testing
- Pre-deployment and post-deployment health checks
- Load testing endpoints
- SSL verification commands

#### 8. Documentation Sections
- Checklists and verification steps
- Production status reports
- Quick reference URLs
- Log locations

## Required Manual Actions

When implementing this domain change in production, you'll need to:

### 1. DNS Configuration
```bash
# Update DNS A record for tasken.uz to point to: 198.163.207.39
# Verify DNS propagation:
nslookup tasken.uz
```

### 2. SSL Certificate
```bash
# Obtain new SSL certificate for tasken.uz
sudo certbot certonly --nginx -d tasken.uz -d www.tasken.uz
```

### 3. Nginx Configuration
```bash
# Create new nginx site configuration
sudo cp /etc/nginx/sites-available/uzwire.uz /etc/nginx/sites-available/tasken.uz
sudo nano /etc/nginx/sites-available/tasken.uz
# Update server_name to tasken.uz and www.tasken.uz
# Update SSL certificate paths

# Enable the new site
sudo ln -s /etc/nginx/sites-available/tasken.uz /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Environment Variables
```bash
# Update .env.production file with new domain URLs
cd /opt/pm-app
sudo nano .env.production
# Update APP_URL, NEXTAUTH_URL, GOOGLE_REDIRECT_URI, ALLOWED_ORIGINS
```

### 5. Google OAuth Configuration
- Update Google Cloud Console OAuth settings
- Add `https://tasken.uz/api/email/gmail/callback` as authorized redirect URI
- Update any other OAuth provider settings if applicable

### 6. Application Restart
```bash
# Restart the application to pick up new environment variables
cd /opt/pm-app
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

### 7. Verification
```bash
# Verify new domain is working
curl -I https://tasken.uz
curl https://tasken.uz/api/health

# Check SSL certificate
echo | openssl s_client -connect tasken.uz:443 2>/dev/null | openssl x509 -noout -dates
```

## Files Not Requiring Changes

The following files were checked and do **not** contain domain-specific references:
- `nginx.conf` (uses generic upstream configuration)
- `docker-compose*.yml` files (use environment variables)
- Source code files in `src/` (use environment variables)
- Package configuration files

## Notes

- The deployment guide template has been fully updated
- All monitoring scripts, backup procedures, and troubleshooting commands now reference the new domain
- The changes maintain all existing functionality while updating domain references
- No code changes are required as the application uses environment variables for domain configuration

## Validation

✅ All 42 instances of `uzwire.uz` have been replaced with `tasken.uz`  
✅ No remaining references to the old domain found in the codebase  
✅ Configuration files use environment variables (no hard-coded domains)  
✅ Nginx configuration is generic and domain-agnostic  
✅ Docker setup uses environment-based configuration  

The domain migration documentation is now complete and ready for production implementation.
