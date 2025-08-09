// server.ts - Next.js Development Server + Socket.IO
import { setupSocket, setSocketInstance } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { config, logEnvironmentInfo, isDev } from './config/environment';

// Log environment information
logEnvironmentInfo();

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app with development configuration
    const nextApp = next({ 
      dev: config.next.dev,
      dir: process.cwd(),
      turbo: config.next.turbo,
      // Only set distDir in production and when .next exists
      conf: config.next.dev ? undefined : undefined
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      handle(req, res);
    });

    // Setup Socket.IO with development configuration
    const io = new Server(server, {
      path: '/api/socketio',
      cors: config.server.cors
    });

    // Store socket instance globally and setup handlers
    setSocketInstance(io);
    setupSocket(io);

    // Start the server with development settings
    server.listen(config.server.port, config.server.hostname, () => {
      console.log(`> Ready on http://${config.server.hostname}:${config.server.port}`);
      console.log(`> Socket.IO server running at ws://${config.server.hostname}:${config.server.port}/api/socketio`);
      
      if (config.features.verboseLogging) {
        console.log(`🚀 Development server started successfully!`);
        console.log(`📱 Access your app at: http://${config.server.hostname}:${config.server.port}`);
      }
    });

  } catch (err) {
    console.error('❌ Server startup error:', err);
    if (config.features.verboseLogging) {
      console.error('Stack trace:', err);
    }
    process.exit(1);
  }
}

// Start the server
createCustomServer();
