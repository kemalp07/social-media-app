import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { StatBox } from '@/components/StatBox';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/lib/theme';

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useUser();
  const router = useRouter();

  if (!user) return null;

  const isPremium = user.tier_level === 'premium';

  const handlePremium = async () => {
    Alert.alert(
      'Premium ₺49/ay',
      '• Sınırsız post\n• Sınırsız DM\n• 2x büyüme hızı\n• Özel Tier 1 karakterler\n• Haftada 1 viral boost',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yükselt (Demo)',
          onPress: async () => {
            await api.upgradePremium(user.id);
            await refreshUser();
            Alert.alert('Premium aktif! 👑');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Hesabından çıkmak istediğine emin misin?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar uri={user.avatar_url} name={user.display_name} size={80} />
        <Text style={styles.name}>{user.display_name}</Text>
        <Text style={styles.username}>@{user.username}</Text>
        {isPremium && <Text style={styles.premiumBadge}>👑 Premium</Text>}
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      </View>

      <View style={styles.stats}>
        <StatBox label="Gönderi" value={user.post_count} />
        <StatBox label="Takipçi" value={user.follower_count.toLocaleString('tr-TR')} highlight />
        <StatBox label="Beğeni" value={user.total_likes_received.toLocaleString('tr-TR')} />
      </View>

      <View style={styles.milestones}>
        <Text style={styles.sectionTitle}>Milestone Hedefleri</Text>
        {[
          { at: 100, label: 'İlk yüzün! 🎉' },
          { at: 1_000, label: 'Micro influencer' },
          { at: 10_000, label: 'Sponsorlar geliyor...' },
          { at: 100_000, label: 'Ünlüsün 👑' },
          { at: 1_000_000, label: 'Mega star! 🚀' },
        ].map((m) => (
          <View key={m.at} style={styles.milestoneRow}>
            <Text style={[styles.milestoneLabel, user.follower_count >= m.at && styles.done]}>
              {user.follower_count >= m.at ? '✅' : '⬜'} {m.at.toLocaleString('tr-TR')} — {m.label}
            </Text>
          </View>
        ))}
      </View>

      {!isPremium && (
        <Pressable style={styles.premiumBtn} onPress={handlePremium}>
          <Text style={styles.premiumBtnText}>Premium'a Geç — ₺49/ay</Text>
        </Pressable>
      )}

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  username: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  premiumBadge: {
    color: colors.premium,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  bio: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  milestones: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.md,
  },
  milestoneRow: {
    marginBottom: spacing.sm,
  },
  milestoneLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  done: {
    color: colors.success,
  },
  premiumBtn: {
    backgroundColor: colors.premium,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  premiumBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  logoutBtn: {
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
