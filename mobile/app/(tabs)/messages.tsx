import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DMItem } from '@/components/DMItem';
import { useTabHeader } from '@/context/TabHeaderContext';
import { useUser } from '@/context/UserContext';
import { useMessages } from '@/hooks/useMessages';
import { colors, spacing } from '@/constants/colors';
import { listScrollProps, TAB_BAR_HEIGHT } from '@/constants/layout';

export default function MessagesScreen() {
  const { user } = useUser();
  const router = useRouter();
  const { setDmUnreadCount } = useTabHeader();
  const { conversations, unreadTotal, loading, setLoading, load } = useMessages(user?.id);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load()
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, [load, setLoading])
  );

  useEffect(() => {
    setDmUnreadCount(unreadTotal);
  }, [unreadTotal, setDmUnreadCount]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      void load();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id, load]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: TAB_BAR_HEIGHT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyImage: { width: 200, height: 200, resizeMode: 'contain' },
  emptyText: { color: colors.textMuted, marginTop: spacing.md },
});
