import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import {
  usersQuerySchema,
  userIdParamSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  bundlesQuerySchema,
  bundleIdParamSchema,
  createBundleSchema,
  updateBundleSchema,
  manageBundleCoursesSchema,
  auditLogsQuerySchema,
  integrationIdParamSchema,
  updateIntegrationSchema,
  courseAnalyticsParamSchema,
} from './admin.validators.js';

const router = Router();

// ─── Admin Dashboard ─────────────────────────────────────

router.get(
  '/admin/dashboard',
  authenticate,
  requireRole('admin', 'super_admin'),
  adminController.getDashboardStats,
);

// ─── Instructor Stats ────────────────────────────────────

router.get(
  '/instructor/stats',
  authenticate,
  requireRole('instructor', 'admin', 'super_admin'),
  adminController.getInstructorStats,
);

// ─── Users ───────────────────────────────────────────────

router.get(
  '/admin/users',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ query: usersQuerySchema }),
  adminController.listUsers,
);

router.patch(
  '/admin/users/:userId/role',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: userIdParamSchema, body: updateUserRoleSchema }),
  adminController.updateUserRole,
);

router.patch(
  '/admin/users/:userId/status',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: userIdParamSchema, body: updateUserStatusSchema }),
  adminController.updateUserStatus,
);

// ─── Bundles ─────────────────────────────────────────────

router.get(
  '/admin/bundles',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ query: bundlesQuerySchema }),
  adminController.listBundles,
);

router.post(
  '/admin/bundles',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ body: createBundleSchema }),
  adminController.createBundle,
);

router.patch(
  '/admin/bundles/:bundleId',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: bundleIdParamSchema, body: updateBundleSchema }),
  adminController.updateBundle,
);

router.delete(
  '/admin/bundles/:bundleId',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: bundleIdParamSchema }),
  adminController.deleteBundle,
);

router.put(
  '/admin/bundles/:bundleId/courses',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: bundleIdParamSchema, body: manageBundleCoursesSchema }),
  adminController.manageBundleCourses,
);

// ─── Audit Logs ──────────────────────────────────────────

router.get(
  '/admin/audit-logs',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ query: auditLogsQuerySchema }),
  adminController.listAuditLogs,
);

router.get(
  '/admin/audit-logs/export',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ query: auditLogsQuerySchema }),
  adminController.exportAuditLogs,
);

// ─── Integrations ────────────────────────────────────────

router.get(
  '/admin/integrations',
  authenticate,
  requireRole('admin', 'super_admin'),
  adminController.listIntegrations,
);

router.patch(
  '/admin/integrations/:integrationId',
  authenticate,
  requireRole('admin', 'super_admin'),
  validate({ params: integrationIdParamSchema, body: updateIntegrationSchema }),
  adminController.updateIntegration,
);

// ─── Instructor Analytics ────────────────────────────────

router.get(
  '/instructor/analytics/:courseId',
  authenticate,
  requireRole('instructor', 'admin', 'super_admin'),
  validate({ params: courseAnalyticsParamSchema }),
  adminController.getCourseAnalytics,
);

export default router;
