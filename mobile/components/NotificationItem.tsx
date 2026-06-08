import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { enrichFollowNotification } from '@/lib/notifications';
import { timeAgo } from '@/lib/timeAgo';
import type { Notification } from '@/lib/types';

const TYPE_CONFIG: Record<string, { emoji: string; bg?: string }> = {
  like: { emoji: '❤️' },
  comment: { emoji: '💬' },
  follow: { emoji: '👤' },
  dm: { emoji: '✉️' },
  viral: { emoji: '🔥', bg: 'rgba(255,109,0,0.15)' },
  milestone: { emoji: '👑', bg: 'rgba(29,158,117,0.15)' },
  sponsor_offer: { emoji: '💰', bg: 'rgba(55,138,221,0.15)' },
  story_reaction: { emoji: '❤️', bg: 'rgba(255,48,64,0.12)' },
};

function getNotificationEmoji(item: Notification): string {
  if (item.type === 'story_reaction') {
    const match = item.content.match(/hikayene (\S+) tepkisi/);
    return match?.[1] ?? '❤️';
  }
  return TYPE_CONFIG[item.type]?.emoji ?? '📌';
}

interface Props {
  item: Notification;
  onPress: () => void;
}

export function NotificationItem({ item, onPress }: Props) {
  const config = TYPE_CONFIG[item.type] ?? { emoji: '📌' };
  const emoji = getNotificationEmoji(item);
  const isStoryReaction = item.type === 'story_reaction';
  const displayContent =
    item.type === 'follow' ? enrichFollowNotification(item.content) : item.content;

  return (
    <Pressable
      style={[
        styles.item,
        !item.is_read && styles.unread,
        config.bg ? { backgroundColor: config.bg } : null,
        isStoryReaction && styles.storyReactionItem,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.emoji, isStoryReaction && styles.storyReactionEmoji]}>{emoji}</Text>
      <View style={styles.content}>
        <Text style={[styles.text, isStoryReaction && styles.storyReactionText]}>
          {displayContent}
        </Text>
        <Text style={styles.time}>
          {timeAgo(item.created_at)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: colors.surface,
    gap: 12,
    alignItems: 'center',
  },
  unread: { backgroundColor: 'rgba(55,138,221,0.08)' },
  storyReactionItem: { backgroundColor: 'rgba(255,48,64,0.12)' },
  emoji: { fontSize: 22 },
  storyReactionEmoji: { fontSize: 24 },
  content: { flex: 1 },
  text: { color: colors.text, fontSize: 14 },
  storyReactionText: { color: colors.like, fontWeight: '600' },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
