import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { userRoom } from './emitStatusChange.js';

let io = null;

/** JWT from the handshake decides the room — an unauthenticated socket is refused. */
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Authentication required'));

    const payload = verifyAccessToken(String(token).replace(/^Bearer /, ''));
    socket.data.userId = payload.sub;
    socket.data.role = payload.role;
    return next();
  } catch {
    return next(new Error('Invalid token'));
  }
};

export const initSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientOrigins, credentials: true },
    path: '/socket.io',
  });

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const room = userRoom(socket.data.userId);
    socket.join(room);
    logger.debug(`socket connected: ${socket.id} → ${room}`);

    socket.on('disconnect', (reason) => {
      logger.debug(`socket disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info('Socket.IO ready');
  return io;
};

export const getIo = () => io;
