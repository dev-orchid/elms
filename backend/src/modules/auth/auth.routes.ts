import { Router } from 'express';
import multer from 'multer';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, GIF and WebP images are allowed'));
    }
  },
});
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
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
  '/avatar',
  authenticate,
  imageUpload.single('avatar'),
  authController.uploadAvatar,
);

router.post(
  '/banner',
  authenticate,
  imageUpload.single('banner'),
  authController.uploadBanner,
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: forgotPasswordSchema }),
  authController.forgotPassword,
);

export default router;
