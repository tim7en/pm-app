# 🚀 PM-app Launch Instructions

This guide will help you set up and launch the PM-app project management application on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm** (comes with Node.js) or **yarn**
  - Verify npm: `npm --version`
- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/
  - Verify installation: `git --version`

## 📥 Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/tim7en/pm-app.git
cd pm-app
```

### Step 2: Install Dependencies

```bash
npm install
# or if you prefer yarn
yarn install
```

This will install all required packages including:
- Next.js 14
- TypeScript
- Prisma ORM
- shadcn/ui components
- Socket.IO
- And all other dependencies

### Step 3: Environment Setup

Create a `.env.local` file in the root directory:

```bash
# On Windows (PowerShell)
New-Item -ItemType File -Name ".env.local"

# On macOS/Linux
touch .env.local
```

Add the following environment variables to `.env.local`:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# JWT Authentication
JWT_SECRET="your-super-secure-jwt-secret-key-change-this-in-production"

# NextAuth (if using NextAuth in the future)
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3001"

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Step 4: Database Setup

The app uses SQLite with Prisma ORM. Set up the database:

```bash
# Generate Prisma client
npx prisma generate

# Create and migrate the database
npx prisma db push

# Seed the database with initial data
npx prisma db seed
```

This will create:
- A SQLite database at `./db/custom.db`
- Initial user account (see login credentials below)
- Sample projects and tasks for testing

## 🏃‍♂️ Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at:
- **Frontend**: http://localhost:3001
- **API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:3001/api/socketio

### Production Mode

To run in production mode:

```bash
# Build the application
npm run build

# Start production server
npm run start
```

## 🔐 Default Login Credentials

After seeding the database, you can log in with:

- **Email**: `test@example.com`
- **Password**: `password`

## 🧪 Testing the Application

### 1. Login Test
1. Navigate to http://localhost:3001
2. You should be redirected to the login page
3. Use the default credentials above
4. You should be redirected to the dashboard

### 2. Core Features Test
- **Dashboard**: View project overview and statistics
- **Projects**: Create, edit, and delete projects
- **Tasks**: Create tasks, assign them, and mark as complete
- **Team**: Add team members to projects
- **Settings**: Update user preferences

### 3. API Test
Test API endpoints directly:
```bash
# Health check
curl http://localhost:3001/api/health

# Login (get auth token)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🗂️ Project Structure Overview

```
pm-app/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/           # API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── projects/      # Project management
│   │   ├── tasks/         # Task management
│   │   └── ...
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   └── contexts/         # React contexts
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── ...
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. Port Already in Use
If port 3001 is already in use:
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or change port in package.json scripts
```

#### 2. Database Connection Issues
```bash
# Reset database
rm -rf db/
npx prisma db push
npx prisma db seed
```

#### 3. Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Prisma Client Issues
```bash
# Regenerate Prisma client
npx prisma generate
```

#### 5. Authentication Problems
- Check if JWT_SECRET is set in `.env.local`
- Clear browser localStorage and cookies
- Restart the development server

### Development Tools

#### Database Management
View and manage your database:
```bash
# Open Prisma Studio (database GUI)
npx prisma studio
```
Access at: http://localhost:5555

#### Code Quality
```bash
# Run linter
npm run lint

# Type checking
npm run type-check
```

## 🌐 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler |

## 📊 Features Overview

### ✅ Implemented Features
- User authentication with JWT
- Project creation and management
- Task management with status tracking
- Team member management
- Role-based access control
- Real-time updates via WebSocket
- Responsive UI with shadcn/ui
- PDF export functionality
- Dashboard analytics

### 🚧 In Development
- Advanced task filtering
- File attachments
- Email notifications
- Calendar integration
- Advanced reporting

## 🔧 Development Configuration

### VS Code Setup
Recommended extensions:
- TypeScript and JavaScript Language Features
- Prisma
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

### Environment Variables Reference
```env
# Required
DATABASE_URL=           # Database connection string
JWT_SECRET=            # JWT signing secret
PORT=                  # Server port (default: 3001)

# Optional
NEXTAUTH_SECRET=       # NextAuth secret (future use)
NEXTAUTH_URL=         # NextAuth URL (future use)
NODE_ENV=             # Environment (development/production)
```

## 📞 Support

If you encounter any issues:

1. Check this troubleshooting guide
2. Review the console logs in browser dev tools
3. Check the terminal output for server errors
4. Open an issue on GitHub: https://github.com/tim7en/pm-app/issues

## 🎯 Next Steps

After successfully launching the app:

1. **Explore the Interface**: Navigate through all pages and features
2. **Create Test Data**: Add your own projects and tasks
3. **Test Team Features**: Add team members and assign roles
4. **Check Real-time Updates**: Open multiple browser tabs to see live updates
5. **Try Export Features**: Export projects to PDF
6. **Review Code**: Explore the codebase to understand the architecture

---

**Happy Coding! 🎉**

For more detailed information, check out the main [README.md](./README.md) file.
