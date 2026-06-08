import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useTabHeader } from '@/context/TabHeaderContext';
import { colors, spacing } from '@/constants/colors';
import { listScrollProps, TAB_BAR_HEIGHT } from '@/constants/layout';
import * as api from '@/lib/api';
import { getImageUrl } from '@/lib/media';
import type { ExplorePost } from '@/lib/api';

const COLS = 3;
const GAP = 2;
const TILE = (Dimensions.get('window').width - GAP * (COLS - 1)) / COLS;

export default function ExploreScreen() {
  const router = useRouter();
  const { exploreSearchOpen } = useTabHeader();
  const [posts, setPosts] = useState<ExplorePost[]>([]);
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
    return posts.filter((p) => {
      const caption = (p.caption ?? '').toLowerCase();
      const username = (p.username ?? '').toLowerCase();
      return caption.includes(q) || username.includes(q);
    });
  }, [posts, query]);

  const handlePress = (item: ExplorePost) => {
    if (item.source === 'user') {
      router.push(`/post/${item.id}`);
    }
  };

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
        keyExtractor={(item) => `${item.source ?? 'fake'}-${item.id}`}
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
          <Pressable
            style={styles.tile}
            onPress={() => handlePress(item)}
            disabled={item.source !== 'user'}
          >
            {item.image_url ? (
              <Image
                source={{ uri: getImageUrl(item.image_url) }}
                style={styles.tileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.tilePlaceholder} />
            )}
            {item.source === 'user' && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>★</Text>
              </View>
            )}
          </Pressable>
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
  featuredBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(55,138,221,0.92)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.xl },
});
