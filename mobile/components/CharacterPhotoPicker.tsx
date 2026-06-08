import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/colors';
import {
  STOCK_PHOTO_CATEGORIES,
  STOCK_PHOTOS,
  type StockPhotoCategory,
} from '@/lib/stockPhotos';

const GRID_GAP = 2;
const NUM_COLUMNS = 3;

type Props = {
  onSelect: (uri: string) => void;
  onClose: () => void;
};

export function CharacterPhotoPicker({ onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<StockPhotoCategory>('selfie');

  const photos = STOCK_PHOTOS[category];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Fotoğraf seç</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {STOCK_PHOTO_CATEGORIES.map((item) => {
          const active = category === item.id;
          return (
            <Pressable
              key={item.id}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setCategory(item.id)}
            >
              <Text style={styles.categoryEmoji}>{item.emoji}</Text>
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={photos}
        key={`${category}-${NUM_COLUMNS}`}
        numColumns={NUM_COLUMNS}
        keyExtractor={(uri, index) => `${category}-${index}`}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <Pressable style={styles.cell} onPress={() => onSelect(item)}>
            <Image source={{ uri: item }} style={styles.thumb} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 28,
  },
  categories: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: spacing.sm,
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(55, 138, 221, 0.15)',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: colors.text,
  },
  grid: {
    paddingHorizontal: GRID_GAP,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
  },
  thumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
  },
});
