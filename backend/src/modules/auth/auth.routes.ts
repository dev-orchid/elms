import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  forgotPasswordSchema,
} from './auth.validators.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate({ body: registerSchema }),
  authController.register,
);

router.post(
  '/login',
  authLimiter,
  validate({ body: loginSchema }),
  authController.login,
);

router.post(
  '/refresh',
  validate({ body: refreshSchema }),
  authController.refresh,
);

router.post(
  '/logout',
  authenticate,
  authController.logout,
);

router.get(
  '/me',
  authenticate,
  authController.me,
);

router.patch(
  '/profile',
  authenticate,
  validate({ body: updateProfileSchema }),
  authController.updateProfile,
);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

export default router;
