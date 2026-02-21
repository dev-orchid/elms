import { Router } from 'express';
import { coursesController } from './courses.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
  courseIdParamSchema,
  courseSlugParamSchema,
  addInstructorSchema,
  removeInstructorParamSchema,
} from './courses.validators.js';

const router = Router();

// List courses
router.get(
  '/',
  authenticate,
  validate({ query: courseQuerySchema }),
  coursesController.list,
);

// Get course by slug
router.get(
  '/by-slug/:slug',
  authenticate,
  validate({ params: courseSlugParamSchema }),
  coursesController.getBySlug,
);

// Get course by ID
router.get(
  '/:id',
  authenticate,
  validate({ params: courseIdParamSchema }),
  coursesController.getById,
);

// Create course
router.post(
  '/',
  authenticate,
  requireRole('instructor', 'admin', 'super_admin'),
  validate({ body: createCourseSchema }),
  coursesController.create,
);

// Update course
router.patch(
  '/:id',
  authenticate,
  validate({ params: courseIdParamSchema, body: updateCourseSchema }),
  coursesController.update,
);

// Publish course
router.post(
  '/:id/publish',
  authenticate,
  validate({ params: courseIdParamSchema }),
  coursesController.publish,
);

// Archive course (admin only)
router.post(
  '/:id/archive',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: courseIdParamSchema }),
  coursesController.archive,
);

// Soft-delete course (admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: courseIdParamSchema }),
  coursesController.softDelete,
);

// Add instructor
router.post(
  '/:id/instructors',
  authenticate,
  validate({ params: courseIdParamSchema, body: addInstructorSchema }),
  coursesController.addInstructor,
);

// Remove instructor
router.delete(
  '/:id/instructors/:instructorId',
  authenticate,
  validate({ params: removeInstructorParamSchema }),
  coursesController.removeInstructor,
);

export default router;
