import { Server } from 'socket.io';

// Store user socket mappings for real-time notifications
const userSockets = new Map<string, string>(); // userId -> socketId

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user authentication/joining
    socket.on('join-user', (userId: string) => {
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined with socket ${socket.id}`);
      }
    });

    // Handle user leaving
    socket.on('leave-user', (userId: string) => {
      if (userId) {
        userSockets.delete(userId);
        socket.leave(`user:${userId}`);
        console.log(`User ${userId} left`);
      }
    });
    
    // Handle messages (keeping existing functionality)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      // Echo: broadcast message only the client who send the message
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle notification acknowledgment
    socket.on('notification-read', (data: { notificationId: string; userId: string }) => {
      console.log(`Notification ${data.notificationId} read by user ${data.userId}`);
      // You can add additional logic here if needed
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove user from socket mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message (keeping existing functionality)
    socket.emit('message', {
      text: 'Welcome to WebSocket Echo Server!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};

// Helper function to emit notifications to specific users
export const emitNotificationToUser = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification', notification);
  console.log(`Notification sent to user ${userId}:`, notification.title);
};

// Helper function to emit notification count updates
export const emitNotificationCountToUser = (io: Server, userId: string, count: number) => {
  io.to(`user:${userId}`).emit('notification-count', { count });
  console.log(`Notification count (${count}) sent to user ${userId}`);
};

// Get socket instance (we'll need to modify server.ts to export this)
let ioInstance: Server | null = null;

export const setSocketInstance = (io: Server) => {
  ioInstance = io;
};

export const getSocketInstance = (): Server | null => {
  return ioInstance;
};