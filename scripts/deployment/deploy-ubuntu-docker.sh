#!/bin/bash

# PM-App Ubuntu VM Deployment Script - Modern Docker Approach
# Deploy PM-App using Docker on Ubuntu VM with best practices

set -e  # Exit on any error

echo "=========================================="
echo "    PM-App Ubuntu VM Deployment"
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please run setup-ubuntu-vm.sh first"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please run setup-ubuntu-vm.sh first"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production file not found"
    print_status "Please copy .env.production.template to .env.production and configure it"
    exit 1
fi

# Function to generate random secrets
generate_secret() {
    openssl rand -hex 32
}

# Function to check and update secrets in .env.production
check_secrets() {
    print_step "Checking production secrets..."
    
    # Check if secrets need to be generated
    if grep -q "CHANGE_THIS_TO_64_CHARACTER_RANDOM_STRING" .env.production; then
        print_warning "Found placeholder secrets, generating new ones..."
        
        # Generate new secrets
        NEXTAUTH_SECRET=$(generate_secret)
        JWT_SECRET=$(generate_secret)
        
        # Update .env.production
        sed -i "s/NEXTAUTH_SECRET=CHANGE_THIS_TO_64_CHARACTER_RANDOM_STRING_FOR_PRODUCTION_USE/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env.production
        sed -i "s/JWT_SECRET=CHANGE_THIS_TO_ANOTHER_64_CHARACTER_RANDOM_STRING_FOR_PRODUCTION/JWT_SECRET=$JWT_SECRET/" .env.production
        
        print_status "Generated new production secrets"
    else
        print_status "Production secrets already configured"
    fi
}

# Menu function
show_menu() {
    echo
    echo "Choose deployment option:"
    echo
    echo "1) Initial setup (build image and start services)"
    echo "2) Update and restart (pull latest code, rebuild, restart)"
    echo "3) Start services (if already built)"
    echo "4) Stop services"
    echo "5) View logs"
    echo "6) Check service status"
    echo "7) Clean up (remove all containers and images)"
    echo "8) Backup database"
    echo "9) Restore database"
    echo "10) Shell access to app container"
    echo "11) Exit"
    echo
}

# Function to pull latest code
pull_latest_code() {
    print_step "Pulling latest code from repository..."
    git pull origin master
}

# Function to build Docker image
build_image() {
    print_step "Building PM-App Docker image..."
    docker build -t pm-app:latest .
}

# Function to start services
start_services() {
    print_step "Starting PM-App services..."
    
    # Copy .env.production to .env for Docker
    cp .env.production .env
    
    # Start with production configuration
    docker-compose -f docker-compose.yml up -d
    
    print_status "Services started successfully!"
    print_status "Application available at: http://198.163.207.39:3000"
    print_status "Nginx proxy available at: http://198.163.207.39"
}

# Function to stop services
stop_services() {
    print_step "Stopping PM-App services..."
    docker-compose down
    print_status "Services stopped"
}

# Function to view logs
view_logs() {
    echo "Choose log option:"
    echo "1) Application logs"
    echo "2) Nginx logs"
    echo "3) All logs"
    echo "4) Follow live logs"
    read -p "Enter choice (1-4): " log_choice
    
    case $log_choice in
        1) docker-compose logs pm-app ;;
        2) docker-compose logs nginx ;;
        3) docker-compose logs ;;
        4) docker-compose logs -f ;;
        *) echo "Invalid choice" ;;
    esac
}

# Function to check status
check_status() {
    print_step "Checking service status..."
    echo
    echo "=== Docker containers ==="
    docker-compose ps
    echo
    echo "=== System resources ==="
    docker stats --no-stream
    echo
    echo "=== Disk usage ==="
    df -h
    echo
    echo "=== Memory usage ==="
    free -h
}

# Function to cleanup
cleanup() {
    print_warning "This will remove all containers, images, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Cleaning up Docker resources..."
        docker-compose down -v
        docker system prune -af
        docker volume prune -f
        print_status "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to backup database
backup_database() {
    print_step "Creating database backup..."
    BACKUP_NAME="pm-app-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    # Create backup of data directory
    tar -czf "$BACKUP_NAME" docker-volumes/data/
    
    print_status "Database backup created: $BACKUP_NAME"
    print_status "Backup location: $(pwd)/$BACKUP_NAME"
}

# Function to restore database
restore_database() {
    echo "Available backups:"
    ls -la *.tar.gz 2>/dev/null || echo "No backup files found"
    echo
    read -p "Enter backup filename to restore: " backup_file
    
    if [ -f "$backup_file" ]; then
        print_warning "This will overwrite the current database!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_step "Restoring database from $backup_file..."
            stop_services
            tar -xzf "$backup_file"
            start_services
            print_status "Database restored successfully"
        fi
    else
        print_error "Backup file not found: $backup_file"
    fi
}

# Function to shell access
shell_access() {
    print_step "Opening shell in PM-App container..."
    docker-compose exec pm-app /bin/sh
}

# Check secrets on startup
check_secrets

# Main menu loop
while true; do
    show_menu
    read -p "Enter your choice (1-11): " choice
    
    case $choice in
        1)
            print_step "Starting initial setup..."
            pull_latest_code
            build_image
            start_services
            check_status
            ;;
        2)
            print_step "Updating application..."
            stop_services
            pull_latest_code
            build_image
            start_services
            ;;
        3)
            start_services
            ;;
        4)
            stop_services
            ;;
        5)
            view_logs
            ;;
        6)
            check_status
            ;;
        7)
            cleanup
            ;;
        8)
            backup_database
            ;;
        9)
            restore_database
            ;;
        10)
            shell_access
            ;;
        11)
            print_status "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please try again."
            ;;
    esac
    
    echo
    read -p "Press Enter to continue..."
done
