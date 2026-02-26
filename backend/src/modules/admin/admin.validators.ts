import { z } from 'zod';

// ─── Users ────────────────────────────────────────────────

export const usersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  role: z.enum(['learner', 'instructor', 'admin', 'partner']).optional(),
  is_active: z.enum(['true', 'false']).optional(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['learner', 'instructor', 'admin', 'partner']),
});

export const updateUserStatusSchema = z.object({
  is_active: z.boolean(),
});

// ─── Bundles ──────────────────────────────────────────────

export const createBundleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  is_sequential: z.boolean().optional(),
});

export const updateBundleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  is_sequential: z.boolean().optional(),
});

export const bundleIdParamSchema = z.object({
  bundleId: z.string().uuid('Invalid bundle ID'),
});

export const manageBundleCoursesSchema = z.object({
  courses: z.array(
    z.object({
      course_id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    }),
  ),
});

export const bundlesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

// ─── Audit Logs ───────────────────────────────────────────

export const auditLogsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  user_id: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

// ─── Integrations ─────────────────────────────────────────

export const integrationIdParamSchema = z.object({
  integrationId: z.string().uuid('Invalid integration ID'),
});

export const updateIntegrationSchema = z.object({
  config: z.record(z.unknown()).optional(),
  is_enabled: z.boolean().optional(),
});

// ─── Instructor Analytics ─────────────────────────────────

export const courseAnalyticsParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

// ─── Types ────────────────────────────────────────────────

export type UsersQuery = z.infer<typeof usersQuerySchema>;
export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;
export type ManageBundleCoursesInput = z.infer<typeof manageBundleCoursesSchema>;
export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;
