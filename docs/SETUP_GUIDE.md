# PM-App Setup Guide: Docker Installation & Deployment

## 🐳 Docker Installation (Required)

Before running PM-App in Docker containers, you need to install Docker Desktop:

### Windows Installation
1. **Download Docker Desktop:**
   - Visit: https://docs.docker.com/desktop/install/windows/
   - Download Docker Desktop for Windows

2. **System Requirements:**
   - Windows 10/11 64-bit (Pro, Enterprise, or Education)
   - WSL 2 feature enabled
   - At least 4GB RAM

3. **Installation Steps:**
   ```cmd
   # Download and run the installer
   # Follow the installation wizard
   # Restart your computer when prompted
   # Start Docker Desktop from Start Menu
   ```

4. **Verify Installation:**
   ```cmd
   # Open new PowerShell/CMD window
   docker --version
   docker-compose --version
   ```

### Alternative: Using Package Managers

**Using Chocolatey:**
```cmd
# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Docker Desktop
choco install docker-desktop
```

**Using Winget:**
```cmd
winget install Docker.DockerDesktop
```

## 🚀 Quick Start After Docker Installation

Once Docker is installed and running:

### Option 1: Automated Windows Launcher
```cmd
cd d:\dev\pm-app
docker-launch.bat
```

### Option 2: Manual Commands
```cmd
cd d:\dev\pm-app

# Copy environment template
copy .env.docker .env

# Build and run in production mode
docker-compose up -d

# View logs
docker-compose logs -f pm-app

# Access application at http://localhost:3000
```

## 🔧 Without Docker: Local Development Setup

If you prefer to run without Docker, here's the dependency-conflict-free setup:

### 1. Node.js Setup
```cmd
# Ensure Node.js 20.19.0+ is installed
node --version

# If not, download from: https://nodejs.org/
```

### 2. Clean Installation
```cmd
cd d:\dev\pm-app

# Clear any existing installations
rmdir /s /q node_modules
del package-lock.json

# Configure npm for better dependency resolution
npm config set legacy-peer-deps true
npm config set fund false
npm config set audit false

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Build the application
npm run build
```

### 3. Environment Setup
```cmd
# Copy environment template
copy .env.docker .env

# Edit .env file with your API keys (optional for basic functionality)
notepad .env
```

### 4. Start Application
```cmd
# Development mode
npm run dev

# Production mode
npm run start
```

## 🔍 Dependency Conflict Resolution

### Common Issues & Solutions

**1. Node Version Conflicts:**
```cmd
# Use Node Version Manager (nvm-windows)
# Download from: https://github.com/coreybutler/nvm-windows

nvm install 20.19.0
nvm use 20.19.0
```

**2. Package Resolution Issues:**
```cmd
# Clear all caches
npm cache clean --force
rmdir /s /q node_modules
del package-lock.json

# Use legacy peer deps globally
npm config set legacy-peer-deps true

# Reinstall
npm install --legacy-peer-deps --force
```

**3. Sharp Module Conflicts:**
```cmd
# Reinstall sharp specifically
npm uninstall sharp
npm install sharp --legacy-peer-deps
```

**4. Prisma Client Issues:**
```cmd
# Regenerate Prisma client
npx prisma generate --force
```

**5. TypeScript Conflicts:**
```cmd
# Ensure correct TypeScript version
npm install typescript@latest --save-dev --legacy-peer-deps
```

### Docker vs Local Development

| Aspect | Docker | Local |
|--------|--------|--------|
| **Dependency Isolation** | ✅ Complete | ⚠️ Partial |
| **Setup Time** | 🟡 5-10 min | 🟢 2-5 min |
| **Resource Usage** | 🔴 Higher | 🟢 Lower |
| **Consistency** | ✅ Guaranteed | ⚠️ Variable |
| **Hot Reloading** | ✅ Available | ✅ Available |
| **Debugging** | 🟡 Container logs | 🟢 Direct |

## 🛠️ Development Workflow

### With Docker (Recommended)
```cmd
# Start development
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f pm-app-dev

# Make changes (auto-reloads)
# Edit files in your IDE

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### Without Docker
```cmd
# Start development
npm run dev

# Application available at http://localhost:3000
# Auto-reloads on file changes

# Stop with Ctrl+C
```

## 📋 Verification Checklist

After setup, verify these work:
- [ ] Application loads at http://localhost:3000
- [ ] Database connection works (check health endpoint)
- [ ] File uploads work (if configured)
- [ ] WebSocket connections work (real-time features)
- [ ] API endpoints respond correctly

### Health Check Commands
```cmd
# Check application health
curl http://localhost:3000/api/health

# Or in PowerShell
Invoke-RestMethod http://localhost:3000/api/health

# Check specific features
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/tasks
```

## 🚨 Troubleshooting

### Docker Issues
```cmd
# Restart Docker Desktop
# Check Docker system
docker system info

# Clean Docker cache
docker system prune -a

# Check container logs
docker-compose logs pm-app
```

### Local Development Issues
```cmd
# Port conflicts
netstat -ano | findstr :3000

# Kill process on port 3000
taskkill /F /PID [PID_NUMBER]

# Reset database
npx prisma db push --force-reset

# Clear Next.js cache
rmdir /s /q .next
npm run build
```

## 🎯 Next Steps

1. **Install Docker Desktop** (if using Docker approach)
2. **Run the application** using your preferred method
3. **Configure API keys** in .env file for full functionality
4. **Test core features** to ensure everything works
5. **Deploy to production** when ready

Choose Docker for maximum compatibility and conflict-free deployment, or local development for faster iteration during active development.
