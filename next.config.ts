import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript configuration - strict in production
  typescript: {
    ignoreBuildErrors: false, // Always enforce types in production
  },
  eslint: {
    ignoreDuringBuilds: false, // Check ESLint in production builds
  },
  
  // Production optimizations
  experimental: {
    forceSwcTransforms: true,
  },
  
  // Output configuration for Docker deployment
  output: 'standalone',
  
  // Production URL configuration
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Generate unique build ID for each deployment
  generateBuildId: async () => {
    return `production-${Date.now()}`
  },
  
  // Enable React Strict Mode for production
  reactStrictMode: true,
  
  // Environment variables - production values
  env: {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_SECURE: process.env.SMTP_SECURE || 'false',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'noreply@198.163.207.39',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://198.163.207.39',
    JWT_SECRET: process.env.JWT_SECRET || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_API_KEY_2: process.env.OPENAI_API_KEY_2 || '',
    ZAI_API_KEY: process.env.ZAI_API_KEY || '',
  },
  
  // Production security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Production webpack optimizations - simplified
  webpack: (config, { dev, isServer }) => {
    // Reduce memory usage during build
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
      
      // Reduce parallelism to save memory
      config.parallelism = 1;
    }
    
    return config;
  },

};

export default nextConfig;
