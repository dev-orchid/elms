import { z } from 'zod';

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export const lessonIdParamSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
});

export const myEnrollmentsQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'dropped']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CourseIdParam = z.infer<typeof courseIdParamSchema>;
export type LessonIdParam = z.infer<typeof lessonIdParamSchema>;
export type MyEnrollmentsQuery = z.infer<typeof myEnrollmentsQuerySchema>;
