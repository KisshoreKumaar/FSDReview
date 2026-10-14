import { Router } from 'express';
import * as controller from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get('/', controller.listNotifications);
notificationRouter.patch('/read-all', controller.markAllRead);
notificationRouter.patch('/:id/read', controller.markRead);

export default notificationRouter;
