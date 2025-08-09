# Development Configuration Guide

This guide explains how to configure the PM-App for development mode.

## Configuration System

The app now uses a centralized configuration system located in `config/environment.ts`. This allows easy switching between development and production modes.

### Key Features

- **Forced Development Mode**: Currently set to always run in development mode
- **Hot Reload**: Enabled for faster development
- **Verbose Logging**: Detailed logs for debugging
- **Database Query Logging**: See all Prisma queries in the console
- **Development CORS**: Configured for localhost access

## Configuration Files

### 1. `config/environment.ts`
Main configuration file that exports different configs for dev/prod modes.

To switch modes, change `FORCE_DEVELOPMENT` constant:
```typescript
const FORCE_DEVELOPMENT = true; // Set to false for production
```

### 2. `.env.local`
Environment variables for development:
```bash
NODE_ENV=development
FORCE_DEVELOPMENT=true
PORT=3000
HOST=localhost
DATABASE_URL="postgresql://postgres:password@localhost:5432/pmapp"
```

## Development Scripts

Updated package.json scripts:

```bash
# Development (recommended)
npm run dev

# Development with network access
npm run dev:network

# Platform-specific development
npm run dev:windows  # Windows
npm run dev:mac      # macOS

# Force development mode
npm run dev:force
```

## Development Features

### 1. Hot Reload
- File watching enabled for `server.ts`, `src/`, and `config/` folders
- Automatic server restart on file changes
- Turbopack enabled for faster builds

### 2. Enhanced Logging
- Environment info logged on startup
- Database query logging enabled
- Verbose error reporting
- Color-coded console output

### 3. Development-friendly CORS
- Localhost origins allowed
- Additional HTTP methods enabled
- Relaxed CORS for development

### 4. Database Configuration
- PostgreSQL connection optimized for development
- Query logging enabled
- Connection pooling configured

## Starting Development

1. Make sure PostgreSQL Docker container is running:
   ```bash
   docker start pm-app-postgres
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Access the application:
   - Main app: http://localhost:3000
   - Socket.IO: ws://localhost:3000/api/socketio

## Configuration Options

### Server Configuration
```typescript
server: {
  port: 3000,                    // Development port
  hostname: 'localhost',         // Use localhost for dev
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
}
```

### Next.js Configuration
```typescript
next: {
  dev: true,                     // Enable development mode
  turbo: true                    // Enable Turbopack
}
```

### Feature Flags
```typescript
features: {
  hotReload: true,              // File watching
  verboseLogging: true,         // Detailed logs
  errorReporting: true          // Error tracking
}
```

## Switching to Production

To switch to production mode:

1. Update `config/environment.ts`:
   ```typescript
   const FORCE_DEVELOPMENT = false;
   ```

2. Set environment variables:
   ```bash
   NODE_ENV=production
   ```

3. Build and start:
   ```bash
   npm run build
   npm run start
   ```

## Environment Variables

### Required for Development
- `NODE_ENV=development`
- `DATABASE_URL` (PostgreSQL connection)
- `NEXTAUTH_SECRET` (Auth secret)
- `NEXTAUTH_URL` (App URL)

### Optional for Development
- `OPENAI_API_KEY` (AI features)
- `GOOGLE_CLIENT_ID` (OAuth)
- `GOOGLE_CLIENT_SECRET` (OAuth)
- `SMTP_*` (Email configuration)

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Check if another instance is running: `lsof -i :3000`
   - Kill the process or change the port in config

2. **Database connection failed**
   - Ensure PostgreSQL container is running
   - Check DATABASE_URL in .env.local

3. **Hot reload not working**
   - Check if nodemon is watching the right files
   - Restart the development server

4. **Build errors in development**
   - The app is configured for development, build errors are expected
   - Use `npm run dev` instead of `npm run build`

## Next Steps

- Configure your database connection in .env.local
- Set up your API keys for external services
- Customize the configuration in `config/environment.ts` as needed
- Start developing! 🚀
