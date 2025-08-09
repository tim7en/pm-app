@echo off
setlocal enabledelayedexpansion

REM PM-App Docker Launch Script for Windows
REM This script handles building and running the PM-App in Docker containers

title PM-App Docker Launcher

echo.
echo ============================================
echo   PM-App Docker Deployment for Windows
echo ============================================
echo.

REM Function to check if Docker is running
:check_docker
echo [INFO] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Docker is running

REM Function to check if .env file exists
:check_env_file
echo [INFO] Checking environment file...
if not exist ".env" (
    if exist ".env.docker" (
        echo [WARNING] .env file not found. Copying from .env.docker template...
        copy ".env.docker" ".env" >nul
        echo [WARNING] Please edit .env file with your actual API keys and configuration
        pause
    ) else (
        echo [ERROR] .env file not found. Please create one based on .env.docker template
        pause
        exit /b 1
    )
)
echo [SUCCESS] .env file found

REM Function to clean up existing containers
:cleanup
echo [INFO] Cleaning up existing containers...
docker-compose down --remove-orphans >nul 2>&1
docker-compose -f docker-compose.dev.yml down --remove-orphans >nul 2>&1
echo [SUCCESS] Cleanup completed

REM Main menu
:main_menu
echo.
echo Choose deployment mode:
echo 1. Production mode (recommended for testing)
echo 2. Development mode (for active development)
echo 3. Build and run production
echo 4. View logs
echo 5. Show container status
echo 6. Cleanup and exit
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto production
if "%choice%"=="2" goto development
if "%choice%"=="3" goto build_production
if "%choice%"=="4" goto show_logs
if "%choice%"=="5" goto show_status
if "%choice%"=="6" goto cleanup_exit
if "%choice%"=="7" goto exit
echo Invalid choice. Please try again.
goto main_menu

:production
echo [INFO] Starting PM-App in production mode...
call :cleanup
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start production services
    pause
    goto main_menu
)
echo [SUCCESS] PM-App is running in production mode!
echo.
echo Application: http://localhost:3000
echo Nginx proxy: http://localhost:80
echo.
echo Useful commands:
echo - View logs: docker-compose logs -f pm-app
echo - Stop services: docker-compose down
echo.
pause
goto main_menu

:development
echo [INFO] Starting PM-App in development mode...
call :cleanup
docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start development services
    pause
    goto main_menu
)
echo [SUCCESS] PM-App is running in development mode!
echo.
echo Application: http://localhost:3000
echo Hot reloading enabled
echo.
echo Useful commands:
echo - View logs: docker-compose -f docker-compose.dev.yml logs -f
echo - Stop services: docker-compose -f docker-compose.dev.yml down
echo.
pause
goto main_menu

:build_production
echo [INFO] Building and running in production mode...
call :cleanup
echo [INFO] Building Docker images (this may take a few minutes)...
docker-compose build --no-cache
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker images
    pause
    goto main_menu
)
echo [SUCCESS] Docker images built successfully
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start services
    pause
    goto main_menu
)
echo [SUCCESS] PM-App is running in production mode!
echo Application: http://localhost:3000
pause
goto main_menu

:show_logs
echo [INFO] Checking for running containers...
docker-compose ps | findstr "pm-app" >nul
if %errorlevel% equ 0 (
    echo [INFO] Showing production logs (Press Ctrl+C to stop)...
    docker-compose logs -f pm-app
) else (
    docker-compose -f docker-compose.dev.yml ps | findstr "pm-app-dev" >nul
    if %errorlevel% equ 0 (
        echo [INFO] Showing development logs (Press Ctrl+C to stop)...
        docker-compose -f docker-compose.dev.yml logs -f pm-app-dev
    ) else (
        echo [ERROR] No running PM-App containers found
        pause
    )
)
goto main_menu

:show_status
echo [INFO] Container Status:
echo.
echo Production containers:
docker-compose ps 2>nul || echo No production containers running
echo.
echo Development containers:
docker-compose -f docker-compose.dev.yml ps 2>nul || echo No development containers running
echo.
pause
goto main_menu

:cleanup_exit
call :cleanup
echo [SUCCESS] All containers have been stopped and removed
pause
goto exit

:exit
echo.
echo Thank you for using PM-App Docker Launcher!
pause
exit /b 0
