import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PostCard } from '@/components/PostCard';
import { StoryRing } from '@/components/StoryRing';
import { useTabHeader } from '@/context/TabHeaderContext';
import { useUser } from '@/context/UserContext';
import { useFeed } from '@/hooks/useFeed';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';
import { listScrollProps, TAB_BAR_HEIGHT } from '@/constants/layout';
import type { FakeUser } from '@/lib/types';

export default function FeedScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { setUnreadCount, registerActions } = useTabHeader();
  const { posts, loading, setLoading, refreshing, load, refresh } = useFeed(user?.id);
  const [stories, setStories] = useState<FakeUser[]>([]);
  const listRef = useRef<FlatList>(null);

  const hasOwnStory = (user?.post_count ?? 0) > 0;

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const loadUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    try {
      const count = await api.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [user?.id, setUnreadCount]);

  useEffect(() => {
    registerActions({ scrollToTop });
  }, [registerActions, scrollToTop]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([load(), loadUnreadCount()])
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, [load, loadUnreadCount, setLoading])
  );

  useEffect(() => {
    if (!user?.id) return;
    void loadUnreadCount();
    const interval = setInterval(() => {
      void loadUnreadCount();
    }, 3000);
    return () => clearInterval(interval);
  }, [user?.id, loadUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user?.id, user?.post_count, load, setLoading]);

  useEffect(() => {
    if (!user?.id) {
      setStories([]);
      return;
    }
    api.getFollowing(user.id).then(setStories).catch(() => setStories([]));
  }, [user?.id]);

  const openOwnStory = () => {
    if (hasOwnStory) {
      router.push('/story/me');
      return;
    }
    router.push('/(tabs)/create');
  };

  const openCharacterStory = (character: FakeUser) => {
    router.push(`/story/${character.id}`);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        initialNumToRender={5}
        {...listScrollProps}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refresh();
              loadUnreadCount();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.stories}
            contentContainerStyle={styles.storiesContent}
          >
            <StoryRing
              name={user?.display_name ?? 'Sen'}
              avatarUrl={user?.avatar_url}
              isOwn
              hasStory={hasOwnStory}
              onPress={openOwnStory}
            />
            {stories.slice(0, 12).map((s) => (
              <StoryRing
                key={s.id}
                name={s.display_name}
                avatarUrl={s.avatar_url}
                onPress={() => openCharacterStory(s)}
              />
            ))}
          </ScrollView>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Image
              source={require('../../assets/empty_states/empty_feed.png')}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>Henüz gönderi yok</Text>
            <Text style={styles.emptyText}>İlk fotoğrafını paylaş!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: TAB_BAR_HEIGHT },
  stories: { marginBottom: spacing.sm },
  storiesContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.md },
  emptyImage: {
    width: 80,
    height: 80,
    opacity: 0.6,
    borderRadius: 12,
    resizeMode: 'contain',
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm },
});
