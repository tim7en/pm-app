// Environment configuration for PM-App
export interface AppConfig {
  mode: 'development' | 'production';
  server: {
    port: number;
    hostname: string;
    cors: {
      origin: string | string[];
      methods: string[];
    };
  };
  next: {
    dev: boolean;
    turbo?: boolean;
  };
  database: {
    url: string;
    logging: boolean;
  };
  auth: {
    secret: string;
    url: string;
  };
  features: {
    hotReload: boolean;
    verboseLogging: boolean;
    errorReporting: boolean;
  };
}

// Force development mode for now
const FORCE_DEVELOPMENT = true;

// Determine environment
const getEnvironment = (): 'development' | 'production' => {
  if (FORCE_DEVELOPMENT) return 'development';
  return process.env.NODE_ENV as 'development' | 'production' || 'development';
};

const isDevelopment = getEnvironment() === 'development';

// Development configuration
const developmentConfig: AppConfig = {
  mode: 'development',
  server: {
    port: parseInt(process.env.PORT || '3000'),
    hostname: 'localhost', // Use localhost for development
    cors: {
      origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
  },
  next: {
    dev: true,
    turbo: true // Enable Turbopack for faster development
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/pmapp',
    logging: true // Enable database query logging in development
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key-123',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000'
  },
  features: {
    hotReload: true,
    verboseLogging: true,
    errorReporting: true
  }
};

// Production configuration
const productionConfig: AppConfig = {
  mode: 'production',
  server: {
    port: parseInt(process.env.PORT || '3000'),
    hostname: '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ["*"],
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  },
  next: {
    dev: false
  },
  database: {
    url: process.env.DATABASE_URL!,
    logging: false
  },
  auth: {
    secret: process.env.NEXTAUTH_SECRET!,
    url: process.env.NEXTAUTH_URL!
  },
  features: {
    hotReload: false,
    verboseLogging: false,
    errorReporting: true
  }
};

// Export the current configuration
export const config: AppConfig = isDevelopment ? developmentConfig : productionConfig;

// Helper functions
export const isProduction = () => config.mode === 'production';
export const isDev = () => config.mode === 'development';

// Environment info logging
export const logEnvironmentInfo = () => {
  console.log(`🔧 Environment: ${config.mode.toUpperCase()}`);
  console.log(`🖥️  Server: http://${config.server.hostname}:${config.server.port}`);
  console.log(`🔄 Hot Reload: ${config.features.hotReload ? 'Enabled' : 'Disabled'}`);
  console.log(`📝 Verbose Logging: ${config.features.verboseLogging ? 'Enabled' : 'Disabled'}`);
  console.log(`🗄️  Database Logging: ${config.database.logging ? 'Enabled' : 'Disabled'}`);
  
  if (FORCE_DEVELOPMENT) {
    console.log(`⚠️  FORCED DEVELOPMENT MODE - Update config/environment.ts to change`);
  }
};
