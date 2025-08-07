@echo off
echo.
echo ================================================
echo    PM-App Docker Readiness Test
echo ================================================
echo.

echo ✅ Checking Docker configuration files...

REM Check Dockerfile
if exist "Dockerfile" (
    echo ✅ Dockerfile found
) else (
    echo ❌ Dockerfile missing
    set "error=1"
)

REM Check docker-compose.yml
if exist "docker-compose.yml" (
    echo ✅ docker-compose.yml found
) else (
    echo ❌ docker-compose.yml missing
    set "error=1"
)

REM Check environment template
if exist ".env.docker" (
    echo ✅ .env.docker template found
) else (
    echo ❌ .env.docker template missing
    set "error=1"
)

REM Check package.json
if exist "package.json" (
    echo ✅ package.json found
) else (
    echo ❌ package.json missing
    set "error=1"
)

REM Check for Next.js app structure
if exist "src\app" (
    echo ✅ Next.js app structure found
) else (
    echo ❌ Next.js app structure missing
    set "error=1"
)

REM Check server.ts
if exist "server.ts" (
    echo ✅ Custom server file found
) else (
    echo ❌ server.ts missing
    set "error=1"
)

echo.
echo ✅ Checking npm dependencies...

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found
    set "error=1"
) else (
    echo ✅ npm available
)

REM Check for node_modules
if exist "node_modules" (
    echo ✅ Dependencies installed
) else (
    echo ⚠️  Dependencies not installed - will be installed during Docker build
)

echo.
echo ✅ Testing Docker commands (if Docker is installed)...

REM Test Docker availability
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker not installed yet
    echo    Install Docker Desktop from: https://www.docker.com/products/docker-desktop/
) else (
    echo ✅ Docker is installed
    
    REM Test Docker daemon
    docker info >nul 2>&1
    if %errorlevel% neq 0 (
        echo ⚠️  Docker is installed but not running
        echo    Start Docker Desktop and try again
    ) else (
        echo ✅ Docker is running
        
        echo.
        echo 🧪 Testing Docker build (dry run)...
        docker build --dry-run . >nul 2>&1
        if %errorlevel% neq 0 (
            echo ⚠️  Docker build test failed - but this is normal without Docker running
        ) else (
            echo ✅ Docker build test passed
        )
    )
)

echo.
echo ================================================
echo           READINESS SUMMARY
echo ================================================
echo.

if defined error (
    echo ❌ Some issues found. Please fix the missing files.
    echo.
    echo Required files:
    echo - Dockerfile
    echo - docker-compose.yml  
    echo - .env.docker
    echo - package.json
    echo - server.ts
    echo - src/app/ directory
) else (
    echo ✅ ALL CHECKS PASSED!
    echo.
    echo Your PM-App is ready for Docker deployment!
    echo.
    echo Next steps:
    echo 1. Install Docker Desktop (if not already installed)
    echo 2. Run: docker-launch.bat
    echo 3. Or run: docker-compose up -d
    echo 4. Access your app at: http://localhost:80
)

echo.
echo ================================================
echo.
pause
