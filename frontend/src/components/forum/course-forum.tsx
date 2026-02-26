'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  MessageSquare,
  Pin,
  Lock,
  ArrowLeft,
  Send,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useRealtimeTable } from '@/hooks/use-realtime';
import api from '@/lib/api';

interface Thread {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  author: { id: string; first_name: string; last_name: string; avatar_url?: string } | null;
  posts: Array<{ count: number }>;
}

interface Post {
  id: string;
  thread_id: string;
  parent_id: string | null;
  content: string;
  created_by: string;
  created_at: string;
  author: { id: string; first_name: string; last_name: string; avatar_url?: string } | null;
}

interface CourseForumProps {
  courseId: string;
}

export function CourseForum({ courseId }: CourseForumProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [hasNewReplies, setHasNewReplies] = useState(false);
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  // Realtime: forum_posts INSERT → show "New replies" indicator
  useRealtimeTable<{ id: string; created_by: string; thread_id: string }>({
    table: 'forum_posts',
    event: 'INSERT',
    onInsert: (post) => {
      // Don't show indicator for own posts
      if (post.created_by === user?.id) return;
      if (selectedThread && post.thread_id === selectedThread) {
        // If viewing the thread, just refresh
        queryClient.invalidateQueries({ queryKey: ['forum-thread', selectedThread] });
      } else {
        setHasNewReplies(true);
        queryClient.invalidateQueries({ queryKey: ['forum-threads', courseId] });
      }
    },
  });

  // Thread list
  const { data: threadsData, isLoading } = useQuery({
    queryKey: ['forum-threads', courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}/threads`, { params: { limit: '50' } });
      return res.data as { threads: Thread[] };
    },
  });

  // Selected thread with posts
  const { data: threadData } = useQuery({
    queryKey: ['forum-thread', selectedThread],
    queryFn: async () => {
      const res = await api.get(`/threads/${selectedThread}`);
      return res.data as { thread: Thread & { author: Post['author'] }; posts: Post[] };
    },
    enabled: !!selectedThread,
  });

  const createThreadMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      api.post(`/courses/${courseId}/threads`, data),
    onSuccess: () => {
      toast.success('Thread created');
      setShowNewThread(false);
      setNewTitle('');
      setNewContent('');
      queryClient.invalidateQueries({ queryKey: ['forum-threads', courseId] });
    },
    onError: () => toast.error('Failed to create thread'),
  });

  const createPostMutation = useMutation({
    mutationFn: (data: { content: string }) =>
      api.post(`/threads/${selectedThread}/posts`, data),
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['forum-thread', selectedThread] });
      queryClient.invalidateQueries({ queryKey: ['forum-threads', courseId] });
    },
    onError: () => toast.error('Failed to post reply'),
  });

  const moderateMutation = useMutation({
    mutationFn: (data: { threadId: string; is_pinned?: boolean; is_locked?: boolean }) =>
      api.patch(`/threads/${data.threadId}/moderate`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-threads', courseId] });
      queryClient.invalidateQueries({ queryKey: ['forum-thread', selectedThread] });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: (threadId: string) => api.delete(`/threads/${threadId}`),
    onSuccess: () => {
      toast.success('Thread deleted');
      setSelectedThread(null);
      queryClient.invalidateQueries({ queryKey: ['forum-threads', courseId] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.delete(`/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forum-thread', selectedThread] });
    },
  });

  const threads = threadsData?.threads || [];
  const posts = threadData?.posts || [];
  const currentThread = threadData?.thread;

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    createThreadMutation.mutate({ title: newTitle.trim(), content: newContent.trim() });
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    createPostMutation.mutate({ content: replyContent.trim() });
  };

  // ─── Thread detail view ─────────────────────────────────
  if (selectedThread && currentThread) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedThread(null)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to threads
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {currentThread.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500" />}
              {currentThread.is_locked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
              <h3 className="font-semibold text-slate-800">{currentThread.title}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              by {currentThread.author?.first_name} {currentThread.author?.last_name} · {timeAgo(currentThread.created_at)}
            </p>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => moderateMutation.mutate({ threadId: selectedThread, is_pinned: !currentThread.is_pinned })}
                className={`p-1.5 rounded text-xs ${currentThread.is_pinned ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-600'}`}
                title={currentThread.is_pinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => moderateMutation.mutate({ threadId: selectedThread, is_locked: !currentThread.is_locked })}
                className={`p-1.5 rounded text-xs ${currentThread.is_locked ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-600'}`}
                title={currentThread.is_locked ? 'Unlock' : 'Lock'}
              >
                <Lock className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => { if (confirm('Delete this thread?')) deleteThreadMutation.mutate(selectedThread); }}
                className="p-1.5 rounded text-slate-400 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-medium">
                    {post.author?.first_name?.[0]}{post.author?.last_name?.[0]}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {post.author?.first_name} {post.author?.last_name}
                  </span>
                  <span className="text-xs text-slate-400">{timeAgo(post.created_at)}</span>
                </div>
                {(post.created_by === user?.id || isInstructor) && (
                  <button
                    onClick={() => { if (confirm('Delete this post?')) deletePostMutation.mutate(post.id); }}
                    className="p-1 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {!currentThread.is_locked && (
          <form onSubmit={handleReply} className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!replyContent.trim() || createPostMutation.isPending}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        {currentThread.is_locked && (
          <p className="text-xs text-slate-400 flex items-center gap-1"><Lock className="h-3 w-3" /> This thread is locked.</p>
        )}
      </div>
    );
  }

  // ─── Thread list view ───────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Discussion Forum</h3>
        <button
          onClick={() => setShowNewThread(!showNewThread)}
          className="px-3 py-1.5 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
        >
          New Thread
        </button>
      </div>

      {/* New thread form */}
      {showNewThread && (
        <form onSubmit={handleCreateThread} className="bg-slate-50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Thread title..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
          />
          <textarea
            rows={3}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNewThread(false)} className="px-3 py-1.5 text-sm text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newTitle.trim() || !newContent.trim() || createThreadMutation.isPending}
              className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 rounded-lg"
            >
              {createThreadMutation.isPending ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      )}

      {/* New replies indicator */}
      {hasNewReplies && (
        <button
          onClick={() => {
            setHasNewReplies(false);
            queryClient.invalidateQueries({ queryKey: ['forum-threads', courseId] });
          }}
          className="w-full flex items-center justify-center gap-2 py-2 bg-teal-50 border border-teal-200 rounded-lg text-sm text-teal-700 font-medium hover:bg-teal-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New replies available — click to refresh
        </button>
      )}

      {/* Thread list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">No discussions yet. Start a new thread!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((thread) => {
            const postCount = thread.posts?.[0]?.count || 0;
            return (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread.id)}
                className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-teal-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-1">
                  {thread.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
                  {thread.is_locked && <Lock className="h-3 w-3 text-slate-400" />}
                  <h4 className="text-sm font-medium text-slate-800 line-clamp-1">{thread.title}</h4>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{thread.author?.first_name} {thread.author?.last_name}</span>
                  <span>{postCount} replies</span>
                  <span>{timeAgo(thread.updated_at)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
