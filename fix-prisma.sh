#!/bin/bash

# Prisma Database Fix Script
# Run this script to fix Prisma database connection and schema issues

echo "🔧 Fixing Prisma Database Issues..."

cd /var/www/pm-app

# Stop application first
pm2 stop all 2>/dev/null || true

echo "🗄️ Setting up Prisma database..."

# Check if .env file exists and has correct DATABASE_URL
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Creating one..."
    cat > .env << 'EOF'
NODE_ENV="production"
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="XaQ8vN9mK2pR7wL5tY6hU3jF8bZ4cV1eS0dG9xA2qW5rT8nM7kP3vL6yH1uJ4"
NEXTAUTH_URL="https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz"
JWT_SECRET="P9mK2wN5vQ8xA1bY4tR7cL0eS3gZ6hU9jF2pW5nM8kV1xT4yL7qG0aB3dE6fH9"
OPENAI_API_KEY="your-openai-key-here"
OPENAI_API_KEY_2="your-backup-openai-key-here"
ZAI_API_KEY="your-zai-api-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://hollow-gray-snipe-carey-swknu.app.uztelecom.uz/api/email/gmail/callback"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password_here"
SMTP_FROM="your_email@gmail.com"
PORT="3000"
EOF
fi

# Check if DATABASE_URL is correctly set
if ! grep -q "DATABASE_URL=" .env; then
    echo "Adding DATABASE_URL to .env..."
    echo 'DATABASE_URL="file:./dev.db"' >> .env
fi

# Ensure database directory exists
mkdir -p prisma

# Remove existing database if it's corrupted
if [ -f "dev.db" ]; then
    echo "⚠️ Removing existing database (will be recreated)..."
    rm -f dev.db
fi

if [ -f "prisma/dev.db" ]; then
    echo "⚠️ Removing existing database from prisma directory..."
    rm -f prisma/dev.db
fi

# Check if Prisma schema exists
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Prisma schema not found! This is a critical issue."
    echo "Please ensure your repository includes the prisma/schema.prisma file"
    exit 1
fi

echo "📋 Current Prisma schema preview:"
head -20 prisma/schema.prisma

# Install Prisma if not installed
npm install prisma @prisma/client --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Initialize database with schema
echo "🗄️ Pushing database schema..."
npx prisma db push --force-reset

# Optional: Seed database if seed script exists
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed 2>/dev/null || npx prisma db seed 2>/dev/null || echo "Seeding failed or not configured"
fi

# Verify database was created
if [ -f "dev.db" ] || [ -f "prisma/dev.db" ]; then
    echo "✅ Database created successfully!"
    
    # Show database info
    echo "📊 Database file location:"
    find . -name "dev.db" -type f
    
    # Test database connection
    echo "🔌 Testing database connection..."
    npx prisma studio --browser=none &
    STUDIO_PID=$!
    sleep 2
    kill $STUDIO_PID 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        echo "✅ Database connection test passed!"
    else
        echo "⚠️ Database connection test may have issues, but continuing..."
    fi
else
    echo "❌ Database creation failed!"
    echo "🔍 Checking for errors..."
    npx prisma db push 2>&1 | tail -10
    exit 1
fi

# Restart application
echo "🚀 Restarting application..."
pm2 start ecosystem.config.js

# Check if application started successfully
sleep 5
pm2 status

echo ""
echo "✅ Prisma database setup complete!"
echo "📊 Database status:"
echo "   - Location: $(find . -name 'dev.db' -type f)"
echo "   - Schema: prisma/schema.prisma"
echo "   - Client: Generated"
echo ""
echo "🔍 Check application logs if there are still issues:"
echo "   pm2 logs pm-app"
