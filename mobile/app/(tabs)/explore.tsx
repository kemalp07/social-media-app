import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, spacing } from '@/constants/colors';
import * as api from '@/lib/api';
import type { FakeUser } from '@/lib/types';

export default function ExploreScreen() {
  const router = useRouter();
  const [characters, setCharacters] = useState<FakeUser[]>([]);

  useEffect(() => {
    api.getTier1Characters().then(setCharacters).catch(() => setCharacters([]));
  }, []);

  return (
    <FlatList
      data={characters}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <Text style={styles.header}>Keşfet — Tier 1 Karakterler</Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push('/characters')}
        >
          <Avatar uri={item.avatar_url} name={item.display_name} size={48} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.display_name} {item.is_verified ? '✓' : ''}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          </View>
          <Text style={styles.followers}>
            {(item.follower_count ?? 0).toLocaleString('tr-TR')}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  header: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '700' },
  username: { color: colors.textMuted, fontSize: 13 },
  bio: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  followers: { color: colors.primary, fontWeight: '700', fontSize: 13 },
});
