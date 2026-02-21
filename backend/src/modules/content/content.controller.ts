import { Request, Response, NextFunction } from 'express';
import { contentService } from './content.service.js';
import { logAudit } from '../../utils/audit.js';

export class ContentController {
  // ─── Modules ──────────────────────────────────────────

  async createModule(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      const mod = await contentService.createModule(
        req.params.courseId,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'create_module',
        resource: 'modules',
        resourceId: mod.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ module: mod });
    } catch (err) {
      next(err);
    }
  }

  async updateModule(req: Request<{ moduleId: string }>, res: Response, next: NextFunction) {
    try {
      const mod = await contentService.updateModule(
        req.params.moduleId,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'update_module',
        resource: 'modules',
        resourceId: req.params.moduleId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ module: mod });
    } catch (err) {
      next(err);
    }
  }

  async deleteModule(req: Request<{ moduleId: string }>, res: Response, next: NextFunction) {
    try {
      await contentService.deleteModule(
        req.params.moduleId,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'delete_module',
        resource: 'modules',
        resourceId: req.params.moduleId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Module deleted' });
    } catch (err) {
      next(err);
    }
  }

  async reorderModules(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      await contentService.reorderModules(
        req.params.courseId,
        req.body.order,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'reorder_modules',
        resource: 'modules',
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Modules reordered' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Lessons ──────────────────────────────────────────

  async createLesson(req: Request<{ moduleId: string }>, res: Response, next: NextFunction) {
    try {
      const lesson = await contentService.createLesson(
        req.params.moduleId,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'create_lesson',
        resource: 'lessons',
        resourceId: lesson.id,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ lesson });
    } catch (err) {
      next(err);
    }
  }

  async updateLesson(req: Request<{ lessonId: string }>, res: Response, next: NextFunction) {
    try {
      const lesson = await contentService.updateLesson(
        req.params.lessonId,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'update_lesson',
        resource: 'lessons',
        resourceId: req.params.lessonId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ lesson });
    } catch (err) {
      next(err);
    }
  }

  async deleteLesson(req: Request<{ lessonId: string }>, res: Response, next: NextFunction) {
    try {
      await contentService.deleteLesson(
        req.params.lessonId,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'delete_lesson',
        resource: 'lessons',
        resourceId: req.params.lessonId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Lesson deleted' });
    } catch (err) {
      next(err);
    }
  }

  async reorderLessons(req: Request<{ moduleId: string }>, res: Response, next: NextFunction) {
    try {
      await contentService.reorderLessons(
        req.params.moduleId,
        req.body.order,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'reorder_lessons',
        resource: 'lessons',
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Lessons reordered' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Upload ───────────────────────────────────────────

  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const result = await contentService.uploadFile(req.file, req.user!.id);

      await logAudit({
        userId: req.user!.id,
        action: 'upload_file',
        resource: 'files',
        changes: { filename: req.file.originalname, mimetype: req.file.mimetype },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const contentController = new ContentController();
