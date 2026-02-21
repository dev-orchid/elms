import { Request, Response, NextFunction } from 'express';
import { coursesService } from './courses.service.js';
import { logAudit } from '../../utils/audit.js';

export class CoursesController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await coursesService.list(
        req.query as Record<string, string>,
        req.user!.role,
        req.user!.id,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getBySlug(req: Request<{ slug: string }>, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.getBySlug(req.params.slug);
      res.json({ course });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.getById(req.params.id);
      res.json({ course });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.create(req.body, req.user!.id);

      await logAudit({
        userId: req.user!.id,
        action: 'create_course',
        resource: 'courses',
        resourceId: course.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ course });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.update(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'update_course',
        resource: 'courses',
        resourceId: req.params.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ course });
    } catch (err) {
      next(err);
    }
  }

  async publish(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.publish(
        req.params.id,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'publish_course',
        resource: 'courses',
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ course });
    } catch (err) {
      next(err);
    }
  }

  async archive(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const course = await coursesService.archive(req.params.id);

      await logAudit({
        userId: req.user!.id,
        action: 'archive_course',
        resource: 'courses',
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ course });
    } catch (err) {
      next(err);
    }
  }

  async softDelete(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      await coursesService.softDelete(req.params.id);

      await logAudit({
        userId: req.user!.id,
        action: 'delete_course',
        resource: 'courses',
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Course deleted' });
    } catch (err) {
      next(err);
    }
  }

  async addInstructor(req: Request<{ id: string }>, res: Response, next: NextFunction) {
    try {
      const instructor = await coursesService.addInstructor(
        req.params.id,
        req.body.instructor_id,
        req.body.role,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'add_instructor',
        resource: 'courses',
        resourceId: req.params.id,
        changes: { instructor_id: req.body.instructor_id, role: req.body.role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ instructor });
    } catch (err) {
      next(err);
    }
  }

  async removeInstructor(req: Request<{ id: string; instructorId: string }>, res: Response, next: NextFunction) {
    try {
      await coursesService.removeInstructor(
        req.params.id,
        req.params.instructorId,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'remove_instructor',
        resource: 'courses',
        resourceId: req.params.id,
        changes: { instructor_id: req.params.instructorId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Instructor removed' });
    } catch (err) {
      next(err);
    }
  }
}

export const coursesController = new CoursesController();
