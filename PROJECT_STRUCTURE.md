# Project Management App - Production Ready

## Project Structure

```
pm-app/
├── src/                          # Source code
│   ├── app/                      # Next.js app directory
│   ├── components/               # Reusable UI components
│   ├── lib/                      # Utility libraries
│   │   └── database/             # Database layer (separated)
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript type definitions
│   └── tests/                    # Organized test structure
│       ├── unit/                 # Unit tests
│       ├── integration/          # Integration tests
│       ├── e2e/                  # End-to-end tests
│       ├── utils/                # Test utilities
│       └── __mocks__/            # Mock files
├── scripts/                      # Organized scripts
│   ├── ai/                       # AI-related utilities
│   ├── auth/                     # Authentication scripts
│   ├── database/                 # Database scripts and seeds
│   ├── deployment/               # Deployment scripts
│   ├── setup/                    # Setup and initialization
│   └── validation/               # Validation and verification
├── prisma/                       # Database schema and migrations
├── public/                       # Static assets
├── docs/                         # Documentation
└── docker/                       # Docker configurations
```

## Key Improvements Made

### 🗂️ File Organization
- ✅ Moved scattered utility scripts to organized `scripts/` directory
- ✅ Created proper database layer separation in `src/lib/database/`
- ✅ Organized tests into proper structure with unit/integration/e2e separation
- ✅ Cleaned up root directory from redundant files

### 🐳 Docker & Deployment
- ✅ Multi-port support (ports 3000 and 80)
- ✅ Production-ready Docker configuration
- ✅ Health check endpoints
- ✅ Database separation from main application logic

### 🧪 Testing Infrastructure
- ✅ Proper test structure with Vitest
- ✅ Unit tests for database layer
- ✅ Integration tests for API endpoints
- ✅ Test utilities and mocks

### 📦 Dependencies & Build
- ✅ Standardized npm scripts
- ✅ Updated .gitignore for production
- ✅ Proper TypeScript configuration

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production (Docker)
```bash
# Simple setup (ports 3000 and 80)
docker-compose -f docker-compose.simple.yml up

# Full production setup with database
docker-compose -f docker-compose.production.yml up
```

### Testing
```bash
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Run with coverage
```

### Database
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:push       # Push schema changes
```

## Health Check
The application includes health check endpoints:
- `GET /api/health` - Application and database health status

## Environment Variables
Create `.env.local` for development:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Docker Support
The application supports multiple deployment scenarios:
1. **Simple**: Single container with SQLite (`docker-compose.simple.yml`)
2. **Production**: Full stack with PostgreSQL and Redis (`docker-compose.production.yml`)

Both configurations expose the application on ports 3000 and 80.