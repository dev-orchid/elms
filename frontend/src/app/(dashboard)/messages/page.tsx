'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useRealtimeTable } from '@/hooks/use-realtime';
import api from '@/lib/api';

interface Conversation {
  partner_id: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  partner: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Realtime: new messages → refresh conversation
  useRealtimeTable<{ id: string; receiver_id: string; sender_id: string }>({
    table: 'messages',
    event: 'INSERT',
    filter: user ? `receiver_id=eq.${user.id}` : undefined,
    enabled: !!user,
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', selectedUserId] });
      }
    },
  });

  // Conversations list
  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await api.get('/messages', { params: { limit: '50' } });
      return res.data as { conversations: Conversation[] };
    },
  });

  // Selected conversation messages
  const { data: messagesData } = useQuery({
    queryKey: ['conversation', selectedUserId],
    queryFn: async () => {
      const res = await api.get(`/messages/${selectedUserId}`, { params: { limit: '100' } });
      return res.data as { messages: Message[]; partner: { id: string; first_name: string; last_name: string; avatar_url: string | null } | null };
    },
    enabled: !!selectedUserId,
  });

  const sendMutation = useMutation({
    mutationFn: (data: { receiver_id: string; content: string }) =>
      api.post('/messages', data),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const conversations = convsData?.conversations || [];
  const messages = messagesData?.messages || [];
  const partner = messagesData?.partner;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;
    sendMutation.mutate({ receiver_id: selectedUserId, content: newMessage.trim() });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Conversations list */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col shrink-0 ${selectedUserId ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-lg font-semibold text-slate-800">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center px-4">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partner_id}
                onClick={() => setSelectedUserId(conv.partner_id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${
                  selectedUserId === conv.partner_id ? 'bg-teal-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-medium shrink-0">
                    {conv.partner?.first_name?.[0]}{conv.partner?.last_name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {conv.partner?.first_name} {conv.partner?.last_name}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">{timeAgo(conv.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                      {conv.unread_count > 0 && (
                        <span className="h-5 w-5 bg-teal-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col ${!selectedUserId ? 'hidden md:flex' : ''}`}>
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <button
                onClick={() => setSelectedUserId(null)}
                className="md:hidden p-1 text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">
                {partner?.first_name?.[0]}{partner?.last_name?.[0]}
              </div>
              <p className="text-sm font-medium text-slate-800">
                {partner?.first_name} {partner?.last_name}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id !== selectedUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                      isMine
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-teal-200' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose */}
            <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t border-slate-200">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="p-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
