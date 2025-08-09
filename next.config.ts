import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Enforce types in production; relax in dev for iteration speed
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Force dynamic rendering for everything
  experimental: {
    forceSwcTransforms: true,
  },
  
  // Output configuration for better deployment
  output: 'standalone',
  
  // Completely disable static optimization
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  
  // Disable all static generation
  generateBuildId: async () => {
    return 'dynamic-build'
  },
  
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  
  // Environment variables configuration to prevent build-time errors
  env: {
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: process.env.SMTP_PORT || '587',
    SMTP_SECURE: process.env.SMTP_SECURE || 'false',
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || '',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_API_KEY_2: process.env.OPENAI_API_KEY_2 || '',
  },
  
  // Security headers
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
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  webpack: (config, { dev }) => {
    if (dev) {
      // 禁用 webpack 的热模块替换
      config.watchOptions = {
        ignored: ['**/*'], // 忽略所有文件变化
      };
    }
    return config;
  },

};

export default nextConfig;
