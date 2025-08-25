#!/bin/bash

# PM-App Production Deployment Script for Ubuntu 20.04 LTS
# IP: 198.163.207.39

set -e

echo "🚀 Starting PM-App Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/pm-app"
BACKUP_DIR="/opt/pm-app-backups"
LOG_FILE="/var/log/pm-app-deploy.log"
USER="pm-app"
GROUP="pm-app"

# Functions
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
fi

# System Updates and Dependencies
log "Updating Ubuntu 20.04 LTS system..."
apt-get update && apt-get upgrade -y

log "Installing required system packages..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    logrotate \
    htop \
    tree

# Install Docker
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    log "Docker installed successfully"
else
    log "Docker already installed"
fi

# Install Docker Compose
log "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    log "Docker Compose installed successfully"
else
    log "Docker Compose already installed"
fi

# Create system user for PM-App
log "Creating PM-App system user..."
if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/false -d "$PROJECT_DIR" "$USER"
    log "User $USER created"
else
    log "User $USER already exists"
fi

# Add user to docker group
usermod -aG docker "$USER"

# Create directories
log "Creating project directories..."
mkdir -p "$PROJECT_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "/var/log/pm-app"
mkdir -p "/var/uploads/pm-app"

# Set permissions
chown -R "$USER:$GROUP" "$PROJECT_DIR"
chown -R "$USER:$GROUP" "/var/log/pm-app"
chown -R "$USER:$GROUP" "/var/uploads/pm-app"
chmod 755 "$PROJECT_DIR"
chmod 755 "/var/log/pm-app"
chmod 755 "/var/uploads/pm-app"

# Configure UFW Firewall
log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH
ufw allow ssh

# Allow HTTP and HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw --force enable

# Configure fail2ban
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/caddy/*.log
EOF

systemctl enable fail2ban
systemctl restart fail2ban

# Configure log rotation
log "Configuring log rotation..."
cat > /etc/logrotate.d/pm-app << EOF
/var/log/pm-app/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $GROUP
    postrotate
        docker-compose -f $PROJECT_DIR/docker-compose.caddy.yml restart pm-app > /dev/null 2>&1 || true
    endscript
}

/var/log/pm-app-deploy.log {
    weekly
    rotate 4
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

# Create systemd service
log "Creating systemd service..."
cat > /etc/systemd/system/pm-app.service << EOF
[Unit]
Description=PM-App Production Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$PROJECT_DIR
User=root
Group=root
ExecStart=/usr/local/bin/docker-compose -f docker-compose.caddy.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.caddy.yml down
ExecReload=/usr/local/bin/docker-compose -f docker-compose.caddy.yml restart
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable pm-app

# Create backup script
log "Creating backup script..."
cat > /usr/local/bin/pm-app-backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/pm-app-backups"
PROJECT_DIR="/opt/pm-app"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/pm-app-files-$DATE.tar.gz" -C "$PROJECT_DIR" .

# Backup Docker volumes
docker run --rm -v pm-app_pm-app-uploads:/data -v "$BACKUP_DIR":/backup alpine tar czf "/backup/pm-app-uploads-$DATE.tar.gz" -C /data .

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/pm-app-backup.sh

# Add backup to crontab
log "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/pm-app-backup.sh >> /var/log/pm-app-backup.log 2>&1") | crontab -

# Set up monitoring script
log "Creating monitoring script..."
cat > /usr/local/bin/pm-app-monitor.sh << 'EOF'
#!/bin/bash

PROJECT_DIR="/opt/pm-app"
LOG_FILE="/var/log/pm-app-monitor.log"

cd "$PROJECT_DIR"

# Check if containers are running
if ! docker-compose -f docker-compose.caddy.yml ps | grep -q "Up"; then
    echo "[$(date)] PM-App containers not running, restarting..." >> "$LOG_FILE"
    docker-compose -f docker-compose.caddy.yml up -d
fi

# Check application health
if ! curl -f -s https://198.163.207.39/api/health > /dev/null 2>&1; then
    echo "[$(date)] PM-App health check failed, restarting..." >> "$LOG_FILE"
    docker-compose -f docker-compose.caddy.yml restart pm-app
fi
EOF

chmod +x /usr/local/bin/pm-app-monitor.sh

# Add monitoring to crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/pm-app-monitor.sh") | crontab -

# Setup SSL certificate directory
mkdir -p /etc/ssl/pm-app
chown -R "$USER:$GROUP" /etc/ssl/pm-app

# Print summary
log "🎉 PM-App production environment setup completed!"
echo ""
echo -e "${GREEN}=== Deployment Summary ===${NC}"
echo -e "${BLUE}Project Directory:${NC} $PROJECT_DIR"
echo -e "${BLUE}Backup Directory:${NC} $BACKUP_DIR"
echo -e "${BLUE}Log Files:${NC} /var/log/pm-app/"
echo -e "${BLUE}System User:${NC} $USER"
echo -e "${BLUE}Service:${NC} pm-app.service"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Copy your application files to $PROJECT_DIR"
echo "2. Configure your .env.production file with actual database credentials"
echo "3. Update the Caddyfile with your domain (if applicable)"
echo "4. Run: cd $PROJECT_DIR && sudo systemctl start pm-app"
echo "5. Check status: sudo systemctl status pm-app"
echo "6. View logs: sudo docker-compose -f docker-compose.caddy.yml logs -f"
echo ""
echo -e "${GREEN}🔒 Security configured:${NC}"
echo "- UFW firewall enabled (ports 22, 80, 443)"
echo "- fail2ban configured for SSH and web protection"
echo "- System user created with limited privileges"
echo "- Log rotation configured"
echo "- Automated backups scheduled (daily at 2 AM)"
echo "- Health monitoring every 5 minutes"
echo ""
echo -e "${BLUE}🌐 Application will be available at:${NC}"
echo "- https://198.163.207.39 (HTTPS - recommended)"
echo "- http://198.163.207.39 (HTTP - redirects to HTTPS)"

log "Setup script completed successfully!"
