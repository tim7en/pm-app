#!/bin/bash

# Production Build and Deployment Script for PM-App
# This script builds the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting Production Build Process..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Set production environment
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

echo "📦 Environment: $NODE_ENV"
echo "📍 Working directory: $(pwd)"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf dist
rm -rf out

# Install dependencies (production only)
echo "📥 Installing production dependencies..."
npm ci --production=false --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run production build
echo "🏗️  Building application for production..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo "📊 Build statistics:"
    ls -la .next/standalone/
    echo ""
    echo "🐳 Ready for Docker deployment!"
    echo "Run: docker compose -f docker-compose.production.yml up -d --build"
else
    echo "❌ Production build failed!"
    exit 1
fi

echo "=================================="
echo "🎉 Production build process completed!"
