#!/bin/bash
# Production Docker Setup Script
# This script prepares the environment for production deployment

set -e

echo "🚀 Setting up PM-App for Docker production deployment..."

# Create necessary directories
echo "📁 Creating required directories..."
mkdir -p docker-volumes/{data,logs,uploads}
mkdir -p backups
mkdir -p ssl
mkdir -p secrets

# Set proper permissions
chmod 755 docker-volumes
chmod 755 docker-volumes/{data,logs,uploads}
chmod 700 secrets

# Generate secure secrets if they don't exist
echo "🔐 Generating secure secrets..."

if [ ! -f ".env.docker" ]; then
    echo "📝 Creating .env.docker from template..."
    cp .env.docker .env.docker.local
    
    # Generate secure random secrets
    NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')
    
    # Update the environment file
    sed -i.bak "s/CHANGE_ME_TO_STRONG_RANDOM_STRING_32_CHARS_MINIMUM/$NEXTAUTH_SECRET/g" .env.docker.local
    sed -i.bak "s/CHANGE_ME_TO_ANOTHER_STRONG_RANDOM_STRING_32_CHARS_MINIMUM/$JWT_SECRET/g" .env.docker.local
    
    # Save database password as secret
    echo "$POSTGRES_PASSWORD" > secrets/postgres_password.txt
    chmod 600 secrets/postgres_password.txt
    
    echo "✅ Environment file created: .env.docker.local"
    echo "⚠️  Please update the API keys and other secrets in .env.docker.local"
else
    echo "✅ Environment file already exists"
fi

# Create database initialization script
echo "📄 Creating database initialization script..."
cat > init-scripts/01-init.sql << 'EOF'
-- Initialize PM-App database for production
-- This script runs automatically when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (Prisma will create tables)
-- These will be created after Prisma migration
EOF

# Verify Docker and Docker Compose
echo "🔍 Verifying Docker setup..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build the Docker image
echo "🏗️  Building production Docker image..."
docker build -t pm-app:latest .

echo "✅ Docker image built successfully"

# Create a simple health check script
cat > docker-health-check.sh << 'EOF'
#!/bin/bash
# Health check script for Docker deployment

echo "🔍 Performing health checks..."

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Containers are running"
else
    echo "❌ Some containers are not running"
    docker-compose ps
    exit 1
fi

# Check application health
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed"
    exit 1
fi

# Check nginx health  
if curl -f -s http://localhost/health > /dev/null; then
    echo "✅ Nginx is healthy"
else
    echo "❌ Nginx health check failed"
    exit 1
fi

echo "🎉 All health checks passed!"
EOF

chmod +x docker-health-check.sh

# Create deployment script
cat > deploy-docker.sh << 'EOF'
#!/bin/bash
# Deploy PM-App with Docker Compose

set -e

echo "🚀 Deploying PM-App with Docker..."

# Pull latest images
echo "📥 Pulling latest images..."
docker-compose pull

# Build the application
echo "🏗️  Building application..."
docker-compose build --no-cache

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run health checks
echo "🔍 Running health checks..."
./docker-health-check.sh

echo "✅ Deployment completed successfully!"
echo "🌐 Application is available at: http://localhost:3000"
echo "📊 Nginx status at: http://localhost/health"
EOF

chmod +x deploy-docker.sh

echo ""
echo "🎉 Docker production setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Update API keys and secrets in .env.docker.local"
echo "2. Review and customize docker-compose.yml settings"
echo "3. For SSL: place certificates in ./ssl/ directory"
echo "4. Run: ./deploy-docker.sh to start the application"
echo ""
echo "📚 Available commands:"
echo "  ./deploy-docker.sh        - Deploy the application"
echo "  ./docker-health-check.sh  - Check application health"
echo "  docker-compose logs -f    - View application logs"
echo "  docker-compose down       - Stop the application"
echo ""
