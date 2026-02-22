import { z } from 'zod';

// ─── Question Bank ──────────────────────────────────────

export const createQuestionSchema = z.object({
  course_id: z.string().uuid(),
  category: z.string().max(100).optional(),
  question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay']),
  question_text: z.string().min(1, 'Question text is required'),
  options: z.any().optional(), // JSONB - array of {id, text} for MCQ
  correct_answer: z.string().min(1, 'Correct answer is required'),
  points: z.number().int().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  explanation: z.string().optional(),
});

export const updateQuestionSchema = z.object({
  category: z.string().max(100).optional(),
  question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay']).optional(),
  question_text: z.string().min(1).optional(),
  options: z.any().optional(),
  correct_answer: z.string().min(1).optional(),
  points: z.number().int().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  explanation: z.string().optional(),
});

export const questionQuerySchema = z.object({
  course_id: z.string().uuid().optional(),
  category: z.string().optional(),
  question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const questionIdParamSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
});

export const bulkDeleteQuestionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID required'),
});

// ─── Assessments ────────────────────────────────────────

export const createAssessmentSchema = z.object({
  course_id: z.string().uuid(),
  module_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  type: z.enum(['quiz', 'mid_term', 'final', 'assignment']).optional(),
  description: z.string().max(2000).optional(),
  time_limit_minutes: z.number().int().min(1).optional().nullable(),
  max_attempts: z.number().int().min(1).optional(),
  shuffle_questions: z.boolean().optional(),
  passing_score: z.number().min(0).max(100).optional(),
  is_published: z.boolean().optional(),
  available_from: z.string().optional().nullable(),
  available_until: z.string().optional().nullable(),
});

export const updateAssessmentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  type: z.enum(['quiz', 'mid_term', 'final', 'assignment']).optional(),
  description: z.string().max(2000).optional(),
  time_limit_minutes: z.number().int().min(1).optional().nullable(),
  max_attempts: z.number().int().min(1).optional(),
  shuffle_questions: z.boolean().optional(),
  passing_score: z.number().min(0).max(100).optional(),
  is_published: z.boolean().optional(),
  available_from: z.string().optional().nullable(),
  available_until: z.string().optional().nullable(),
});

export const assessmentIdParamSchema = z.object({
  assessmentId: z.string().uuid('Invalid assessment ID'),
});

export const assessmentQuerySchema = z.object({
  course_id: z.string().uuid().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const addQuestionsSchema = z.object({
  question_ids: z.array(z.string().uuid()).min(1),
});

export const reorderQuestionsSchema = z.object({
  order: z.array(z.object({
    question_id: z.string().uuid(),
    sort_order: z.number().int().min(0),
  })),
});

// ─── Submissions ────────────────────────────────────────

export const submissionIdParamSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
});

export const saveAnswerSchema = z.object({
  question_id: z.string().uuid(),
  answer_text: z.string().optional().nullable(),
  selected_options: z.any().optional().nullable(),
});

export const gradeSubmissionSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    points_awarded: z.number().min(0),
    feedback: z.string().optional(),
  })),
});

export const submissionsQuerySchema = z.object({
  status: z.enum(['in_progress', 'submitted', 'graded']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── Type exports ───────────────────────────────────────

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionQuery = z.infer<typeof questionQuerySchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
