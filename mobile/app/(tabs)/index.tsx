import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PostCard } from '@/components/PostCard';
import { StoryRing } from '@/components/StoryRing';
import { useUser } from '@/context/UserContext';
import { useFeed } from '@/hooks/useFeed';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';
import type { FakeUser } from '@/lib/types';

export default function FeedScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { posts, loading, setLoading, refreshing, load, refresh } = useFeed(user?.id);
  const [stories, setStories] = useState<FakeUser[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load, setLoading])
  );

  useEffect(() => {
    api.getTier1Characters().then(setStories).catch(() => setStories([]));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
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
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      ListHeaderComponent={
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
            <StoryRing
              name={user?.display_name ?? 'Sen'}
              avatarUrl={user?.avatar_url}
              isOwn
              onPress={() => router.push('/(tabs)/create')}
            />
            {stories.slice(0, 12).map((s) => (
              <StoryRing
                key={s.id}
                name={s.display_name}
                avatarUrl={s.avatar_url}
                onPress={() => router.push('/characters')}
              />
            ))}
          </ScrollView>
          {user && (
            <Text style={styles.followers}>
              {user.follower_count.toLocaleString('tr-TR')} takipçi
            </Text>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📸</Text>
          <Text style={styles.emptyTitle}>Henüz gönderi yok</Text>
          <Text style={styles.emptyText}>İlk fotoğrafını paylaş!</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  stories: { marginBottom: spacing.md, paddingVertical: spacing.sm },
  followers: { color: colors.secondary, fontSize: 14, marginBottom: spacing.md, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm },
});
