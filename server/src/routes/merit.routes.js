import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/merit.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

export const meritRouter = Router();

meritRouter.get('/published', controller.publicMeritLists);

meritRouter.use(authenticate, requireRole(ROLES.ADMIN));
meritRouter.get('/', controller.listMeritLists);
meritRouter.post(
  '/generate',
  [body('courseId').isMongoId().withMessage('Pick a course')],
  validate,
  controller.generateMeritList,
);
meritRouter.get('/preview/:id', controller.previewMeritList);
meritRouter.post('/publish/:id', controller.publishMeritList);

export default meritRouter;
