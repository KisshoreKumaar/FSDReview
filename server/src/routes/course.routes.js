import { Router } from 'express';
import { body } from 'express-validator';
import * as controller from '../controllers/course.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';

export const courseRouter = Router();

const courseRules = [
  body('code').trim().notEmpty().withMessage('Course code is required'),
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('degreeLevel').isIn(['UG', 'PG']).withMessage('Degree level must be UG or PG'),
  body('durationYears').isInt({ min: 1, max: 6 }).withMessage('Duration must be 1–6 years'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be at least 1'),
];

const cutOffRules = ['general', 'obc', 'sc', 'st'].map((key) =>
  body(key).optional().isFloat({ min: 0, max: 100 }).withMessage(`${key} cut-off must be 0–100`),
);

courseRouter.get('/', controller.listCourses);
courseRouter.get('/:id', controller.getCourse);

courseRouter.use(authenticate, requireRole(ROLES.ADMIN));
courseRouter.post('/', courseRules, validate, controller.createCourse);
courseRouter.patch('/:id', controller.updateCourse);
courseRouter.patch('/:id/cutoff', cutOffRules, validate, controller.updateCutOff);
courseRouter.delete('/:id', controller.deactivateCourse);

export default courseRouter;
