import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import type { FakeUser } from '@/lib/types';

export default function CharactersScreen() {
  const { user } = useUser();
  const router = useRouter();
  const [characters, setCharacters] = useState<FakeUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTier1Characters()
      .then(setCharacters)
      .catch(() => setCharacters([]))
      .finally(() => setLoading(false));
  }, []);

  const startChat = async (fakeUserId: string) => {
    if (!user) return;
    const conv = await api.startConversation(user.id, fakeUserId);
    router.replace(`/chat/${conv.id}`);
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
      data={characters}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => startChat(item.id)}>
          <Avatar uri={item.avatar_url} name={item.display_name} size={56} />
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.display_name}</Text>
              {item.is_verified && <Text>✓</Text>}
            </View>
            <Text style={styles.username}>@{item.username}</Text>
            {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}
            {item.personality_type && (
              <Text style={styles.personality}>{item.personality_type}</Text>
            )}
          </View>
          <Text style={styles.dmBtn}>DM</Text>
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  username: {
    color: colors.textMuted,
    fontSize: 13,
  },
  bio: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  personality: {
    color: colors.accent,
    fontSize: 11,
    marginTop: 4,
  },
  dmBtn: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});
