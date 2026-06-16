import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import pairingRepository from '../repositories/pairing.repository.js';

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware — har connection pe token verify karo
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('No token provided'));

      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.role = decoded.role;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(` Connected: ${socket.userId} (${socket.role})`);

    // Room join — pairedWith ID se room banao
    const user = await pairingRepository.findById(socket.userId);
    if (user?.pairedWith) {
    const roomId = [socket.userId.toString(), user.pairedWith.toString()].sort().join('-');
    console.log(`🏠 Room ID: ${roomId}`);
      socket.join(roomId);
      socket.roomId = roomId;
      console.log(` Joined room: ${roomId}`);
    }

    socket.on('disconnect', () => {
      console.log(` Disconnected: ${socket.userId}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export { initSocket, getIO };