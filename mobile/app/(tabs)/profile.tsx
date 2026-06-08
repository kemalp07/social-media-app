import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { StatBox } from '@/components/StatBox';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';
import type { Post } from '@/lib/types';

function getLevel(count: number): string {
  if (count >= 1_000_000) return 'Mega Star 👑';
  if (count >= 100_000) return 'Influencer 🔥';
  if (count >= 10_000) return 'Yükselen Yıldız ⭐';
  if (count >= 1_000) return 'Micro Influencer 🌟';
  return 'Yeni Başlayan';
}

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useUser();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (user) api.getFeed(user.id).then(setPosts).catch(() => setPosts([]));
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış', style: 'destructive', onPress: async () => { await logout(); router.replace('/onboarding'); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar uri={user.avatar_url} name={user.display_name} size={90} />
        <Text style={styles.name}>{user.display_name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.level}>{getLevel(user.follower_count)}</Text>
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        <StatBox label="Gönderi" value={user.post_count} />
        <StatBox label="Takipçi" value={user.follower_count.toLocaleString('tr-TR')} highlight />
        <StatBox label="Beğeni" value={user.total_likes_received.toLocaleString('tr-TR')} />
      </View>

      <Text style={styles.gridTitle}>Gönderiler</Text>
      <FlatList
        data={posts.filter((p) => (p as Post & { is_own?: boolean }).is_own !== false)}
        keyExtractor={(item) => item.id}
        numColumns={3}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable style={styles.gridItem} onPress={() => router.push(`/post/${item.id}`)}>
            <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            {item.is_viral && <Text style={styles.viralIcon}>🔥</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.emptyGrid}>Henüz gönderi yok</Text>}
      />

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: spacing.md },
  username: { color: colors.textMuted, fontSize: 14 },
  level: { color: colors.secondary, fontWeight: '700', marginTop: spacing.sm },
  bio: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  stats: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg,
  },
  gridTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.sm },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  viralIcon: { position: 'absolute', top: 6, right: 6, fontSize: 14 },
  emptyGrid: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  logoutBtn: { alignItems: 'center', padding: spacing.lg },
  logoutText: { color: colors.textMuted },
});
