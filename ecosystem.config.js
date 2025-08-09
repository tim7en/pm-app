// Production deployment with PM2
module.exports = {
  apps: [{
    name: 'pm-app',
    script: 'server.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1, // Single instance for 1 vCPU
    autorestart: true,
    watch: false,
    max_memory_restart: '1G', // Restart if memory exceeds 1GB (safe for 2GB RAM)
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Health monitoring
    min_uptime: '10s',
    max_restarts: 10,
    // Memory and CPU monitoring
    node_args: '--max-old-space-size=1536' // Limit Node.js heap to 1.5GB
  }]
};
