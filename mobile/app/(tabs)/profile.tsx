import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { SettingsModal } from '@/components/SettingsModal';
import { useUser } from '@/context/UserContext';
import { useTabHeader } from '@/context/TabHeaderContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';
import { listScrollProps, TAB_BAR_HEIGHT } from '@/constants/layout';
import type { Post } from '@/lib/types';

function getLevel(count: number): string {
  if (count >= 1_000_000) return 'Mega Star 👑';
  if (count >= 100_000) return 'Influencer 🔥';
  if (count >= 10_000) return 'Yükselen Yıldız ⭐';
  if (count >= 1_000) return 'Micro Influencer 🌟';
  return 'Yeni Başlayan';
}

function ProfileStat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useUser();
  const router = useRouter();
  const { settingsVisible, closeSettings } = useTabHeader();
  const [posts, setPosts] = useState<Post[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setAvatarUri(user.avatar_url);
      api.getUserPosts(user.id).then(setPosts).catch(() => setPosts([]));
    }
  }, [user]);

  if (!user) return null;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/onboarding');
  };

  return (
    <View style={styles.screen}>
      <SettingsModal
        visible={settingsVisible}
        onClose={closeSettings}
        onEditProfile={pickAvatar}
        onLogout={() => void handleLogout()}
      />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        {...listScrollProps}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <View style={styles.topRow}>
              <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Avatar uri={user.avatar_url} name={user.display_name} size={86} />
                )}
              </Pressable>

              <View style={styles.statsRow}>
                <ProfileStat value={user.post_count} label="gönderi" />
                <ProfileStat
                  value={user.follower_count.toLocaleString('tr-TR')}
                  label="takipçi"
                />
                <ProfileStat
                  value={user.total_likes_received.toLocaleString('tr-TR')}
                  label="beğeni"
                />
              </View>
            </View>

            <Text style={styles.name}>{user.display_name}</Text>
            <Text style={styles.username}>@{user.username}</Text>
            <Text style={styles.level}>{getLevel(user.follower_count)}</Text>
            {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

            <Pressable style={styles.editBtn} onPress={pickAvatar}>
              <Text style={styles.editBtnText}>Profili Düzenle</Text>
            </Pressable>

            <Text style={styles.gridTitle}>Gönderiler</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyGrid}>Henüz gönderi yok</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.gridItem} onPress={() => router.push(`/post/${item.id}`)}>
            {item.image_url?.trim() ? (
              <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            ) : (
              <View style={styles.gridPlaceholder}>
                <Ionicons name="image-outline" size={24} color={colors.textMuted} />
              </View>
            )}
            {item.is_viral && <Text style={styles.viralIcon}>🔥</Text>}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: TAB_BAR_HEIGHT },
  profileSection: { paddingTop: spacing.md, paddingBottom: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  avatarWrap: { flexShrink: 0 },
  avatarImage: { width: 86, height: 86, borderRadius: 43 },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 18, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  name: { color: colors.text, fontSize: 15, fontWeight: '700' },
  username: { color: colors.textMuted, fontSize: 14, marginTop: 2 },
  level: { color: colors.secondary, fontWeight: '600', fontSize: 13, marginTop: spacing.xs },
  bio: { color: colors.text, fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  editBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  editBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  gridTitle: { color: colors.text, fontWeight: '700', marginBottom: spacing.sm },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viralIcon: { position: 'absolute', top: 6, right: 6, fontSize: 14 },
  emptyGrid: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
});
