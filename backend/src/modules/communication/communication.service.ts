import { supabase } from '../../lib/supabase.js';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../../lib/errors.js';
import { parsePagination, paginationResult } from '../../utils/pagination.js';
import type {
  CreateThreadInput,
  CreatePostInput,
  ModerateThreadInput,
  SendMessageInput,
  CreateAnnouncementInput,
} from './communication.validators.js';

export class CommunicationService {
  // ─── Forums ──────────────────────────────────────────────

  async listThreads(courseId: string, query: Record<string, string>) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:profiles!forum_threads_created_by_fkey(id, first_name, last_name, avatar_url),
        posts:forum_posts(count)
      `, { count: 'exact' })
      .eq('course_id', courseId)
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch threads: ' + error.message, 500);
    }

    return {
      threads: data || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async getThread(threadId: string) {
    const { data: thread, error } = await supabase
      .from('forum_threads')
      .select(`
        *,
        author:profiles!forum_threads_created_by_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('id', threadId)
      .eq('is_deleted', false)
      .single();

    if (error || !thread) {
      throw new NotFoundError('Thread');
    }

    // Get posts with author info
    const { data: posts } = await supabase
      .from('forum_posts')
      .select(`
        *,
        author:profiles!forum_posts_created_by_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('thread_id', threadId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    return { thread, posts: posts || [] };
  }

  async createThread(courseId: string, input: CreateThreadInput, userId: string) {
    // Verify enrollment or instructor access
    await this.assertForumAccess(courseId, userId);

    const { data: thread, error } = await supabase
      .from('forum_threads')
      .insert({
        course_id: courseId,
        title: input.title,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create thread: ' + error.message, 500);
    }

    // Create the first post
    await supabase.from('forum_posts').insert({
      thread_id: thread.id,
      content: input.content,
      created_by: userId,
    });

    return thread;
  }

  async createPost(threadId: string, input: CreatePostInput, userId: string) {
    // Verify thread exists and is not locked
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('id, course_id, is_locked, is_deleted')
      .eq('id', threadId)
      .single();

    if (!thread || thread.is_deleted) {
      throw new NotFoundError('Thread');
    }
    if (thread.is_locked) {
      throw new ValidationError('This thread is locked');
    }

    await this.assertForumAccess(thread.course_id, userId);

    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert({
        thread_id: threadId,
        parent_id: input.parent_id || null,
        content: input.content,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create post: ' + error.message, 500);
    }

    // Update thread's updated_at
    await supabase
      .from('forum_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId);

    // Notify thread creator (if not self)
    if (thread.course_id) {
      const { data: threadData } = await supabase
        .from('forum_threads')
        .select('created_by, title')
        .eq('id', threadId)
        .single();

      if (threadData && threadData.created_by !== userId) {
        await this.createNotification(
          threadData.created_by,
          'forum',
          'New reply in your thread',
          `Someone replied to "${threadData.title}"`,
          `/learner/courses`,
        );
      }
    }

    return post;
  }

  async moderateThread(threadId: string, input: ModerateThreadInput, userId: string, userRole: string) {
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('id, course_id')
      .eq('id', threadId)
      .single();

    if (!thread) {
      throw new NotFoundError('Thread');
    }

    // Only instructors and admins can moderate
    if (!['instructor', 'admin', 'super_admin'].includes(userRole)) {
      throw new ForbiddenError('Only instructors and admins can moderate threads');
    }

    const updates: Record<string, unknown> = {};
    if (input.is_pinned !== undefined) updates.is_pinned = input.is_pinned;
    if (input.is_locked !== undefined) updates.is_locked = input.is_locked;

    const { data, error } = await supabase
      .from('forum_threads')
      .update(updates)
      .eq('id', threadId)
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to moderate thread: ' + error.message, 500);
    }

    return data;
  }

  async deleteThread(threadId: string, userId: string, userRole: string) {
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('id, created_by')
      .eq('id', threadId)
      .single();

    if (!thread) {
      throw new NotFoundError('Thread');
    }

    if (thread.created_by !== userId && !['instructor', 'admin', 'super_admin'].includes(userRole)) {
      throw new ForbiddenError('Not authorized to delete this thread');
    }

    await supabase
      .from('forum_threads')
      .update({ is_deleted: true })
      .eq('id', threadId);
  }

  async deletePost(postId: string, userId: string, userRole: string) {
    const { data: post } = await supabase
      .from('forum_posts')
      .select('id, created_by')
      .eq('id', postId)
      .single();

    if (!post) {
      throw new NotFoundError('Post');
    }

    if (post.created_by !== userId && !['instructor', 'admin', 'super_admin'].includes(userRole)) {
      throw new ForbiddenError('Not authorized to delete this post');
    }

    await supabase
      .from('forum_posts')
      .update({ is_deleted: true })
      .eq('id', postId);
  }

  private async assertForumAccess(courseId: string, userId: string) {
    // Check if enrolled or instructor
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .neq('status', 'dropped')
      .single();

    if (enrollment) return;

    const { data: instructor } = await supabase
      .from('course_instructors')
      .select('instructor_id')
      .eq('course_id', courseId)
      .eq('instructor_id', userId)
      .single();

    if (instructor) return;

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile && ['admin', 'super_admin'].includes(profile.role)) return;

    throw new ForbiddenError('You must be enrolled in this course to participate in the forum');
  }

  // ─── Messages ────────────────────────────────────────────

  async getConversations(userId: string, query: Record<string, string>) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    // Get distinct conversation partners with latest message
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new AppError('Failed to fetch conversations: ' + error.message, 500);
    }

    // Group by conversation partner
    const convMap = new Map<string, {
      partner_id: string;
      last_message: string;
      last_message_at: string;
      unread_count: number;
    }>();

    for (const msg of messages || []) {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

      if (!convMap.has(partnerId)) {
        convMap.set(partnerId, {
          partner_id: partnerId,
          last_message: msg.content,
          last_message_at: msg.created_at,
          unread_count: 0,
        });
      }

      // Count unread from this partner
      if (msg.receiver_id === userId && !msg.is_read) {
        const conv = convMap.get(partnerId)!;
        conv.unread_count += 1;
      }
    }

    const conversations = Array.from(convMap.values())
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

    const paginated = conversations.slice(offset, offset + limit);

    // Fetch partner profiles
    const partnerIds = paginated.map((c) => c.partner_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', partnerIds.length > 0 ? partnerIds : ['00000000-0000-0000-0000-000000000000']);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const result = paginated.map((c) => ({
      ...c,
      partner: profileMap.get(c.partner_id) || null,
    }));

    return {
      conversations: result,
      pagination: paginationResult({ page, limit }, conversations.length),
    };
  }

  async getConversation(userId: string, partnerId: string, query: Record<string, string>) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`,
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new AppError('Failed to fetch messages: ' + error.message, 500);
    }

