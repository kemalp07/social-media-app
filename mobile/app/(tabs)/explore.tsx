import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, spacing } from '@/constants/colors';
import { listScrollProps, TAB_BAR_HEIGHT } from '@/constants/layout';
import { API_URL } from '@/lib/config';
import * as api from '@/lib/api';

type ExploreItem = { id: string; image_url: string; caption?: string };

const COLS = 3;
const GAP = 2;
const TILE = (Dimensions.get('window').width - GAP * (COLS - 1)) / COLS;

function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<ExploreItem[]>([]);

  useEffect(() => {
    api.getExplorePosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        {...listScrollProps}
        ListEmptyComponent={
          <Text style={styles.empty}>Keşfet içeriği yükleniyor...</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.tile}
            onPress={() => router.push('/characters')}
          >
            {item.image_url ? (
              <Image
                source={{ uri: resolveImageUrl(item.image_url) }}
                style={styles.tileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.tilePlaceholder} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  list: { flex: 1 },
  grid: { paddingTop: GAP, paddingBottom: TAB_BAR_HEIGHT },
  row: { gap: GAP, marginBottom: GAP },
  tile: {
    width: TILE,
    height: TILE,
    backgroundColor: colors.surface,
  },
  tileImage: { width: '100%', height: '100%' },
  tilePlaceholder: { flex: 1, backgroundColor: colors.surface },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
});
