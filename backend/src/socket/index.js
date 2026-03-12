const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Courier joins order room when accepting
    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`User ${socket.userId} joined order room: ${orderId}`);
    });

    // Courier location update
    socket.on('location:update', async (data) => {
      const { lat, lng, heading, speed, orderId } = data;
      
      try {
        // Save to DB
        await prisma.location.create({
          data: {
            courierId: socket.userId,
            lat,
            lng,
            heading,
            speed
          }
        });

        // Broadcast to order room (sender gets live tracking)
        if (orderId) {
          io.to(`order:${orderId}`).emit('location:updated', {
            courierId: socket.userId,
            lat,
            lng,
            heading,
            speed,
            timestamp: new Date()
          });
        }
      } catch (err) {
        console.error('Location update error:', err);
      }
    });

    // Order status update notification
    socket.on('order:status', (data) => {
      const { orderId, status, senderId } = data;
      io.to(`user:${senderId}`).emit('order:statusUpdated', { orderId, status });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
