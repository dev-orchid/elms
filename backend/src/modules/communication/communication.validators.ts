import { z } from 'zod';

// ─── Forum ────────────────────────────────────────────────

export const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
});

export const threadIdParamSchema = z.object({
  threadId: z.string().uuid('Invalid thread ID'),
});

export const createThreadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
});

export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  parent_id: z.string().uuid().optional(),
});

export const threadQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const moderateThreadSchema = z.object({
  is_pinned: z.boolean().optional(),
  is_locked: z.boolean().optional(),
});

// ─── Messages ─────────────────────────────────────────────

export const sendMessageSchema = z.object({
  receiver_id: z.string().uuid('Invalid receiver ID'),
  content: z.string().min(1, 'Message content is required'),
});

export const conversationParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const messagesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── Notifications ────────────────────────────────────────

export const notificationsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  is_read: z.enum(['true', 'false']).optional(),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().uuid('Invalid notification ID'),
});

// ─── Announcements ────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  course_id: z.string().uuid().optional(),
});

export const announcementIdParamSchema = z.object({
  announcementId: z.string().uuid('Invalid announcement ID'),
});

export const announcementsQuerySchema = z.object({
  course_id: z.string().uuid().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── Types ────────────────────────────────────────────────

export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ModerateThreadInput = z.infer<typeof moderateThreadSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
