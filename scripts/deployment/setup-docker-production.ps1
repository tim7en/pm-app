# Production Docker Setup Script for Windows
# This script prepares the environment for production deployment on Windows

Write-Host "🚀 Setting up PM-App for Docker production deployment..." -ForegroundColor Green

# Create necessary directories
Write-Host "📁 Creating required directories..." -ForegroundColor Yellow
$dirs = @("docker-volumes\data", "docker-volumes\logs", "docker-volumes\uploads", "backups", "ssl", "secrets")
foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Gray
    }
}

# Generate secure secrets if they don't exist
Write-Host "🔐 Generating secure secrets..." -ForegroundColor Yellow

if (!(Test-Path ".env.docker.local")) {
    Write-Host "📝 Creating .env.docker.local from template..." -ForegroundColor Cyan
    
    # Copy template
    Copy-Item ".env.docker" ".env.docker.local"
    
    # Generate secure random secrets
    function Generate-SecureSecret {
        param([int]$Length = 32)
        $bytes = New-Object byte[] $Length
        [System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
        return [Convert]::ToBase64String($bytes).Substring(0, $Length)
    }
    
    $nextAuthSecret = Generate-SecureSecret -Length 32
    $jwtSecret = Generate-SecureSecret -Length 32
    $postgresPassword = Generate-SecureSecret -Length 24
    
    # Update the environment file
    $envContent = Get-Content ".env.docker.local" -Raw
    $envContent = $envContent -replace "CHANGE_ME_TO_STRONG_RANDOM_STRING_32_CHARS_MINIMUM", $nextAuthSecret
    $envContent = $envContent -replace "CHANGE_ME_TO_ANOTHER_STRONG_RANDOM_STRING_32_CHARS_MINIMUM", $jwtSecret
    Set-Content ".env.docker.local" $envContent
    
    # Save database password as secret
    Set-Content "secrets\postgres_password.txt" $postgresPassword
    
    Write-Host "✅ Environment file created: .env.docker.local" -ForegroundColor Green
    Write-Host "⚠️  Please update the API keys and other secrets in .env.docker.local" -ForegroundColor Yellow
} else {
    Write-Host "✅ Environment file already exists" -ForegroundColor Green
}

# Create database initialization script
Write-Host "📄 Creating database initialization script..." -ForegroundColor Yellow
$initScript = @'
-- Initialize PM-App database for production
-- This script runs automatically when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create indexes for better performance (Prisma will create tables)
-- These will be created after Prisma migration
'@

if (!(Test-Path "init-scripts")) {
    New-Item -ItemType Directory -Path "init-scripts" -Force | Out-Null
}
Set-Content "init-scripts\01-init.sql" $initScript

# Verify Docker and Docker Compose
Write-Host "🔍 Verifying Docker setup..." -ForegroundColor Yellow

try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please ensure Docker Desktop is properly installed." -ForegroundColor Red
    exit 1
}

# Build the Docker image
Write-Host "🏗️  Building production Docker image..." -ForegroundColor Yellow
try {
    docker build -t pm-app:latest .
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Create health check script
$healthCheckScript = @'
# Health check script for Docker deployment
Write-Host "🔍 Performing health checks..." -ForegroundColor Yellow

# Check if containers are running
$containers = docker-compose ps --services --filter "status=running"
if ($containers.Count -gt 0) {
    Write-Host "✅ Containers are running" -ForegroundColor Green
} else {
    Write-Host "❌ Some containers are not running" -ForegroundColor Red
    docker-compose ps
    exit 1
}

# Check application health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is healthy" -ForegroundColor Green
    } else {
        throw "Health check returned status: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Application health check failed: $_" -ForegroundColor Red
    exit 1
}

# Check nginx health
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Nginx is healthy" -ForegroundColor Green
    } else {
        throw "Nginx health check returned status: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Nginx health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 All health checks passed!" -ForegroundColor Green
'@

Set-Content "docker-health-check.ps1" $healthCheckScript

# Create deployment script
$deployScript = @'
# Deploy PM-App with Docker Compose
Write-Host "🚀 Deploying PM-App with Docker..." -ForegroundColor Green

# Pull latest images
Write-Host "📥 Pulling latest images..." -ForegroundColor Yellow
docker-compose pull

# Build the application
Write-Host "🏗️  Building application..." -ForegroundColor Yellow
docker-compose build --no-cache

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Start services
Write-Host "▶️  Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be ready
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Run health checks
Write-Host "🔍 Running health checks..." -ForegroundColor Yellow
& .\docker-health-check.ps1

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Application is available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📊 Nginx status at: http://localhost/health" -ForegroundColor Cyan
'@

Set-Content "deploy-docker.ps1" $deployScript

Write-Host ""
Write-Host "🎉 Docker production setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update API keys and secrets in .env.docker.local"
Write-Host "2. Review and customize docker-compose.yml settings"  
Write-Host "3. For SSL: place certificates in .\ssl\ directory"
Write-Host "4. Run: .\deploy-docker.ps1 to start the application"
Write-Host ""
Write-Host "📚 Available commands:" -ForegroundColor Cyan
Write-Host "  .\deploy-docker.ps1        - Deploy the application"
Write-Host "  .\docker-health-check.ps1  - Check application health"
Write-Host "  docker-compose logs -f     - View application logs"
Write-Host "  docker-compose down        - Stop the application"
Write-Host ""
