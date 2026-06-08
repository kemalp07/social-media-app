import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DMItem } from '@/components/DMItem';
import { useUser } from '@/context/UserContext';
import { useMessages } from '@/hooks/useMessages';
import { colors, spacing } from '@/constants/colors';
import { listScrollProps, TAB_BAR_HEIGHT } from '@/constants/layout';

export default function MessagesScreen() {
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversations, loading, setLoading, load } = useMessages(user?.id);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load, setLoading])
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Mesajlar</Text>
        <Pressable style={styles.newBtn} onPress={() => router.push('/characters')}>
          <Text style={styles.newBtnText}>+ Yeni mesaj</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          {...listScrollProps}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Image
                source={require('../../assets/empty_states/empty_dm.png')}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyText}>Henüz mesaj yok</Text>
            </View>
          }
          renderItem={({ item }) => (
            <DMItem item={item} onPress={() => router.push(`/chat/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  newBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  newBtnText: { color: colors.primary, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: TAB_BAR_HEIGHT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyImage: { width: 200, height: 200, resizeMode: 'contain' },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
});
