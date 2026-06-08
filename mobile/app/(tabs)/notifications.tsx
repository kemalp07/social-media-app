import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, Text, View } from 'react-native';

import { NotificationItem } from '@/components/NotificationItem';
import { useUser } from '@/context/UserContext';
import { useNotifications } from '@/hooks/useNotifications';
import { colors, spacing } from '@/constants/colors';
import type { Notification } from '@/lib/types';

function groupNotifications(notifs: Notification[]) {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const thisWeek: Notification[] = [];
  const lastWeek: Notification[] = [];
  const older: Notification[] = [];

  for (const n of notifs) {
    const age = now - new Date(n.created_at).getTime();
    if (age < week) thisWeek.push(n);
    else if (age < week * 2) lastWeek.push(n);
    else older.push(n);
  }

  const sections = [];
  if (thisWeek.length) sections.push({ title: 'Bu hafta', data: thisWeek });
  if (lastWeek.length) sections.push({ title: 'Geçen hafta', data: lastWeek });
  if (older.length) sections.push({ title: 'Daha önce', data: older });
  return sections;
}

export default function NotificationsScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { notifications, loading, setLoading, load, markRead } = useNotifications(user?.id);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => {
        setLoading(false);
        markRead();
      });
    }, [load, markRead, setLoading])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const sections = groupNotifications(notifications);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>{section.title}</Text>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyText}>Henüz bildirim yok</Text>
        </View>
      }
      renderItem={({ item }) => (
        <NotificationItem
          item={item}
          onPress={() => {
            if (item.post_id) router.push(`/post/${item.post_id}`);
            else if (item.type === 'dm') router.push('/(tabs)/messages');
          }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md },
  sectionTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
});
