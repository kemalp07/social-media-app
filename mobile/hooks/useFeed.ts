import { useCallback, useState } from 'react';
import * as api from '@/lib/api';
import type { Post } from '@/lib/types';

export function useFeed(userId: string | undefined) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const data = await api.getFeed(userId);
    setPosts(data);
  }, [userId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return { posts, loading, setLoading, refreshing, load, refresh };
}
