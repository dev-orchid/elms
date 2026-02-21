import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_hours: z.number().min(0).optional(),
  is_certification_enabled: z.boolean().optional(),
  passing_score: z.number().min(0).max(100).optional(),
  max_enrollments: z.number().int().min(0).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimated_hours: z.number().min(0).optional(),
  is_certification_enabled: z.boolean().optional(),
  passing_score: z.number().min(0).max(100).optional(),
  max_enrollments: z.number().int().min(0).optional().nullable(),
  thumbnail_url: z.string().url().optional().nullable(),
});

export const courseQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'title', 'popular']).optional(),
});

export const courseIdParamSchema = z.object({
  id: z.string().uuid('Invalid course ID'),
});

export const courseSlugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const addInstructorSchema = z.object({
  instructor_id: z.string().uuid('Invalid instructor ID'),
  role: z.enum(['lead', 'assistant', 'grader']),
});

export const removeInstructorParamSchema = z.object({
  id: z.string().uuid('Invalid course ID'),
  instructorId: z.string().uuid('Invalid instructor ID'),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQuery = z.infer<typeof courseQuerySchema>;
export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type CourseSlugParam = z.infer<typeof courseSlugParamSchema>;
export type AddInstructorInput = z.infer<typeof addInstructorSchema>;
export type RemoveInstructorParam = z.infer<typeof removeInstructorParamSchema>;
