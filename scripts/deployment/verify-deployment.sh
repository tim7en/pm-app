#!/bin/bash

# Production deployment verification script
set -e

echo "🚀 PM-App Production Deployment Verification"
echo "============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check URL response
check_url() {
    local url=$1
    local expected_status=${2:-200}
    echo "📡 Checking $url..."
    
    if command_exists curl; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
        if [ "$response" = "$expected_status" ]; then
            echo "✅ $url responded with status $response"
            return 0
        else
            echo "❌ $url responded with status $response (expected $expected_status)"
            return 1
        fi
    else
        echo "⚠️  curl not available, skipping URL check"
        return 0
    fi
}

# Check Docker
echo "🐳 Checking Docker..."
if command_exists docker; then
    echo "✅ Docker is installed"
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker daemon is running"
    else
        echo "❌ Docker daemon is not running"
        exit 1
    fi
else
    echo "❌ Docker is not installed"
    exit 1
fi

# Check Docker Compose
echo "📦 Checking Docker Compose..."
if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
    echo "✅ Docker Compose is available"
else
    echo "❌ Docker Compose is not available"
    exit 1
fi

# Build the application
echo "🔨 Building PM-App Docker image..."
docker build -t pm-app-test . --target runner

# Test simple deployment
echo "🧪 Testing simple deployment..."
echo "Starting containers..."

# Use our simple docker-compose configuration
docker-compose -f docker-compose.simple.yml down -v || true
docker-compose -f docker-compose.simple.yml up -d

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 30

# Check health endpoint on both ports
echo "🏥 Checking health endpoints..."
check_url "http://localhost:3000/api/health"
check_url "http://localhost:80/api/health"

# Check if ports are accessible
echo "🔍 Checking port accessibility..."
if command_exists netstat; then
    echo "📊 Port status:"
    netstat -tuln | grep -E ':(3000|80)\s'
elif command_exists ss; then
    echo "📊 Port status:"
    ss -tuln | grep -E ':(3000|80)\s'
fi

# Cleanup
echo "🧹 Cleaning up test deployment..."
docker-compose -f docker-compose.simple.yml down -v

echo ""
echo "✅ Production deployment verification completed successfully!"
echo "🎯 Application can be deployed on ports 3000 and 80"
echo "📖 See PROJECT_STRUCTURE.md for deployment instructions"