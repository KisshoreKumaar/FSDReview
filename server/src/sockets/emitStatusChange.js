import { getIo } from './index.js';
import { logger } from '../utils/logger.js';

export const userRoom = (userId) => `user:${userId}`;

export const emitToUser = (userId, event, payload) => {
  const io = getIo();
  if (!io) return false;
  io.to(userRoom(userId)).emit(event, payload);
  logger.debug(`socket → ${userRoom(userId)} ${event}`);
  return true;
};

export const emitStatusChange = (userId, { applicationId, applicationNo, from, to, remarks }) =>
  emitToUser(userId, 'application:status', { applicationId, applicationNo, from, to, remarks, at: new Date() });

export default emitStatusChange;
