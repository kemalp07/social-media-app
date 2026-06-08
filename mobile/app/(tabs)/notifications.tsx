import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import type { Notification } from '@/lib/types';

const TYPE_EMOJI: Record<string, string> = {
  like: '❤️',
  comment: '💬',
  dm: '✉️',
  follow: '👤',
  milestone: '🏆',
  viral: '🔥',
  sponsor_offer: '💰',
  media: '📰',
};

export default function NotificationsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      api
        .getNotifications(user.id)
        .then(setNotifications)
        .catch(() => setNotifications([]))
        .finally(() => {
          setLoading(false);
          api.markNotificationsRead(user.id).catch(() => {});
        });
    }, [user])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyText}>Henüz bildirim yok</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.item, !item.is_read && styles.unread]}
          onPress={() => item.post_id && router.push(`/post/${item.post_id}`)}
        >
          <Text style={styles.emoji}>{TYPE_EMOJI[item.type] ?? '📌'}</Text>
          <View style={styles.itemContent}>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleString('tr-TR')}
            </Text>
          </View>
        </Pressable>
      )}
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
  },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    alignItems: 'center',
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  emoji: {
    fontSize: 24,
  },
  itemContent: {
    flex: 1,
  },
  content: {
    color: colors.text,
    fontSize: 14,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
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
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
});
