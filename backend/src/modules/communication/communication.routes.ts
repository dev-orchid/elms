import { Router } from 'express';
import { communicationController } from './communication.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/roles.js';
import {
  courseIdParamSchema,
  threadIdParamSchema,
  createThreadSchema,
  createPostSchema,
  threadQuerySchema,
  moderateThreadSchema,
  sendMessageSchema,
  conversationParamSchema,
  messagesQuerySchema,
  notificationsQuerySchema,
  notificationIdParamSchema,
  createAnnouncementSchema,
  announcementIdParamSchema,
  announcementsQuerySchema,
} from './communication.validators.js';

const router = Router();

// ─── Forums ──────────────────────────────────────────────

router.get(
  '/courses/:courseId/threads',
  authenticate,
  validate({ params: courseIdParamSchema, query: threadQuerySchema }),
  communicationController.listThreads,
);

router.get(
  '/threads/:threadId',
  authenticate,
  validate({ params: threadIdParamSchema }),
  communicationController.getThread,
);

router.post(
  '/courses/:courseId/threads',
  authenticate,
  validate({ params: courseIdParamSchema, body: createThreadSchema }),
  communicationController.createThread,
);

router.post(
  '/threads/:threadId/posts',
  authenticate,
  validate({ params: threadIdParamSchema, body: createPostSchema }),
  communicationController.createPost,
);

router.patch(
  '/threads/:threadId/moderate',
  authenticate,
  validate({ params: threadIdParamSchema, body: moderateThreadSchema }),
  communicationController.moderateThread,
);

router.delete(
  '/threads/:threadId',
  authenticate,
  validate({ params: threadIdParamSchema }),
  communicationController.deleteThread,
);

router.delete(
  '/posts/:postId',
  authenticate,
  communicationController.deletePost,
);

// ─── Messages ────────────────────────────────────────────

router.get(
  '/messages',
  authenticate,
  validate({ query: messagesQuerySchema }),
  communicationController.getConversations,
);

router.get(
  '/messages/:userId',
  authenticate,
  validate({ params: conversationParamSchema, query: messagesQuerySchema }),
  communicationController.getConversation,
);

router.post(
  '/messages',
  authenticate,
  validate({ body: sendMessageSchema }),
  communicationController.sendMessage,
);

// ─── Notifications ───────────────────────────────────────

router.get(
  '/notifications',
  authenticate,
  validate({ query: notificationsQuerySchema }),
  communicationController.getNotifications,
);

router.get(
  '/notifications/unread-count',
  authenticate,
  communicationController.getUnreadCount,
);

router.patch(
  '/notifications/:notificationId/read',
  authenticate,
  validate({ params: notificationIdParamSchema }),
  communicationController.markNotificationRead,
);

router.post(
  '/notifications/mark-all-read',
  authenticate,
  communicationController.markAllRead,
);

// ─── Announcements ───────────────────────────────────────

router.get(
  '/announcements',
  authenticate,
  validate({ query: announcementsQuerySchema }),
  communicationController.listAnnouncements,
);

router.post(
  '/announcements',
  authenticate,
  requireRole('instructor', 'admin'),
  validate({ body: createAnnouncementSchema }),
  communicationController.createAnnouncement,
);

router.delete(
  '/announcements/:announcementId',
  authenticate,
  validate({ params: announcementIdParamSchema }),
  communicationController.deleteAnnouncement,
);

export default router;
