import { Router } from 'express';
import { certificatesController } from './certificates.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import {
  generateCertificateSchema,
  verifyCodeParamSchema,
} from './certificates.validators.js';

const router = Router();

// Generate certificate for a completed course
router.post(
  '/certificates/generate',
  authenticate,
  validate({ body: generateCertificateSchema }),
  certificatesController.generate,
);

// Get my certificates
router.get(
  '/certificates/my',
  authenticate,
  certificatesController.getMyCertificates,
);

// Public verification (no auth required)
router.get(
  '/certificates/verify/:code',
  validate({ params: verifyCodeParamSchema }),
  certificatesController.verify,
);

export default router;
