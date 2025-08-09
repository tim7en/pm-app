# 🚀 PM-App Native Windows Launcher

Since Docker Desktop requires a newer Windows version and Docker Toolbox has memory limitations, here's how to run PM-App natively on Windows 10.

## ✅ **Quick Native Setup**

Your PM-App can run perfectly without Docker! Here's the simplified approach:

### **Step 1: Prepare Environment**
```powershell
# Copy environment configuration
copy .env.docker .env.local

# Edit environment file for local development
notepad .env.local
```

### **Step 2: Configure Environment Variables**
Edit `.env.local` with these settings:
```env
# Database (SQLite for local development)
DATABASE_URL=file:./data/dev.db

# Application
NODE_ENV=development
PORT=3000

# Authentication (generate at https://passwordsgenerator.net/)
NEXTAUTH_SECRET=your-64-character-secret-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-64-character-secret-here

# Optional API Keys
OPENAI_API_KEY=your-openai-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Step 3: Database Setup**
```powershell
# Create data directory
mkdir data

# Initialize database
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

### **Step 4: Start Application**
```powershell
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## 🎯 **Automated Native Launcher**

I've created a launcher script for you. Just run:

```powershell
.\pm-app-native-launcher.bat
```

## 🌐 **Access Your Application**

Once running, access your PM-App at:
- **Application**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **Admin Features**: Available in the dashboard

## 🔧 **Available Features**

Your PM-App includes:
- ✅ **Project Management**: Create, manage, and track projects
- ✅ **Task Management**: Assign tasks with deadlines and priorities
- ✅ **Team Collaboration**: User management and permissions
- ✅ **Real-time Updates**: Socket.IO for live notifications
- ✅ **Calendar Integration**: Schedule meetings and deadlines
- ✅ **AI Features**: AI-powered project assistance (with OpenAI key)
- ✅ **File Management**: Upload and manage project attachments
- ✅ **Email Integration**: Gmail integration (with Google OAuth)

## 🛠️ **Management Commands**

### Daily Operations
```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:push     # Apply schema changes
npm run db:seed     # Add sample data
npm run db:studio   # Open database browser
```

### Development Tools
```powershell
# Code quality
npm run lint        # Check code style
npm run lint:fix    # Fix linting issues
npm run type-check  # TypeScript verification

# Testing
npm run test        # Run tests
npm run test:watch  # Watch mode testing
```

## 🔍 **Troubleshooting**

### Issue: Port 3000 already in use
```powershell
# Find what's using port 3000
netstat -ano | findstr :3000
# Kill the process or change PORT in .env.local
```

### Issue: Database connection failed
```powershell
# Reset database
Remove-Item data\dev.db -Force
npm run db:push
```

### Issue: Missing dependencies
```powershell
# Reinstall all dependencies
Remove-Item node_modules -Recurse -Force
npm install
```

### Issue: TypeScript errors
```powershell
# Check TypeScript issues
npm run type-check

# Clear Next.js cache
Remove-Item .next -Recurse -Force
npm run build
```

## 🚀 **Production Deployment Options**

When ready for production, you have several options:

### **Option 1: Windows Server**
- Run on Windows Server with IIS or standalone
- Use PM2 for process management: `npm install -g pm2`
- Start with: `pm2 start ecosystem.config.js`

### **Option 2: Cloud Deployment**
- **Vercel**: `npx vercel` (easiest)
- **Azure**: Azure App Service with Node.js
- **AWS**: Elastic Beanstalk or EC2
- **DigitalOcean**: App Platform

### **Option 3: Docker (on newer systems)**
- Upgrade to Windows 10 19044+ or Windows 11
- Install Docker Desktop
- Use the Docker configuration files we prepared

## 📊 **Performance Optimization**

For better performance:

```powershell
# Enable production optimizations
$env:NODE_ENV="production"
npm run build
npm start

# Use SQLite with WAL mode (better concurrency)
# Add to .env.local:
# DATABASE_URL="file:./data/prod.db?journal_mode=WAL"
```

---

**🎉 Your PM-App is ready to run natively on Windows! No Docker required.**

This approach gives you:
- ✅ **No compatibility issues** with your Windows version
- ✅ **Full memory and CPU access** (no VM limitations)  
- ✅ **Easier debugging** with direct file access
- ✅ **Faster startup times** without container overhead
- ✅ **Simple deployment** process
