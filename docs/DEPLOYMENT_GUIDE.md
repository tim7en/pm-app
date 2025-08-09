# Deployment Guide for PM-App

## 🚀 Deployment Options

### Option 1: Docker Hub Deployment (Recommended) 🐳
- **Easy**: One-command deployment
- **Scalable**: Works on any Docker-enabled server
- **Portable**: Deploy anywhere with Docker

### Option 2: Traditional Ubuntu Server 🖥️
- **RAM**: 2 GB
- **Storage**: 15 GB HDD  
- **CPU**: 1 vCPU
- **OS**: Ubuntu 20.04 LTS

## Prerequisites

### For Docker Deployment:
- Docker installed on target server
- Docker Hub account
- SSH access to your server

### For Traditional Deployment:
- SSH access to your server
- Domain name pointing to your server IP
- Basic Linux command line knowledge

## 🐳 Docker Hub Deployment (Recommended)

### Step 1: Prepare Environment Variables

Create a production environment file on your server:

```bash
# On your server, create the environment file
cat > .env.production << 'EOF'
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Database (will be created inside container)
DATABASE_URL=file:./data/production.db

# Authentication & Security - REPLACE WITH REAL VALUES
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-at-least-32-chars-long-CHANGE-THIS
NEXTAUTH_URL=https://your-domain.com
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars-long-CHANGE-THIS

# OpenAI API (for AI features) - ADD YOUR KEYS
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_API_KEY_2=your-backup-openai-api-key-here

# Google OAuth (for Gmail integration) - ADD YOUR CREDENTIALS
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/email/gmail/callback

# Email SMTP Configuration - CONFIGURE YOUR EMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_email@gmail.com

# Production settings
NEXT_TELEMETRY_DISABLED=1
EOF
```

### Step 2: Deploy from Docker Hub

```bash
# Pull and run the PM app from Docker Hub
docker run -d \
  --name pm-app \
  --env-file .env.production \
  -p 80:3000 \
  -v pm-app-data:/app/data \
  --restart unless-stopped \
  tim7en/pm-app:latest
```

### Step 3: Setup with Docker Compose (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  pm-app:
    image: tim7en/pm-app:latest
    container_name: pm-app
    restart: unless-stopped
    ports:
      - "80:3000"
    env_file:
      - .env.production
    volumes:
      - pm-app-data:/app/data
      - pm-app-uploads:/app/public/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: pm-app-nginx
    restart: unless-stopped
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - pm-app

volumes:
  pm-app-data:
  pm-app-uploads:
```

Then deploy:

```bash
# Deploy with Docker Compose
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f pm-app
```

### Step 4: SSL Setup with Nginx

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server pm-app:3000;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name your-domain.com;
        
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        
        client_max_body_size 100M;
        
        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
        
        location /api/socketio/ {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📦 Building and Pushing to Docker Hub

### For Developers: Building Your Own Image

```bash
# 1. Build the Docker image
docker build -t tim7en/pm-app:latest .

# 2. Test locally
docker run -p 3000:3000 --env-file .env tim7en/pm-app:latest

# 3. Login to Docker Hub
docker login

# 4. Push to Docker Hub
docker push tim7en/pm-app:latest

# 5. Tag specific version
docker tag tim7en/pm-app:latest tim7en/pm-app:v1.0.0
docker push tim7en/pm-app:v1.0.0
```

---

## 🖥️ Traditional Ubuntu Server Deployment

### Step 1: Server Setup

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
