import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/constants/colors';
import type { Conversation } from '@/lib/types';

interface Props {
  item: Conversation;
  onPress: () => void;
}

export function DMItem({ item, onPress }: Props) {
  const unread = (item as Conversation & { unread_count?: number }).unread_count ?? 0;
  const isSponsor = item.last_message?.toLowerCase().includes('sponsor') ||
    item.last_message?.toLowerCase().includes('işbirliği');

  return (
    <Pressable style={styles.item} onPress={onPress}>
      <Avatar uri={item.fake_avatar_url} name={item.fake_username} size={52} />
      <View style={styles.content}>
        <Text style={styles.name}>{item.fake_username}</Text>
        <Text
          style={[styles.preview, isSponsor && styles.sponsor]}
          numberOfLines={1}
        >
          {item.last_message ?? '...'}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.time}>
          {new Date(item.last_message_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
        </Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  content: { flex: 1 },
  name: { color: colors.text, fontWeight: '700', fontSize: 15 },
  preview: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  sponsor: { color: colors.sponsor },
  right: { alignItems: 'flex-end', gap: 6 },
  time: { color: colors.textMuted, fontSize: 11 },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
