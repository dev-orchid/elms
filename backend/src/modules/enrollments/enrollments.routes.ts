import { Router } from 'express';
import { enrollmentsController } from './enrollments.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import {
  courseIdParamSchema,
  lessonIdParamSchema,
  myEnrollmentsQuerySchema,
} from './enrollments.validators.js';

const router = Router();

// Enroll in a course
router.post(
  '/courses/:courseId/enroll',
  authenticate,
  validate({ params: courseIdParamSchema }),
  enrollmentsController.enroll,
);

// Get my enrollments
router.get(
  '/enrollments/my',
  authenticate,
  validate({ query: myEnrollmentsQuerySchema }),
  enrollmentsController.getMyEnrollments,
);

// Mark lesson as complete
router.post(
  '/lessons/:lessonId/complete',
  authenticate,
  validate({ params: lessonIdParamSchema }),
  enrollmentsController.completeLesson,
);

// Get progress for a course
router.get(
  '/courses/:courseId/progress',
  authenticate,
  validate({ params: courseIdParamSchema }),
  enrollmentsController.getCourseProgress,
);

export default router;
