import { Server } from 'socket.io';
import { NotificationService } from './notification-service';

// Store user socket mappings for real-time notifications
const userSockets = new Map<string, Set<string>>(); // userId -> Set of socketIds for multiple sessions

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user authentication/joining
    socket.on('join-user', (userId: string) => {
      if (userId) {
        // Add socket to user's session set
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined with socket ${socket.id}. Total sessions: ${userSockets.get(userId)!.size}`);
      }
    });

    // Handle request for current notification count
    socket.on('get-notification-count', async (userId: string) => {
      if (userId) {
        try {
          const count = await NotificationService.getUnreadCount(userId);
          socket.emit('notification-count', { count });
          console.log(`Sent notification count (${count}) to user ${userId} socket ${socket.id}`);
        } catch (error) {
          console.error('Error fetching notification count for socket:', error);
        }
      }
    });

    // Handle user leaving
    socket.on('leave-user', (userId: string) => {
      if (userId && userSockets.has(userId)) {
        const userSocketSet = userSockets.get(userId)!;
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(userId);
        }
        socket.leave(`user:${userId}`);
        console.log(`User ${userId} left socket ${socket.id}. Remaining sessions: ${userSocketSet.size}`);
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
      for (const [userId, socketSet] of userSockets.entries()) {
        if (socketSet.has(socket.id)) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            userSockets.delete(userId);
          }
          console.log(`User ${userId} disconnected socket ${socket.id}. Remaining sessions: ${socketSet.size}`);
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