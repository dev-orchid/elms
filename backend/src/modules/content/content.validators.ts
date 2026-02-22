import { z } from 'zod';

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export const moduleIdParamSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
});

export const lessonIdParamSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID'),
});

export const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  is_published: z.boolean().optional(),
});

export const updateModuleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  is_published: z.boolean().optional(),
});

export const reorderModulesSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    }),
  ),
});

export const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(2000).optional(),
  content_type: z.enum(['video', 'pdf', 'text', 'embed', 'slides']).optional(),
  content_url: z.string().url().optional().nullable(),
  content_body: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  content_type: z.enum(['video', 'pdf', 'text', 'embed', 'slides']).optional(),
  content_url: z.string().url().optional().nullable(),
  content_body: z.string().optional().nullable(),
  duration_minutes: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
});

export const reorderLessonsSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    }),
  ),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;
