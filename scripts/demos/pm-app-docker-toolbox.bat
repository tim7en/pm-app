@echo off
setlocal enabledelayedexpansion

REM PM-App Docker Toolbox Launcher
REM Automated launcher for Windows 10 using Docker Toolbox

echo.
echo ========================================
echo    PM-App Docker Toolbox Launcher
echo ========================================
echo.

REM Add Docker Toolbox to PATH
set PATH=%PATH%;C:\Program Files\Docker Toolbox

REM Check if Docker machine is running
echo [INFO] Checking Docker machine status...
docker-machine status default >nul 2>&1
if errorlevel 1 (
    echo [INFO] Starting Docker machine...
    docker-machine start default
) else (
    echo [INFO] Docker machine is already running
)

REM Configure Docker environment
echo [INFO] Configuring Docker environment...
FOR /f "tokens=*" %%i IN ('docker-machine env default') DO (
    echo %%i | findstr "export" >nul
    if not errorlevel 1 (
        set line=%%i
        set line=!line:export =!
        set line=!line:"=!
        for /f "tokens=1,2 delims==" %%a in ("!line!") do (
            set %%a=%%b
        )
    )
)

REM Set Docker environment variables manually
FOR /f "tokens=2 delims= " %%i IN ('docker-machine ip default') DO set DOCKER_HOST=tcp://%%i:2376
set DOCKER_TLS_VERIFY=1
set DOCKER_CERT_PATH=%USERPROFILE%\.docker\machine\machines\default

echo [INFO] Docker environment configured
echo [INFO] Docker Host: %DOCKER_HOST%
echo.

REM Test Docker connection
echo [INFO] Testing Docker connection...
docker --version
if errorlevel 1 (
    echo [ERROR] Docker connection failed
    pause
    exit /b 1
)

echo [SUCCESS] Docker is ready!
echo.

REM Check if .env.docker.local exists
if not exist ".env.docker.local" (
    echo [INFO] Creating environment configuration...
    copy ".env.docker" ".env.docker.local" >nul
    echo [WARN] Please edit .env.docker.local to add your secrets
    echo.
)

REM Display menu
:menu
echo Choose deployment option:
echo.
echo 1^) Build PM-App Docker image
echo 2^) Start Development Mode ^(with docker-compose^)
echo 3^) Start Production Mode
echo 4^) View running containers
echo 5^) View logs
echo 6^) Stop all containers
echo 7^) Clean up containers and images
echo 8^) Test Docker connection
echo 9^) Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto build_image
if "%choice%"=="2" goto dev_mode
if "%choice%"=="3" goto prod_mode
if "%choice%"=="4" goto list_containers
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto stop_containers
if "%choice%"=="7" goto cleanup
if "%choice%"=="8" goto test_docker
if "%choice%"=="9" goto exit

echo Invalid choice. Please try again.
goto menu

:build_image
echo.
echo [INFO] Building PM-App Docker image...
docker build -t pm-app:latest .
if errorlevel 1 (
    echo [ERROR] Failed to build Docker image
) else (
    echo [SUCCESS] Docker image built successfully!
)
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
echo [INFO] Application will be available at: http://192.168.99.100:3000
echo [INFO] To find the exact IP, run: docker-machine ip default
goto menu

:prod_mode
echo.
echo [INFO] Starting Production Mode...
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
echo [INFO] Application will be available at: http://192.168.99.100:3000
echo [INFO] Nginx proxy at: http://192.168.99.100
goto menu

:list_containers
echo.
echo [INFO] Running containers:
docker ps
echo.
echo [INFO] Docker machine IP:
docker-machine ip default
goto menu

:view_logs
echo.
echo [INFO] Showing application logs (Ctrl+C to exit)...
docker-compose logs -f pm-app
goto menu

:stop_containers
echo.
echo [INFO] Stopping all containers...
docker-compose down
docker-compose -f docker-compose.dev.yml down
echo [SUCCESS] All containers stopped
goto menu

:cleanup
echo.
echo [WARN] This will remove all containers and images
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto menu

echo [INFO] Cleaning up Docker resources...
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
echo [SUCCESS] Cleanup completed
goto menu

:test_docker
echo.
echo [INFO] Testing Docker connection...
docker --version
echo [INFO] Docker machine status:
docker-machine status default
echo [INFO] Docker machine IP:
docker-machine ip default
echo [INFO] Running hello-world test:
docker run hello-world
goto menu

:exit
echo.
echo Thank you for using PM-App Docker Toolbox Launcher!
echo.
echo NOTE: Your app will be available at the Docker machine IP address.
echo To get the IP address, run: docker-machine ip default
echo.
pause
exit /b 0
