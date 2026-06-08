import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPost: () => void;
  onStory: () => void;
}

export function CreateMenuModal({ visible, onClose, onPost, onStory }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.modalHandle} />
          <Pressable style={styles.modalOption} onPress={onPost}>
            <Text style={styles.modalOptionText}>📷 Fotoğraf Paylaş</Text>
          </Pressable>
          <View style={styles.modalDivider} />
          <Pressable style={styles.modalOption} onPress={onStory}>
            <Text style={styles.modalOptionText}>⭕ Hikaye Ekle</Text>
          </Pressable>
          <Pressable style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>İptal</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalOption: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalOptionText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  modalDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  modalCancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  modalCancelText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
});
