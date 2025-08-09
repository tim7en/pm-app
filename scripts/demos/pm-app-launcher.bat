@echo off
setlocal enabledelayedexpansion

REM PM-App Production Launcher
REM Quick deployment script for Windows

echo.
echo ================================
echo    PM-App Production Launcher
echo ================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed or not in PATH
    echo.
    echo Please install Docker Desktop from:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    echo After installation, restart this script.
    pause
    exit /b 1
)

echo [INFO] Docker is installed and available
echo.

REM Check if .env.docker.local exists
if not exist ".env.docker.local" (
    echo [INFO] Creating environment configuration...
    copy ".env.docker" ".env.docker.local" >nul
    echo [WARN] Please edit .env.docker.local to add your secrets:
    echo        - NEXTAUTH_SECRET ^(64 characters^)
    echo        - JWT_SECRET ^(64 characters^)
    echo        - OPENAI_API_KEY ^(optional^)
    echo        - GOOGLE_CLIENT_ID/SECRET ^(optional^)
    echo.
    echo Would you like to edit the file now? ^(y/n^)
    set /p edit_env=
    if /i "!edit_env!"=="y" (
        notepad ".env.docker.local"
    )
)

REM Create necessary directories
echo [INFO] Creating required directories...
if not exist "docker-volumes" mkdir "docker-volumes"
if not exist "docker-volumes\data" mkdir "docker-volumes\data"
if not exist "docker-volumes\logs" mkdir "docker-volumes\logs"
if not exist "docker-volumes\uploads" mkdir "docker-volumes\uploads"
if not exist "docker-volumes\backups" mkdir "docker-volumes\backups"
if not exist "docker-volumes\ssl" mkdir "docker-volumes\ssl"
if not exist "docker-volumes\secrets" mkdir "docker-volumes\secrets"

echo [INFO] Directory structure created successfully
echo.

REM Display menu
:menu
echo Choose deployment option:
echo.
echo 1^) Development Mode ^(SQLite, hot reload^)
echo 2^) Production Mode ^(SQLite, optimized^)
echo 3^) Production + PostgreSQL ^(recommended for production^)
echo 4^) Build only ^(no start^)
echo 5^) View logs
echo 6^) Stop services
echo 7^) Clean up ^(remove containers and images^)
echo 8^) Health check
echo 9^) Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto dev_mode
if "%choice%"=="2" goto prod_mode
if "%choice%"=="3" goto prod_postgres
if "%choice%"=="4" goto build_only
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto stop_services
if "%choice%"=="7" goto cleanup
if "%choice%"=="8" goto health_check
if "%choice%"=="9" goto exit

echo Invalid choice. Please try again.
goto menu

:dev_mode
echo.
echo [INFO] Starting Development Mode...
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo [ERROR] Failed to start development services
    goto menu
)
echo [SUCCESS] Development mode started!
echo [INFO] Application: http://localhost:3000
echo [INFO] Hot reload enabled
goto menu

:prod_mode
echo.
echo [INFO] Building and starting Production Mode...
docker build -t pm-app:latest .
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
    goto menu
)
docker-compose up -d
if errorlevel 1 (
    echo [ERROR] Failed to start production services
    goto menu
)
echo [SUCCESS] Production mode started!
echo [INFO] Application: http://localhost:3000
echo [INFO] Nginx Proxy: http://localhost
goto menu

:prod_postgres
echo.
echo [INFO] Starting Production with PostgreSQL...
docker build -t pm-app:latest .
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
    goto menu
)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
if errorlevel 1 (
    echo [ERROR] Failed to start production services with PostgreSQL
    goto menu
)
echo [SUCCESS] Production with PostgreSQL started!
echo [INFO] Application: http://localhost:3000
echo [INFO] Database: PostgreSQL
echo [INFO] Nginx Proxy: http://localhost
goto menu

:build_only
echo.
echo [INFO] Building Docker image...
docker build -t pm-app:latest .
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
) else (
    echo [SUCCESS] Docker image built successfully!
)
goto menu

:view_logs
echo.
echo [INFO] Showing application logs (Ctrl+C to exit)...
docker-compose logs -f pm-app
goto menu

:stop_services
echo.
echo [INFO] Stopping all services...
docker-compose down
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
echo [SUCCESS] All services stopped
goto menu

:cleanup
echo.
echo [WARN] This will remove all containers, images, and unused resources
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo [INFO] Cleaning up Docker resources...
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down -v
docker rmi pm-app:latest 2>nul
docker system prune -f
echo [SUCCESS] Cleanup completed
goto menu

:health_check
echo.
echo [INFO] Checking application health...
curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Application health check failed
    echo [INFO] Is the application running? Try option 2 or 3 to start it.
) else (
    echo [SUCCESS] Application is healthy!
    echo [INFO] Testing API endpoint...
    curl -s http://localhost:3000/api/health
)
echo.
goto menu

:exit
echo.
echo Thank you for using PM-App Production Launcher!
echo.
pause
exit /b 0
