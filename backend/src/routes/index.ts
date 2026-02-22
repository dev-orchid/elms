import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import courseRoutes from '../modules/courses/courses.routes.js';
import contentRoutes from '../modules/content/content.routes.js';
import enrollmentRoutes from '../modules/enrollments/enrollments.routes.js';
import assessmentRoutes from '../modules/assessments/assessments.routes.js';
import gamificationRoutes from '../modules/gamification/gamification.routes.js';
import certificateRoutes from '../modules/certificates/certificates.routes.js';
import communicationRoutes from '../modules/communication/communication.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/courses', courseRoutes);
router.use('/', contentRoutes);
router.use('/', enrollmentRoutes);
router.use('/', assessmentRoutes);
router.use('/', gamificationRoutes);
router.use('/', certificateRoutes);
router.use('/', communicationRoutes);
router.use('/', adminRoutes);

export default router;
