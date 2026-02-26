import { Router } from 'express';
import { assessmentsController } from './assessments.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  questionQuerySchema,
  questionIdParamSchema,
  bulkDeleteQuestionsSchema,
  createAssessmentSchema,
  updateAssessmentSchema,
  assessmentIdParamSchema,
  assessmentQuerySchema,
  addQuestionsSchema,
  reorderQuestionsSchema,
  submissionIdParamSchema,
  saveAnswerSchema,
  gradeSubmissionSchema,
  submissionsQuerySchema,
} from './assessments.validators.js';

const router = Router();

// ─── Question Bank ──────────────────────────────────────

router.get(
  '/questions',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ query: questionQuerySchema }),
  assessmentsController.listQuestions,
);

router.post(
  '/questions',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ body: createQuestionSchema }),
  assessmentsController.createQuestion,
);

router.patch(
  '/questions/:questionId',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: questionIdParamSchema, body: updateQuestionSchema }),
  assessmentsController.updateQuestion,
);

router.delete(
  '/questions/:questionId',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: questionIdParamSchema }),
  assessmentsController.deleteQuestion,
);

router.post(
  '/questions/bulk-delete',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ body: bulkDeleteQuestionsSchema }),
  assessmentsController.bulkDeleteQuestions,
);

// ─── Assessments ────────────────────────────────────────

router.get(
  '/assessments',
  authenticate,
  validate({ query: assessmentQuerySchema }),
  assessmentsController.listAssessments,
);

router.get(
  '/assessments/:assessmentId',
  authenticate,
  validate({ params: assessmentIdParamSchema }),
  assessmentsController.getAssessment,
);

router.post(
  '/assessments',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ body: createAssessmentSchema }),
  assessmentsController.createAssessment,
);

router.patch(
  '/assessments/:assessmentId',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: assessmentIdParamSchema, body: updateAssessmentSchema }),
  assessmentsController.updateAssessment,
);

router.delete(
  '/assessments/:assessmentId',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: assessmentIdParamSchema }),
  assessmentsController.deleteAssessment,
);

// Assessment question management
router.post(
  '/assessments/:assessmentId/questions',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: assessmentIdParamSchema, body: addQuestionsSchema }),
  assessmentsController.addQuestions,
);

router.delete(
  '/assessments/:assessmentId/questions/:questionId',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: assessmentIdParamSchema.merge(questionIdParamSchema) }),
  assessmentsController.removeQuestion,
);

router.patch(
  '/assessments/:assessmentId/questions/reorder',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: assessmentIdParamSchema, body: reorderQuestionsSchema }),
  assessmentsController.reorderQuestions,
);

// ─── Submissions ────────────────────────────────────────

router.post(
  '/assessments/:assessmentId/start',
  authenticate,
  validate({ params: assessmentIdParamSchema }),
  assessmentsController.startSubmission,
);

router.post(
  '/submissions/:submissionId/answer',
  authenticate,
  validate({ params: submissionIdParamSchema, body: saveAnswerSchema }),
  assessmentsController.saveAnswer,
);

router.post(
  '/submissions/:submissionId/submit',
  authenticate,
  validate({ params: submissionIdParamSchema }),
  assessmentsController.submitSubmission,
);

router.get(
  '/submissions/:submissionId/results',
  authenticate,
  validate({ params: submissionIdParamSchema }),
  assessmentsController.getResults,
);

// Learner's own submissions for an assessment
router.get(
  '/assessments/:assessmentId/my-submissions',
  authenticate,
  validate({ params: assessmentIdParamSchema }),
  assessmentsController.getMySubmissions,
);

// ─── Grading ──────────────────────────────────────────

router.get(
  '/assessments/:assessmentId/submissions',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: assessmentIdParamSchema, query: submissionsQuerySchema }),
  assessmentsController.listSubmissions,
);

router.post(
  '/submissions/:submissionId/grade',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ params: submissionIdParamSchema, body: gradeSubmissionSchema }),
  assessmentsController.gradeSubmission,
);

export default router;
