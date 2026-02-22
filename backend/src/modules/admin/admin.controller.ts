import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';
import { logAudit } from '../../utils/audit.js';

export class AdminController {
  // ─── Dashboard ──────────────────────────────────────────

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ stats });
    } catch (err) {
      next(err);
    }
  }

  async getInstructorStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getInstructorStats(req.user!.id);
      res.json({ stats });
    } catch (err) {
      next(err);
    }
  }

  // ─── Users ──────────────────────────────────────────────

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req: Request<{ userId: string }>, res: Response, next: NextFunction) {
    try {
      const user = await adminService.updateUserRole(
        req.params.userId,
        req.body.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'change_role',
        resource: 'profiles',
        resourceId: req.params.userId,
        changes: { role: req.body.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req: Request<{ userId: string }>, res: Response, next: NextFunction) {
    try {
      const user = await adminService.updateUserStatus(
        req.params.userId,
        req.body.is_active,
      );

      await logAudit({
        userId: req.user!.id,
        action: req.body.is_active ? 'activate_user' : 'deactivate_user',
        resource: 'profiles',
        resourceId: req.params.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ user });
    } catch (err) {
      next(err);
    }
  }

  // ─── Bundles ────────────────────────────────────────────

  async listBundles(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listBundles(
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createBundle(req: Request, res: Response, next: NextFunction) {
    try {
      const bundle = await adminService.createBundle(req.body, req.user!.id);

      await logAudit({
        userId: req.user!.id,
        action: 'create_bundle',
        resource: 'course_bundles',
        resourceId: bundle.id,
        changes: { title: req.body.title },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ bundle });
    } catch (err) {
      next(err);
    }
  }

  async updateBundle(req: Request<{ bundleId: string }>, res: Response, next: NextFunction) {
    try {
      const bundle = await adminService.updateBundle(req.params.bundleId, req.body);

      await logAudit({
        userId: req.user!.id,
        action: 'update_bundle',
        resource: 'course_bundles',
        resourceId: req.params.bundleId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ bundle });
    } catch (err) {
      next(err);
    }
  }

  async deleteBundle(req: Request<{ bundleId: string }>, res: Response, next: NextFunction) {
    try {
      await adminService.deleteBundle(req.params.bundleId);

      await logAudit({
        userId: req.user!.id,
        action: 'delete_bundle',
        resource: 'course_bundles',
        resourceId: req.params.bundleId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Bundle deleted' });
    } catch (err) {
      next(err);
    }
  }

  async manageBundleCourses(req: Request<{ bundleId: string }>, res: Response, next: NextFunction) {
    try {
      await adminService.manageBundleCourses(req.params.bundleId, req.body);

      await logAudit({
        userId: req.user!.id,
        action: 'manage_bundle_courses',
        resource: 'course_bundles',
        resourceId: req.params.bundleId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Bundle courses updated' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Audit Logs ─────────────────────────────────────────

  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listAuditLogs(
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async exportAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await adminService.exportAuditLogs(
        req.query as Record<string, string>,
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  // ─── Integrations ──────────────────────────────────────

  async listIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listIntegrations();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateIntegration(req: Request<{ integrationId: string }>, res: Response, next: NextFunction) {
    try {
      const integration = await adminService.updateIntegration(
        req.params.integrationId,
        req.body,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'update_integration',
        resource: 'integration_configs',
        resourceId: req.params.integrationId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ integration });
    } catch (err) {
      next(err);
    }
  }

  // ─── Instructor Analytics ──────────────────────────────

  async getCourseAnalytics(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      const analytics = await adminService.getCourseAnalytics(req.params.courseId);
      res.json({ analytics });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
