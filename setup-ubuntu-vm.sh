#!/bin/bash

# PM-App Ubuntu VM Deployment Script
# Run this script on your Ubuntu VM (198.163.207.39)

set -e  # Exit on any error

echo "=========================================="
echo "    PM-App Ubuntu VM Setup Script"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   print_status "Please run as a regular user with sudo privileges"
   exit 1
fi

# Update system
print_step "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    print_step "Installing Docker..."
    
    # Install prerequisites
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_status "Docker installed successfully"
    print_warning "Please log out and log back in to use Docker without sudo"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    print_step "Installing Docker Compose..."
    
    # Get latest version of Docker Compose
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make it executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install Git if not already installed
if ! command -v git &> /dev/null; then
    print_step "Installing Git..."
    sudo apt install -y git
else
    print_status "Git is already installed"
fi

# Install Node.js and npm (for local development/testing)
if ! command -v node &> /dev/null; then
    print_step "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    print_status "Node.js is already installed"
fi

# Install UFW firewall and configure
print_step "Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 3000/tcp  # PM-App
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Create application directory
print_step "Creating application directory..."
APP_DIR="/home/$USER/pm-app"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone repository if it doesn't exist
if [ ! -d ".git" ]; then
    print_step "Cloning PM-App repository..."
    print_warning "You'll need to provide your GitHub credentials or set up SSH keys"
    read -p "Enter your GitHub repository URL (https://github.com/tim7en/pm-app.git): " REPO_URL
    REPO_URL=${REPO_URL:-"https://github.com/tim7en/pm-app.git"}
    git clone "$REPO_URL" .
else
    print_status "Repository already exists, pulling latest changes..."
    git pull origin master
fi

# Create production environment file
print_step "Creating production environment configuration..."
if [ ! -f ".env.production" ]; then
    cp .env.production.template .env.production
    print_warning "Please edit .env.production with your actual production values:"
    print_status "nano .env.production"
    print_status ""
    print_status "Required changes:"
    print_status "1. Set NEXTAUTH_SECRET (64 random characters)"
    print_status "2. Set JWT_SECRET (64 random characters)"
    print_status "3. Add your API keys (OpenAI, Google OAuth, etc.)"
    print_status "4. Configure database settings if using PostgreSQL"
    print_status ""
else
    print_status ".env.production already exists"
fi

# Create necessary directories
print_step "Creating required directories..."
mkdir -p docker-volumes/{data,logs,uploads,backups,ssl,secrets}
mkdir -p data

# Set proper permissions
chmod 755 docker-volumes
chmod 755 data

# Create Docker secrets directory
print_step "Setting up Docker secrets..."
mkdir -p docker-volumes/secrets
chmod 700 docker-volumes/secrets

print_status "Basic setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Edit .env.production with your actual values: nano .env.production"
print_status "2. If you logged out for Docker group, log back in"
print_status "3. Run: ./deploy-ubuntu.sh to build and start the application"
print_status ""
print_status "Your application will be available at: http://198.163.207.39:3000"
print_status ""