    // Mark incoming unread messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', partnerId)
      .eq('receiver_id', userId)
      .eq('is_read', false);

    // Get partner profile
    const { data: partner } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', partnerId)
      .single();

    return {
      messages: (data || []).reverse(), // chronological order
      partner,
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    // Verify receiver exists
    const { data: receiver } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', receiverId)
      .eq('is_active', true)
      .single();

    if (!receiver) {
      throw new ValidationError('Recipient not found');
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to send message: ' + error.message, 500);
    }

    // Notify receiver
    const { data: sender } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', senderId)
      .single();

    const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'Someone';

    await this.createNotification(
      receiverId,
      'message',
      'New message',
      `${senderName} sent you a message`,
      '/messages',
    );

    return message;
  }

  async markMessageRead(messageId: string, userId: string) {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', userId);
  }

  // ─── Notifications ──────────────────────────────────────

  async getNotifications(userId: string, query: Record<string, string>) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (query.is_read === 'true') {
      qb = qb.eq('is_read', true);
    } else if (query.is_read === 'false') {
      qb = qb.eq('is_read', false);
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch notifications: ' + error.message, 500);
    }

    return {
      notifications: data || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new AppError('Failed to fetch unread count', 500);
    }

    return { count: count || 0 };
  }

  async markNotificationRead(notificationId: string, userId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
  }

  async markAllRead(userId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  // ─── Announcements ──────────────────────────────────────

  async listAnnouncements(query: Record<string, string>) {
    const { page, limit } = parsePagination(query);
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('announcements')
      .select(`
        *,
        author:profiles!announcements_created_by_fkey(id, first_name, last_name, avatar_url),
        course:courses(id, title, slug)
      `, { count: 'exact' });

    if (query.course_id) {
      qb = qb.eq('course_id', query.course_id);
    }

    qb = qb.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await qb;

    if (error) {
      throw new AppError('Failed to fetch announcements: ' + error.message, 500);
    }

    return {
      announcements: data || [],
      pagination: paginationResult({ page, limit }, count || 0),
    };
  }

  async createAnnouncement(input: CreateAnnouncementInput, userId: string) {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert({
        course_id: input.course_id || null,
        title: input.title,
        content: input.content,
        created_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new AppError('Failed to create announcement: ' + error.message, 500);
    }

    // Bulk notify enrolled users
    await this.bulkNotifyAnnouncement(announcement.id, input.title, input.course_id || null, userId);

    return announcement;
  }

  async deleteAnnouncement(announcementId: string, userId: string, userRole: string) {
    const { data: ann } = await supabase
      .from('announcements')
      .select('id, created_by')
      .eq('id', announcementId)
      .single();

    if (!ann) {
      throw new NotFoundError('Announcement');
    }

    if (ann.created_by !== userId && !['admin', 'super_admin'].includes(userRole)) {
      throw new ForbiddenError('Not authorized');
    }

    await supabase.from('announcements').delete().eq('id', announcementId);
  }

  // ─── Internal helpers ───────────────────────────────────

  async createNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    referenceUrl?: string,
  ) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      reference_url: referenceUrl || null,
    });
  }

  private async bulkNotifyAnnouncement(
    announcementId: string,
    title: string,
    courseId: string | null,
    creatorId: string,
  ) {
    let userIds: string[] = [];

    if (courseId) {
      // Notify enrolled users
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('course_id', courseId)
        .neq('status', 'dropped');

      userIds = (enrollments || [])
        .map((e) => e.user_id)
        .filter((id) => id !== creatorId);
    } else {
      // System-wide: notify all active users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)
        .neq('id', creatorId)
        .limit(1000);

      userIds = (profiles || []).map((p) => p.id);
    }

    if (userIds.length === 0) return;

    // Batch insert notifications (max 500 at a time)
    const notifications = userIds.map((uid) => ({
      user_id: uid,
      type: 'announcement',
      title: 'New Announcement',
      body: title,
      reference_url: courseId ? `/learner/courses` : '/',
    }));

    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      await supabase.from('notifications').insert(batch);
    }
  }
}

export const communicationService = new CommunicationService();
