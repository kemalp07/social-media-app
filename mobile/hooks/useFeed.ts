import { useCallback, useState } from 'react';
import * as api from '@/lib/api';
import type { Post } from '@/lib/types';

export function useFeed(userId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getFeed(userId);
      setPosts(data);
    } catch {
      setPosts([]);
    }
  }, [userId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      // load handles errors internally
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return { posts, loading, setLoading, refreshing, load, refresh };
}
