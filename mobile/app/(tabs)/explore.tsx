import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTabHeader } from '@/context/TabHeaderContext';
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
  const { exploreSearchOpen } = useTabHeader();
  const [posts, setPosts] = useState<ExploreItem[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.getExplorePosts().then(setPosts).catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    if (!exploreSearchOpen) setQuery('');
  }, [exploreSearchOpen]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => (p.caption ?? '').toLowerCase().includes(q));
  }, [posts, query]);

  return (
    <View style={styles.screen}>
      {exploreSearchOpen && (
        <View style={styles.searchBar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Keşfet'te ara..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            autoFocus
          />
        </View>
      )}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        numColumns={COLS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        {...listScrollProps}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.trim() ? 'Sonuç bulunamadı' : 'Keşfet içeriği yükleniyor...'}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.tile}>
            {item.image_url ? (
              <Image
                source={{ uri: resolveImageUrl(item.image_url) }}
                style={styles.tileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.tilePlaceholder} />
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  searchBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
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
