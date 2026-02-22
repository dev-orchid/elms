import { Request, Response, NextFunction } from 'express';
import { enrollmentsService } from './enrollments.service.js';
import { logAudit } from '../../utils/audit.js';

export class EnrollmentsController {
  async enroll(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      const enrollment = await enrollmentsService.enroll(
        req.params.courseId,
        req.user!.id,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'enroll',
        resource: 'enrollments',
        resourceId: enrollment.id,
        changes: { course_id: req.params.courseId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ enrollment });
    } catch (err) {
      next(err);
    }
  }

  async getMyEnrollments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await enrollmentsService.getMyEnrollments(
        req.user!.id,
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async completeLesson(req: Request<{ lessonId: string }>, res: Response, next: NextFunction) {
    try {
      const progress = await enrollmentsService.completeLesson(
        req.params.lessonId,
        req.user!.id,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'complete_lesson',
        resource: 'lesson_progress',
        changes: { lesson_id: req.params.lessonId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ progress });
    } catch (err) {
      next(err);
    }
  }

  async getCourseProgress(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      const progress = await enrollmentsService.getCourseProgress(
        req.params.courseId,
        req.user!.id,
      );
      res.json({ progress });
    } catch (err) {
      next(err);
    }
  }
}

export const enrollmentsController = new EnrollmentsController();
