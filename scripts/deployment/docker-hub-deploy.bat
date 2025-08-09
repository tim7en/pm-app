@echo off
:: Docker Hub Deployment Script for PM-App (Windows)
:: This script builds and pushes your PM app to Docker Hub

echo 🐳 Building and deploying PM-App to Docker Hub...

:: Configuration
set DOCKER_USERNAME=tim7en
set APP_NAME=pm-app
set VERSION=%1
if "%VERSION%"=="" set VERSION=latest

echo Version: %VERSION%

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

:: Login check and prompt
echo 🔐 Make sure you're logged into Docker Hub
docker login

:: Build the image
echo 🔨 Building Docker image...
docker build -t %DOCKER_USERNAME%/%APP_NAME%:%VERSION% .

:: Tag as latest if not already
if not "%VERSION%"=="latest" (
    docker tag %DOCKER_USERNAME%/%APP_NAME%:%VERSION% %DOCKER_USERNAME%/%APP_NAME%:latest
)

:: Push to Docker Hub
echo 📤 Pushing to Docker Hub...
docker push %DOCKER_USERNAME%/%APP_NAME%:%VERSION%

if not "%VERSION%"=="latest" (
    docker push %DOCKER_USERNAME%/%APP_NAME%:latest
)

echo ✅ Successfully deployed to Docker Hub!
echo 🌐 Your app is now available at:
echo    docker pull %DOCKER_USERNAME%/%APP_NAME%:%VERSION%
echo    docker pull %DOCKER_USERNAME%/%APP_NAME%:latest

echo.
echo 🚀 Quick deployment command for your server:
echo docker run -d --name pm-app --env-file .env.production -p 80:3000 -v pm-app-data:/app/data --restart unless-stopped %DOCKER_USERNAME%/%APP_NAME%:latest

echo.
echo 📋 Next steps:
echo 1. Copy the deployment command above
echo 2. SSH to your server: ssh user@your-server.com
echo 3. Create .env.production file with your real secrets
echo 4. Run the deployment command
echo 5. Setup SSL with Let's Encrypt

pause
