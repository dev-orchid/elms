import { Router } from 'express';
import multer from 'multer';
import { contentController } from './content.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import {
  courseIdParamSchema,
  moduleIdParamSchema,
  lessonIdParamSchema,
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
} from './content.validators.js';

const router = Router();

// Multer config: memory storage, 500MB limit
const ALLOWED_MIMETYPES = [
  'application/pdf',
  'video/mp4',
  'video/webm',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'image/png',
  'image/jpeg',
  'image/gif',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

// ─── Module routes ──────────────────────────────────────

router.post(
  '/courses/:courseId/modules',
  authenticate,
  validate({ params: courseIdParamSchema, body: createModuleSchema }),
  contentController.createModule,
);

router.patch(
  '/modules/:moduleId',
  authenticate,
  validate({ params: moduleIdParamSchema, body: updateModuleSchema }),
  contentController.updateModule,
);

router.delete(
  '/modules/:moduleId',
  authenticate,
  validate({ params: moduleIdParamSchema }),
  contentController.deleteModule,
);

router.patch(
  '/courses/:courseId/modules/reorder',
  authenticate,
  validate({ params: courseIdParamSchema, body: reorderModulesSchema }),
  contentController.reorderModules,
);

// ─── Lesson routes ──────────────────────────────────────

router.post(
  '/modules/:moduleId/lessons',
  authenticate,
  validate({ params: moduleIdParamSchema, body: createLessonSchema }),
  contentController.createLesson,
);

router.patch(
  '/lessons/:lessonId',
  authenticate,
  validate({ params: lessonIdParamSchema, body: updateLessonSchema }),
  contentController.updateLesson,
);

router.delete(
  '/lessons/:lessonId',
  authenticate,
  validate({ params: lessonIdParamSchema }),
  contentController.deleteLesson,
);

router.patch(
  '/modules/:moduleId/lessons/reorder',
  authenticate,
  validate({ params: moduleIdParamSchema, body: reorderLessonsSchema }),
  contentController.reorderLessons,
);

// ─── File upload ────────────────────────────────────────

router.post(
  '/upload',
  authenticate,
  requireRole('instructor', 'admin', 'super_admin'),
  upload.single('file'),
  contentController.uploadFile,
);

export default router;
