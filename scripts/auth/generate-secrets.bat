@echo off
REM 🔐 Secure Environment Setup for PM-App Cloud Deployment (Windows)
REM Run this script to generate secure secrets for production

echo 🔐 PM-App Production Environment Setup
echo ======================================
echo.

REM Check if we're in Git Bash or have openssl
where openssl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ OpenSSL not found. Please use one of these options:
    echo.
    echo Option 1: Use Git Bash and run: ./generate-secrets.sh
    echo Option 2: Use PowerShell and run:
    echo   [System.Web.Security.Membership]::GeneratePassword(32, 5^)
    echo Option 3: Use online generator: https://www.uuidgenerator.net/
    echo.
    pause
    exit /b 1
)

echo 🔑 Generating secure secrets...
echo.

REM Generate secrets using openssl
for /f %%i in ('openssl rand -base64 32') do set NEXTAUTH_SECRET=%%i
for /f %%i in ('openssl rand -base64 32') do set JWT_SECRET=%%i

echo ✅ Secrets generated successfully!
echo.
echo 📋 Copy these environment variables to your cloud platform:
echo ==========================================================
echo.
echo 🔴 CRITICAL (Required):
echo NODE_ENV=production
echo NEXTAUTH_SECRET=%NEXTAUTH_SECRET%
echo JWT_SECRET=%JWT_SECRET%
echo NEXTAUTH_URL=https://your-domain.com
echo DATABASE_URL=your-production-database-url
echo.
echo 🟡 RECOMMENDED (For full features):
echo OPENAI_API_KEY=sk-your-openai-key-here
echo GOOGLE_CLIENT_ID=your-google-oauth-id
echo GOOGLE_CLIENT_SECRET=your-google-oauth-secret
echo GOOGLE_REDIRECT_URI=https://your-domain.com/api/email/gmail/callback
echo.
echo 🟢 OPTIONAL (Nice to have):
echo SMTP_HOST=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_SECURE=false
echo SMTP_USER=your-email@gmail.com
echo SMTP_PASS=your-app-password
echo SMTP_FROM=your-email@gmail.com
echo ZAI_API_KEY=your-zai-key-here
echo NEXT_TELEMETRY_DISABLED=1
echo.
echo ⚠️  SECURITY REMINDER:
echo - NEVER commit these secrets to GitHub
echo - Use your cloud platform's environment variable settings
echo - Replace 'your-domain.com' with your actual domain
echo - Replace placeholder API keys with real ones
echo.
echo 📖 For detailed deployment instructions, see CLOUD_DEPLOYMENT.md
echo.
pause
