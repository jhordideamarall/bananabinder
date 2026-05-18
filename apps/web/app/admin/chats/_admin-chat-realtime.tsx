'use client';

import { useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminChatRealtimeProps {
  activeConversationId?: string | null;
}

export function AdminChatRealtime({ activeConversationId }: AdminChatRealtimeProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => {
        startTransition(() => router.refresh());
      }, 120);
    };

    const channel = supabase
      .channel(`admin-store-chat:${activeConversationId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, refresh)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_conversations' },
        refresh,
      )
      .subscribe();

    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [activeConversationId, router]);

  return null;
}
