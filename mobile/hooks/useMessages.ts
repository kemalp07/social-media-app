import { useCallback, useState } from 'react';
import * as api from '@/lib/api';
import type { Conversation } from '@/lib/types';

export function useMessages(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const data = await api.getConversations(userId);
    setConversations(data);
  }, [userId]);

  const unreadTotal = conversations.reduce(
    (sum, c) => sum + ((c as Conversation & { unread_count?: number }).unread_count ?? 0),
    0
  );

  return { conversations, unreadTotal, loading, setLoading, load };
}
