#!/bin/bash

# Complete Fix Script for npm Dependencies and Build Issues
# Run this script if you encounter dependency resolution or build errors

echo "🔧 Fixing npm dependencies and build issues..."

# Stop any running processes
pm2 stop all 2>/dev/null || true

# Navigate to app directory
cd /var/www/pm-app

# Clean everything
echo "🧹 Cleaning npm cache and node_modules..."
npm cache clean --force
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next

# Update npm to latest version
echo "📦 Updating npm..."
sudo npm install -g npm@latest

# Install ALL dependencies (including devDependencies needed for build)
echo "📦 Installing all dependencies with legacy peer deps..."
npm install --legacy-peer-deps

# Install critical missing packages
echo "📦 Installing missing build dependencies..."
npm install --save-dev tailwindcss postcss autoprefixer @types/node typescript
npm install class-variance-authority clsx tailwind-merge lucide-react

# Create TailwindCSS config if missing
if [ ! -f "tailwind.config.js" ] && [ ! -f "tailwind.config.ts" ]; then
    echo "⚙️ Creating TailwindCSS config..."
    npx tailwindcss init -p
fi

# Create basic tsconfig.json if missing
if [ ! -f "tsconfig.json" ]; then
    echo "⚙️ Creating TypeScript config..."
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
fi

# Check if UI components directory exists
if [ ! -d "src/components/ui" ]; then
    echo "⚙️ Creating UI components directory..."
    mkdir -p src/components/ui
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Build the application
echo "🔨 Building application..."
npm run build

# If build fails, try force install and rebuild
if [ $? -ne 0 ]; then
    echo "❌ Build failed, trying force install..."
    npm install --force
    npm run build
fi

# Restart application if build succeeded
if [ -d ".next" ]; then
    echo "🚀 Restarting application..."
    pm2 start ecosystem.config.js
    echo "✅ Application should be running now!"
else
    echo "❌ Build still failing - check the errors above"
    echo "You may need to manually fix missing components or configuration"
fi

echo ""
echo "📊 Current status:"
pm2 status
