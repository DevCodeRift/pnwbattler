import { createServer } from 'http';
import { Server } from 'socket.io';

// Initialize Socket.io server
export function initializeSocketServer() {
  if (typeof window !== 'undefined') {
    // Client-side, do nothing
    return null;
  }

  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : false,
      methods: ['GET', 'POST']
    }
  });

  httpServer.listen(3001, () => {
    console.log('Socket.io server running on port 3001');
  });

  return { httpServer, io };
}
