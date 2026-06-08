import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, spacing } from '@/constants/colors';
import * as api from '@/lib/api';
import type { FakeUser } from '@/lib/types';

export default function SearchScreen() {
  const [characters, setCharacters] = useState<FakeUser[]>([]);

  useEffect(() => {
    api.getTier1Characters().then(setCharacters).catch(() => setCharacters([]));
  }, []);

  return (
    <FlatList
      data={characters}
      keyExtractor={(item) => item.id}
      style={styles.screen}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.header}>Ara — Tier 1 Karakterler</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Avatar uri={item.avatar_url} name={item.display_name} size={48} />
          <View style={styles.info}>
            <Text style={styles.name}>{item.display_name}</Text>
            <Text style={styles.username}>@{item.username}</Text>
            {item.bio ? <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text> : null}
          </View>
          <Text style={styles.followers}>{item.follower_count?.toLocaleString('tr-TR') ?? 0}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
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
