@echo off
setlocal enabledelayedexpansion

REM PM-App Native Windows Launcher
REM No Docker required - runs directly on Windows

echo.
echo ========================================
echo     PM-App Native Windows Launcher
echo ========================================
echo.

REM Check Node.js version
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js version:
node --version
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo [INFO] Setting up environment configuration...
    if exist ".env.docker" (
        copy ".env.docker" ".env.local" >nul
    ) else (
        echo Creating basic .env.local file...
        (
            echo # PM-App Local Environment
            echo NODE_ENV=development
            echo PORT=3000
            echo DATABASE_URL=file:./data/dev.db
            echo NEXTAUTH_SECRET=your-secret-key-change-this-to-64-characters-for-production-use
            echo NEXTAUTH_URL=http://localhost:3000
            echo JWT_SECRET=your-jwt-secret-change-this-to-64-characters-for-production-use
        ) > .env.local
    )
    echo [WARN] Please edit .env.local to configure your API keys and secrets
    echo.
)

REM Create data directory if it doesn't exist
if not exist "data" (
    echo [INFO] Creating data directory...
    mkdir data
)

REM Initialize database if it doesn't exist
if not exist "data\dev.db" (
    echo [INFO] Initializing database...
    npm run db:push
    echo.
)

REM Display menu
:menu
echo Choose an option:
echo.
echo 1^) Start Development Server ^(recommended^)
echo 2^) Build and Start Production Server
echo 3^) Build Only
echo 4^) Database Operations
echo 5^) Code Quality Check
echo 6^) View Environment Configuration
echo 7^) Open Application in Browser
echo 8^) Troubleshooting
echo 9^) Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto dev_server
if "%choice%"=="2" goto prod_server
if "%choice%"=="3" goto build_only
if "%choice%"=="4" goto database_ops
if "%choice%"=="5" goto code_quality
if "%choice%"=="6" goto view_env
if "%choice%"=="7" goto open_browser
if "%choice%"=="8" goto troubleshooting
if "%choice%"=="9" goto exit

echo Invalid choice. Please try again.
goto menu

:dev_server
echo.
echo [INFO] Starting Development Server...
echo [INFO] The app will be available at: http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server
echo.
npm run dev
goto menu

:prod_server
echo.
echo [INFO] Building for production...
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Check the errors above.
    echo Try running option 5 ^(Code Quality Check^) to fix issues.
    goto menu
)
echo [INFO] Starting production server...
echo [INFO] The app will be available at: http://localhost:3000
echo [INFO] Press Ctrl+C to stop the server
echo.
npm start
goto menu

:build_only
echo.
echo [INFO] Building application for production...
npm run build
if errorlevel 1 (
    echo [ERROR] Build failed. Check the errors above.
) else (
    echo [SUCCESS] Build completed successfully!
)
goto menu

:database_ops
echo.
echo Database Operations:
echo.
echo 1^) Initialize/Reset Database ^(db:push^)
echo 2^) Seed Sample Data ^(db:seed^)
echo 3^) Open Database Studio ^(db:studio^)
echo 4^) Back to Main Menu
echo.
set /p db_choice="Enter your choice (1-4): "

if "%db_choice%"=="1" goto db_push
if "%db_choice%"=="2" goto db_seed
if "%db_choice%"=="3" goto db_studio
if "%db_choice%"=="4" goto menu

echo Invalid choice.
goto database_ops

:db_push
echo [INFO] Initializing database schema...
npm run db:push
goto database_ops

:db_seed
echo [INFO] Adding sample data to database...
npm run db:seed
goto database_ops

:db_studio
echo [INFO] Opening Prisma Studio in your browser...
echo [INFO] Press Ctrl+C in the new window to close Prisma Studio
start npm run db:studio
goto database_ops

:code_quality
echo.
echo Code Quality Operations:
echo.
echo 1^) Check TypeScript Types
echo 2^) Run Linter
echo 3^) Fix Lint Issues
echo 4^) Run Tests
echo 5^) Back to Main Menu
echo.
set /p quality_choice="Enter your choice (1-5): "

if "%quality_choice%"=="1" goto type_check
if "%quality_choice%"=="2" goto lint_check
if "%quality_choice%"=="3" goto lint_fix
if "%quality_choice%"=="4" goto run_tests
if "%quality_choice%"=="5" goto menu

echo Invalid choice.
goto code_quality

:type_check
echo [INFO] Checking TypeScript types...
npm run type-check
goto code_quality

:lint_check
echo [INFO] Running linter...
npm run lint
goto code_quality

:lint_fix
echo [INFO] Fixing lint issues...
npm run lint:fix
goto code_quality

:run_tests
echo [INFO] Running tests...
npm run test
goto code_quality

:view_env
echo.
echo [INFO] Current environment configuration:
echo.
if exist ".env.local" (
    type .env.local
) else (
    echo .env.local file not found
)
echo.
echo [INFO] You can edit this file with: notepad .env.local
echo.
pause
goto menu

:open_browser
echo.
echo [INFO] Opening PM-App in your default browser...
start http://localhost:3000
echo.
echo [INFO] If the server is not running, start it with option 1 first.
echo.
pause
goto menu

:troubleshooting
echo.
echo Troubleshooting Options:
echo.
echo 1^) Check if port 3000 is in use
echo 2^) Clear Next.js cache
echo 3^) Reinstall dependencies
echo 4^) Reset database
echo 5^) Check system requirements
echo 6^) Back to Main Menu
echo.
set /p trouble_choice="Enter your choice (1-6): "

if "%trouble_choice%"=="1" goto check_port
if "%trouble_choice%"=="2" goto clear_cache
if "%trouble_choice%"=="3" goto reinstall_deps
if "%trouble_choice%"=="4" goto reset_db
if "%trouble_choice%"=="5" goto system_check
if "%trouble_choice%"=="6" goto menu

echo Invalid choice.
goto troubleshooting

:check_port
echo [INFO] Checking what's using port 3000...
netstat -ano | findstr :3000
echo.
echo [INFO] If something is using port 3000, you can:
echo 1. Kill the process using the PID shown above
echo 2. Change PORT in .env.local to a different port
echo.
pause
goto troubleshooting

:clear_cache
echo [INFO] Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo Next.js cache cleared
) else (
    echo No cache to clear
)
echo.
pause
goto troubleshooting

:reinstall_deps
echo [INFO] Reinstalling dependencies...
if exist "node_modules" (
    rmdir /s /q "node_modules"
)
npm install
echo [SUCCESS] Dependencies reinstalled
goto troubleshooting

:reset_db
echo [WARN] This will delete all your data!
set /p confirm_reset="Are you sure? (y/n): "
if /i "%confirm_reset%"=="y" (
    if exist "data\dev.db" (
        del "data\dev.db"
    )
    echo [INFO] Database reset. Run option 1 in Database Operations to reinitialize.
)
goto troubleshooting

:system_check
echo.
echo [INFO] System Requirements Check:
echo.
echo Node.js version:
node --version
echo npm version:
npm --version
echo.
echo Current working directory:
cd
echo.
echo Available disk space:
wmic logicaldisk get size,freespace,caption
echo.
pause
goto troubleshooting

:exit
echo.
echo [INFO] Thank you for using PM-App!
echo.
echo Quick commands for future use:
echo   npm run dev     - Start development server
echo   npm run build   - Build for production
echo   npm start       - Start production server
echo.
echo Your app runs at: http://localhost:3000
echo.
pause
exit /b 0
