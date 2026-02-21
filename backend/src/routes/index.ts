import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import courseRoutes from '../modules/courses/courses.routes.js';
import contentRoutes from '../modules/content/content.routes.js';

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

export default router;
