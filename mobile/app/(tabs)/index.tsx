import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostCard } from '@/components/PostCard';
import { StoryRing } from '@/components/StoryRing';
import { VibeLogo } from '@/components/VibeLogo';
import { useUser } from '@/context/UserContext';
import { useFeed } from '@/hooks/useFeed';
import { useNotifications } from '@/hooks/useNotifications';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';
import type { FakeUser } from '@/lib/types';

const ICON_WHITE = '#ffffff';
const HEART_ACTIVE = '#ff3040';

export default function FeedScreen() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { posts, loading, setLoading, refreshing, load, refresh } = useFeed(user?.id);
  const { unreadCount, load: loadNotifications } = useNotifications(user?.id);
  const [stories, setStories] = useState<FakeUser[]>([]);
  const [createMenuVisible, setCreateMenuVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([load(), loadNotifications()]).finally(() => setLoading(false));
    }, [load, loadNotifications, setLoading])
  );

  useEffect(() => {
    api.getTier1Characters().then(setStories).catch(() => setStories([]));
  }, []);

  const openCreate = () => {
    setCreateMenuVisible(false);
    router.push('/(tabs)/create');
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <FeedHeaderBar
            onAddPress={() => setCreateMenuVisible(true)}
            onNotificationsPress={() => router.push('/(tabs)/notifications')}
            unreadCount={unreadCount}
          />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
        <CreateMenuModal
          visible={createMenuVisible}
          onClose={() => setCreateMenuVisible(false)}
          onPost={openCreate}
          onStory={openCreate}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <FeedHeaderBar
          onAddPress={() => setCreateMenuVisible(true)}
          onNotificationsPress={() => router.push('/(tabs)/notifications')}
          unreadCount={unreadCount}
        />
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refresh();
              loadNotifications();
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
              hasStory={false}
              onPress={() => setCreateMenuVisible(true)}
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

      <CreateMenuModal
        visible={createMenuVisible}
        onClose={() => setCreateMenuVisible(false)}
        onPost={openCreate}
        onStory={openCreate}
      />
    </View>
  );
}

function FeedHeaderBar({
  onAddPress,
  onNotificationsPress,
  unreadCount,
}: {
  onAddPress: () => void;
  onNotificationsPress: () => void;
  unreadCount: number;
}) {
  const hasUnread = unreadCount > 0;
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <View style={styles.headerBar}>
      <Pressable onPress={onAddPress} style={styles.headerBtn} hitSlop={8}>
        <Ionicons name="add-outline" size={28} color={ICON_WHITE} />
      </Pressable>

      <VibeLogo size="md" />

      <Pressable onPress={onNotificationsPress} style={styles.headerBtn} hitSlop={8}>
        <View style={styles.heartWrap}>
          <Ionicons
            name={hasUnread ? 'heart' : 'heart-outline'}
            size={26}
            color={hasUnread ? HEART_ACTIVE : ICON_WHITE}
          />
          {hasUnread && (
            <View style={styles.heartBadge}>
              <Text style={styles.heartBadgeText}>{badgeLabel}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function CreateMenuModal({
  visible,
  onClose,
  onPost,
  onStory,
}: {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
  onStory: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <Pressable style={styles.modalOption} onPress={onPost}>
            <Ionicons name="images-outline" size={22} color={colors.text} />
            <Text style={styles.modalOptionText}>Gönderi Paylaş</Text>
          </Pressable>
          <View style={styles.modalDivider} />
          <Pressable style={styles.modalOption} onPress={onStory}>
            <Ionicons name="add-circle-outline" size={22} color={colors.text} />
            <Text style={styles.modalOptionText}>Hikaye Ekle</Text>
          </Pressable>
          <Pressable style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>İptal</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: 2 },
  heartWrap: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBadge: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: HEART_ACTIVE,
    borderWidth: 1.5,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  heartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: spacing.xl },
  stories: { marginBottom: spacing.sm },
  storiesContent: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.md },
  emptyImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    resizeMode: 'contain',
    marginBottom: spacing.md,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  modalOptionText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  modalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  modalCancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});
