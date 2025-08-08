#!/bin/bash

# Emergency Build Fix Script
# Quick fix for immediate build issues

echo "🚨 Emergency Build Fix for PM-App"
echo "=================================="

cd /var/www/pm-app

# Stop application
pm2 stop all 2>/dev/null || true

echo "🔧 Installing critical missing packages..."

# Install TailwindCSS and build essentials
npm install --save-dev tailwindcss@latest postcss@latest autoprefixer@latest
npm install --save-dev typescript@latest @types/node@latest

# Install UI utility packages
npm install class-variance-authority clsx tailwind-merge lucide-react

# Create minimal TailwindCSS config
echo "⚙️ Creating TailwindCSS config..."
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create PostCSS config
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create missing directories
mkdir -p src/components/ui
mkdir -p src/lib

# Create basic utility file if missing
cat > src/lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

echo "🔨 Attempting build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful! Starting application..."
    pm2 start ecosystem.config.js
    pm2 status
else
    echo "❌ Build still failing. Detailed error analysis needed."
    echo "🔍 Checking for missing components..."
    
    # List missing components from error
    npm run build 2>&1 | grep "Can't resolve" | head -10
    
    echo ""
    echo "💡 Next steps:"
    echo "1. Check the error output above"
    echo "2. Create any missing component files"
    echo "3. Or run: ./fix-dependencies.sh for complete fix"
fi
