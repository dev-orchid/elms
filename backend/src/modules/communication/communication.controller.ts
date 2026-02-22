import { Request, Response, NextFunction } from 'express';
import { communicationService } from './communication.service.js';
import { logAudit } from '../../utils/audit.js';

export class CommunicationController {
  // ─── Forums ──────────────────────────────────────────────

  async listThreads(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.listThreads(
        req.params.courseId,
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getThread(req: Request<{ threadId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.getThread(req.params.threadId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createThread(req: Request<{ courseId: string }>, res: Response, next: NextFunction) {
    try {
      const thread = await communicationService.createThread(
        req.params.courseId,
        req.body,
        req.user!.id,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'create_thread',
        resource: 'forum_threads',
        resourceId: thread.id,
        changes: { course_id: req.params.courseId, title: req.body.title },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ thread });
    } catch (err) {
      next(err);
    }
  }

  async createPost(req: Request<{ threadId: string }>, res: Response, next: NextFunction) {
    try {
      const post = await communicationService.createPost(
        req.params.threadId,
        req.body,
        req.user!.id,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'create_post',
        resource: 'forum_posts',
        resourceId: post.id,
        changes: { thread_id: req.params.threadId },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ post });
    } catch (err) {
      next(err);
    }
  }

  async moderateThread(req: Request<{ threadId: string }>, res: Response, next: NextFunction) {
    try {
      const thread = await communicationService.moderateThread(
        req.params.threadId,
        req.body,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'moderate_thread',
        resource: 'forum_threads',
        resourceId: req.params.threadId,
        changes: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ thread });
    } catch (err) {
      next(err);
    }
  }

  async deleteThread(req: Request<{ threadId: string }>, res: Response, next: NextFunction) {
    try {
      await communicationService.deleteThread(
        req.params.threadId,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'delete_thread',
        resource: 'forum_threads',
        resourceId: req.params.threadId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Thread deleted' });
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req: Request<{ postId: string }>, res: Response, next: NextFunction) {
    try {
      await communicationService.deletePost(
        req.params.postId,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'delete_post',
        resource: 'forum_posts',
        resourceId: req.params.postId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Post deleted' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Messages ────────────────────────────────────────────

  async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.getConversations(
        req.user!.id,
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getConversation(req: Request<{ userId: string }>, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.getConversation(
        req.user!.id,
        req.params.userId,
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await communicationService.sendMessage(
        req.user!.id,
        req.body.receiver_id,
        req.body.content,
      );

      res.status(201).json({ message });
    } catch (err) {
      next(err);
    }
  }

  // ─── Notifications ──────────────────────────────────────

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.getNotifications(
        req.user!.id,
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.getUnreadCount(req.user!.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async markNotificationRead(req: Request<{ notificationId: string }>, res: Response, next: NextFunction) {
    try {
      await communicationService.markNotificationRead(
        req.params.notificationId,
        req.user!.id,
      );
      res.json({ message: 'Marked as read' });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      await communicationService.markAllRead(req.user!.id);
      res.json({ message: 'All marked as read' });
    } catch (err) {
      next(err);
    }
  }

  // ─── Announcements ──────────────────────────────────────

  async listAnnouncements(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await communicationService.listAnnouncements(
        req.query as Record<string, string>,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createAnnouncement(req: Request, res: Response, next: NextFunction) {
    try {
      const announcement = await communicationService.createAnnouncement(
        req.body,
        req.user!.id,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'create_announcement',
        resource: 'announcements',
        resourceId: announcement.id,
        changes: { title: req.body.title, course_id: req.body.course_id },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.status(201).json({ announcement });
    } catch (err) {
      next(err);
    }
  }

  async deleteAnnouncement(req: Request<{ announcementId: string }>, res: Response, next: NextFunction) {
    try {
      await communicationService.deleteAnnouncement(
        req.params.announcementId,
        req.user!.id,
        req.user!.role,
      );

      await logAudit({
        userId: req.user!.id,
        action: 'delete_announcement',
        resource: 'announcements',
        resourceId: req.params.announcementId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({ message: 'Announcement deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const communicationController = new CommunicationController();
