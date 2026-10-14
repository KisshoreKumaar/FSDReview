import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/application.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { CATEGORIES } from '../constants/categories.js';
import * as documentController from '../controllers/document.controller.js';
import * as reviewController from '../controllers/review.controller.js';
import { singleDocument } from '../middleware/upload.js';
import { STATUS_VALUES } from '../constants/status.js';

export const applicationRouter = Router();

applicationRouter.use(authenticate);

const draftRules = [
  body('personal.category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('personal.gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
  body('address.pincode').optional().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  body('academics.yearOfPassing')
    .optional()
    .isInt({ min: 1990, max: 2030 })
    .withMessage('Year of passing looks wrong'),
  body('academics.subjects').optional().isArray({ max: 10 }).withMessage('At most 10 subjects'),
  body('coursePreferences').optional().isArray({ max: 5 }).withMessage('At most 5 course preferences'),
];

applicationRouter.get('/course-options', controller.getCourseOptions);
applicationRouter.get('/mine', requireRole(ROLES.APPLICANT), controller.getMyApplication);
applicationRouter.post('/', requireRole(ROLES.APPLICANT), draftRules, validate, controller.createApplication);
applicationRouter.patch('/:id', requireRole(ROLES.APPLICANT), draftRules, validate, controller.updateApplication);
applicationRouter.post('/:id/submit', requireRole(ROLES.APPLICANT), controller.submitApplication);
applicationRouter.post('/:id/withdraw', requireRole(ROLES.APPLICANT), controller.withdrawApplication);
const STAFF = [ROLES.OFFICER, ROLES.ADMIN];

applicationRouter.get('/', requireRole(...STAFF), reviewController.listApplications);
applicationRouter.patch(
  '/:id/status',
  requireRole(...STAFF),
  [
    body('to').isIn(STATUS_VALUES).withMessage('Unknown target status'),
    body('remarks').optional().isLength({ max: 500 }).withMessage('Remarks are too long'),
  ],
  validate,
  reviewController.changeStatus,
);
applicationRouter.patch('/:id/assign', requireRole(ROLES.ADMIN), reviewController.assignOfficer);

applicationRouter.get('/:id', controller.getApplication);

applicationRouter.get('/:id/documents', documentController.listDocuments);
applicationRouter.post(
  '/:id/documents',
  requireRole(ROLES.APPLICANT),
  singleDocument,
  documentController.uploadDocument,
);

export default applicationRouter;
