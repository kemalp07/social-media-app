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

import { Avatar } from '@/components/Avatar';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import type { Conversation } from '@/lib/types';

export default function MessagesScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      api
        .getConversations(user.id)
        .then(setConversations)
        .catch(() => setConversations([]))
        .finally(() => setLoading(false));
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
    <View style={styles.container}>
      <Pressable style={styles.newBtn} onPress={() => router.push('/characters')}>
        <Text style={styles.newBtnText}>+ Yeni mesaj (Tier 1 karakterler)</Text>
      </Pressable>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
            <Text style={styles.emptyHint}>Tier 1 karakterler sana yazabilir!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => router.push(`/chat/${item.id}`)}>
            <Avatar uri={item.fake_avatar_url} name={item.fake_username} size={48} />
            <View style={styles.itemContent}>
              <Text style={styles.name}>{item.fake_username}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_message ?? '...'}
              </Text>
            </View>
            <Text style={styles.time}>
              {new Date(item.last_message_at).toLocaleDateString('tr-TR')}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBtn: {
    margin: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  newBtnText: {
    color: colors.accent,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  preview: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.text,
    fontSize: 16,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
