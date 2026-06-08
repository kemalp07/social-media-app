import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import type { Notification } from '@/lib/types';

const TYPE_CONFIG: Record<string, { emoji: string; bg?: string }> = {
  like: { emoji: '❤️' },
  comment: { emoji: '💬' },
  follow: { emoji: '👤' },
  dm: { emoji: '✉️' },
  viral: { emoji: '🔥', bg: 'rgba(255,109,0,0.15)' },
  milestone: { emoji: '👑', bg: 'rgba(29,158,117,0.15)' },
  sponsor_offer: { emoji: '💰', bg: 'rgba(55,138,221,0.15)' },
};

interface Props {
  item: Notification;
  onPress: () => void;
}

export function NotificationItem({ item, onPress }: Props) {
  const config = TYPE_CONFIG[item.type] ?? { emoji: '📌' };

  return (
    <Pressable
      style={[
        styles.item,
        !item.is_read && styles.unread,
        config.bg ? { backgroundColor: config.bg } : null,
      ]}
      onPress={onPress}
    >
      <Text style={styles.emoji}>{config.emoji}</Text>
      <View style={styles.content}>
        <Text style={styles.text}>{item.content}</Text>
        <Text style={styles.time}>
          {new Date(item.created_at).toLocaleString('tr-TR')}
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
  emoji: { fontSize: 22 },
  content: { flex: 1 },
  text: { color: colors.text, fontSize: 14 },
  time: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
