import { useCallback, useState } from 'react';
import * as api from '@/lib/api';
import type { Notification } from '@/lib/types';

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [notifs, count] = await Promise.all([
        api.getNotifications(userId),
        api.getUnreadCount(userId),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  const markRead = useCallback(async () => {
    if (!userId) return;
    try {
      await api.markNotificationsRead(userId);
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, [userId]);

  return { notifications, unreadCount, loading, setLoading, load, markRead };
}
