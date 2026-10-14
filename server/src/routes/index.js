import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { courseRouter } from './course.routes.js';
import { applicationRouter } from './application.routes.js';
import { documentRouter } from './document.routes.js';
import { paymentRouter } from './payment.routes.js';
import { adminRouter } from './admin.routes.js';
import { notificationRouter } from './notification.routes.js';
import { meritRouter } from './merit.routes.js';

export const apiRouter = Router();

apiRouter.get('/', (req, res) => {
  res.json({ success: true, data: { name: 'College Admission API', version: 'v1' }, message: 'OK' });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/courses', courseRouter);
apiRouter.use('/applications', applicationRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/merit', meritRouter);

export default apiRouter;
