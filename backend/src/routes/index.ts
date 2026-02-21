import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';

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

export default router;
