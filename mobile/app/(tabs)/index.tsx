import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PostCard } from '@/components/PostCard';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import type { Post } from '@/lib/types';

export default function FeedScreen() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getFeed(user.id);
      setPosts(data);
    } catch {
      setPosts([]);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFeed().finally(() => setLoading(false));
    }, [loadFeed])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        user ? (
          <View style={styles.header}>
            <Text style={styles.greeting}>Merhaba, {user.display_name} 👋</Text>
            <Text style={styles.followers}>
              {user.follower_count.toLocaleString('tr-TR')} takipçi
            </Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyTitle}>Henüz gönderi yok</Text>
          <Text style={styles.emptyText}>İlk fotoğrafını paylaş ve beğenileri izle!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.md,
  },
  greeting: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  followers: {
    color: colors.accent,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
