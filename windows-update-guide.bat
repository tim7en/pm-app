@echo off
echo Checking for Windows Updates to enable Docker...
echo Your current build: 19041
echo Required build: 19044 or higher
echo.
echo Option 1: Windows Update
echo ======================
echo 1. Press Win + I (Settings)
echo 2. Go to "Update & Security"
echo 3. Click "Check for updates"
echo 4. Install any available updates (usually takes 10-15 minutes)
echo 5. Restart and re-run Docker installation
echo.
echo Option 2: Update Assistant
echo =========================
start https://www.microsoft.com/en-us/software-download/windows10
echo Download and run the Windows 10 Update Assistant
echo.
echo Option 3: Quick Launch Without Docker
echo ===================================== 
echo You can run the app directly right now while updating:
echo   npm run build-simple
echo   npm start
echo.
pause
