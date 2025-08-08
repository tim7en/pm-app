#!/bin/bash
# 🔐 Secure Environment Setup for PM-App Cloud Deployment
# Run this script to generate secure secrets for production

echo "🔐 PM-App Production Environment Setup"
echo "======================================"
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL not found. Please install OpenSSL to generate secure secrets."
    echo "Windows: Use Git Bash or WSL"
    echo "macOS: brew install openssl"
    echo "Linux: sudo apt-get install openssl"
    exit 1
fi

echo "🔑 Generating secure secrets..."
echo ""

# Generate secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

echo "✅ Secrets generated successfully!"
echo ""
echo "📋 Copy these environment variables to your cloud platform:"
echo "=========================================================="
echo ""
echo "🔴 CRITICAL (Required):"
echo "NODE_ENV=production"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "JWT_SECRET=$JWT_SECRET"
echo "NEXTAUTH_URL=https://your-domain.com"
echo "DATABASE_URL=your-production-database-url"
echo ""
echo "🟡 RECOMMENDED (For full features):"
echo "OPENAI_API_KEY=sk-your-openai-key-here"
echo "GOOGLE_CLIENT_ID=your-google-oauth-id"
echo "GOOGLE_CLIENT_SECRET=your-google-oauth-secret"
echo "GOOGLE_REDIRECT_URI=https://your-domain.com/api/email/gmail/callback"
echo ""
echo "🟢 OPTIONAL (Nice to have):"
echo "SMTP_HOST=smtp.gmail.com"
echo "SMTP_PORT=587"
echo "SMTP_SECURE=false"
echo "SMTP_USER=your-email@gmail.com"
echo "SMTP_PASS=your-app-password"
echo "SMTP_FROM=your-email@gmail.com"
echo "ZAI_API_KEY=your-zai-key-here"
echo "NEXT_TELEMETRY_DISABLED=1"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "- NEVER commit these secrets to GitHub"
echo "- Use your cloud platform's environment variable settings"
echo "- Replace 'your-domain.com' with your actual domain"
echo "- Replace placeholder API keys with real ones"
echo ""
echo "📖 For detailed deployment instructions, see CLOUD_DEPLOYMENT.md"
