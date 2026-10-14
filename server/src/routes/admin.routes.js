import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { ROLES } from '../constants/roles.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole(ROLES.OFFICER, ROLES.ADMIN));

adminRouter.get('/officers', reviewController.listOfficers);
adminRouter.get('/stats', adminController.getStats);
adminRouter.post('/officers', requireRole(ROLES.ADMIN), adminController.createOfficer);
adminRouter.patch('/officers/:id', requireRole(ROLES.ADMIN), adminController.updateOfficer);

export default adminRouter;
