import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DMItem } from '@/components/DMItem';
import { useUser } from '@/context/UserContext';
import { useMessages } from '@/hooks/useMessages';
import { colors, spacing } from '@/constants/colors';

export default function MessagesScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { conversations, loading, setLoading, load } = useMessages(user?.id);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load, setLoading])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.newBtn} onPress={() => router.push('/characters')}>
        <Text style={styles.newBtnText}>+ Yeni mesaj</Text>
      </Pressable>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
          </View>
        }
        renderItem={({ item }) => (
          <DMItem item={item} onPress={() => router.push(`/chat/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  newBtn: {
    margin: spacing.md, backgroundColor: colors.surfaceLight, borderRadius: 10,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  newBtnText: { color: colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: spacing.md },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
});
