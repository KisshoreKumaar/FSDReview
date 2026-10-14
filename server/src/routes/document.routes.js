import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { VERIFICATION_STATUS } from '../constants/documents.js';

export const documentRouter = Router();

documentRouter.use(authenticate);

documentRouter.patch(
  '/:id/verify',
  requireRole(ROLES.OFFICER, ROLES.ADMIN),
  [
    body('verificationStatus')
      .isIn([VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED])
      .withMessage('Invalid verification status'),
    body('rejectionReason').optional().isLength({ max: 500 }),
  ],
  validate,
  controller.verifyDocument,
);

documentRouter.delete('/:id', requireRole(ROLES.APPLICANT), controller.deleteDocument);

export default documentRouter;
