'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE';

interface UseRealtimeTableOptions<T extends Record<string, unknown>> {
  table: string;
  event?: EventType | '*';
  filter?: string; // e.g. "user_id=eq.abc123"
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: T) => void;
  enabled?: boolean;
}

/**
 * Generic hook that subscribes to Supabase Realtime Postgres Changes
 * for a specific table. Uses anon key (RLS enforced).
 */
export function useRealtimeTable<T extends Record<string, unknown>>({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true,
}: UseRealtimeTableOptions<T>) {
  // Stable refs so we don't re-subscribe on every callback change
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete });
  callbacksRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    if (!enabled) return;

    const channelName = `rt-${table}-${filter || 'all'}-${Date.now()}`;

    const channel = supabase.channel(channelName);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pgChangesOptions: any = {
      event,
      schema: 'public',
      table,
      ...(filter ? { filter } : {}),
    };

    channel
      .on(
        'postgres_changes',
        pgChangesOptions,
        (payload: RealtimePostgresChangesPayload<T>) => {
          const record = (payload.new || payload.old) as T;
          switch (payload.eventType) {
            case 'INSERT':
              callbacksRef.current.onInsert?.(record);
              break;
            case 'UPDATE':
              callbacksRef.current.onUpdate?.(record);
              break;
            case 'DELETE':
              callbacksRef.current.onDelete?.(record as T);
              break;
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, enabled]);
}
