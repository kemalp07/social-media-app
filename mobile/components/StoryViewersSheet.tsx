import { Modal, Pressable, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { colors, spacing } from '@/constants/colors';

export type StoryViewer = {
  name: string;
  reaction: string | null;
};

const FAKE_VIEWERS: StoryViewer[] = [
  { name: 'ayse_fit', reaction: '❤️' },
  { name: 'mert_photo', reaction: null },
  { name: 'zeynep_b', reaction: '🔥' },
  { name: 'can_yoga', reaction: '😍' },
  { name: 'elif_style', reaction: '😂' },
  { name: 'burak_run', reaction: '❤️' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  viewers?: StoryViewer[];
}

export function StoryViewersSheet({
  visible,
  onClose,
  viewers = FAKE_VIEWERS,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />
          <Text style={styles.title}>Görüntüleyenler</Text>
          <FlatList
            data={viewers}
            keyExtractor={(item) => item.name}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar uri={null} name={item.name} size={44} />
                <Text style={styles.name}>{item.name}</Text>
                {item.reaction ? (
                  <Text style={styles.reaction}>{item.reaction}</Text>
                ) : (
                  <View style={styles.reactionSpacer} />
                )}
              </View>
            )}
          />
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Kapat</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    maxHeight: '70%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  list: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  reaction: { fontSize: 20 },
  reactionSpacer: { width: 24 },
  closeBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  closeBtnText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});
