import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { StatBox } from '@/components/StatBox';
import { useUser } from '@/context/UserContext';
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

export default function ProfileScreen() {
  const { user, logout } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const openSettings = () => {
    Alert.alert('Ayarlar', undefined, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Profil</Text>
        <Pressable onPress={openSettings} style={styles.settingsBtn} hitSlop={8}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        {...listScrollProps}
        ListHeaderComponent={
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Avatar uri={user.avatar_url} name={user.display_name} size={90} />
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </Pressable>
              <Text style={styles.name}>{user.display_name}</Text>
              <Text style={styles.username}>@{user.username}</Text>
              <Text style={styles.level}>{getLevel(user.follower_count)}</Text>
              {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
            </View>

            <View style={styles.stats}>
              <StatBox label="Gönderi" value={user.post_count} />
              <StatBox
                label="Takipçi"
                value={user.follower_count.toLocaleString('tr-TR')}
                highlight
              />
              <StatBox
                label="Beğeni"
                value={user.total_likes_received.toLocaleString('tr-TR')}
              />
            </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  settingsBtn: { padding: spacing.xs },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: TAB_BAR_HEIGHT },
  profileSection: { paddingTop: spacing.md },
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  avatarWrap: { position: 'relative' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarEditBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  name: { color: colors.text, fontSize: 22, fontWeight: '700', marginTop: spacing.md },
  username: { color: colors.textMuted, fontSize: 14 },
  level: { color: colors.secondary, fontWeight: '700', marginTop: spacing.sm },
  bio: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
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
