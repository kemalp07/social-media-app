import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/colors';
import { getGameMode, setGameMode, type GameMode } from '@/lib/storage';

type Props = {
  visible: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
};

type ViewState = 'main' | 'gameMode';

type SettingsRowProps = {
  emoji: string;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  badge?: string;
  danger?: boolean;
  showChevron?: boolean;
};

function SettingsRow({
  emoji,
  label,
  onPress,
  disabled,
  badge,
  danger,
  showChevron = true,
}: SettingsRowProps) {
  return (
    <Pressable
      style={[styles.row, disabled && styles.rowDisabled]}
      onPress={onPress}
      disabled={disabled || !onPress}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ) : (
        <View style={styles.rowSpacer} />
      )}
    </Pressable>
  );
}

function SettingsDivider() {
  return <View style={styles.divider} />;
}

function GameModePicker({
  selected,
  onSelect,
  onBack,
}: {
  selected: GameMode;
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.subView}>
      <View style={styles.subHeader}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.subTitle}>Oyun Modu</Text>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.subSubtitle}>İstediğin zaman değiştirebilirsin</Text>

      <Pressable
        style={[styles.modeCard, selected === 'real' && styles.modeCardSelected]}
        onPress={() => onSelect('real')}
      >
        <Text style={styles.modeCardTitle}>📷 Gerçek Mod</Text>
        <Text style={styles.modeCardDesc}>Kendi fotoğraflarını çek ve paylaş</Text>
      </Pressable>

      <Pressable
        style={[styles.modeCard, selected === 'character' && styles.modeCardSelected]}
        onPress={() => onSelect('character')}
      >
        <Text style={styles.modeCardTitle}>🎭 Karakter Modu</Text>
        <Text style={styles.modeCardDesc}>
          Hazır fotoğraflardan seç, kim olduğun bilinmesin
        </Text>
      </Pressable>
    </View>
  );
}

function LogoutConfirmModal({
  visible,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>Çıkış yapmak istediğine emin misin?</Text>
          <View style={styles.confirmActions}>
            <Pressable style={styles.confirmBtn} onPress={onCancel}>
              <Text style={styles.confirmBtnText}>İptal</Text>
            </Pressable>
            <Pressable style={[styles.confirmBtn, styles.confirmBtnDanger]} onPress={onConfirm}>
              <Text style={styles.confirmBtnDangerText}>Çıkış Yap</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function SettingsModal({ visible, onClose, onEditProfile, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewState>('main');
  const [gameMode, setGameModeSelection] = useState<GameMode>('real');
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      void getGameMode().then((mode) => setGameModeSelection(mode ?? 'real'));
      setView('main');
      setLogoutConfirmVisible(false);
    }
  }, [visible]);

  const handleClose = () => {
    setView('main');
    setLogoutConfirmVisible(false);
    onClose();
  };

  const handleGameModeSelect = async (mode: GameMode) => {
    setGameModeSelection(mode);
    await setGameMode(mode);
    setView('main');
  };

  const handleLogoutConfirm = () => {
    setLogoutConfirmVisible(false);
    handleClose();
    onLogout();
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.handle} />
            {view === 'main' ? (
              <>
                <Text style={styles.title}>Ayarlar</Text>
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  <SettingsRow
                    emoji="👤"
                    label="Profili Düzenle"
                    onPress={() => {
                      handleClose();
                      onEditProfile();
                    }}
                  />
                  <SettingsRow
                    emoji="🔔"
                    label="Bildirimler"
                    disabled
                    badge="Yakında"
                    showChevron={false}
                  />
                  <SettingsRow
                    emoji="🎭"
                    label="Oyun Modu Değiştir"
                    onPress={() => setView('gameMode')}
                  />
                  <SettingsRow
                    emoji="🌙"
                    label="Tema"
                    disabled
                    badge="Yakında"
                    showChevron={false}
                  />

                  <SettingsDivider />

                  <SettingsRow emoji="❓" label="Yardım" disabled showChevron={false} />

                  <SettingsDivider />

                  <SettingsRow
                    emoji="🚪"
                    label="Çıkış Yap"
                    danger
                    showChevron={false}
                    onPress={() => setLogoutConfirmVisible(true)}
                  />
                </ScrollView>
              </>
            ) : (
              <GameModePicker
                selected={gameMode}
                onSelect={(mode) => void handleGameModeSelect(mode)}
                onBack={() => setView('main')}
              />
            )}
          </View>
        </View>
      </Modal>

      <LogoutConfirmModal
        visible={logoutConfirmVisible}
        onCancel={() => setLogoutConfirmVisible(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#555555',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    gap: spacing.sm,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  rowLabelDanger: {
    color: '#ff3040',
  },
  rowSpacer: {
    width: 18,
  },
  badge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginVertical: spacing.xs,
  },
  subView: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBtn: {
    width: 32,
    alignItems: 'flex-start',
  },
  subTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  subSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  modeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(55, 138, 221, 0.12)',
  },
  modeCardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modeCardDesc: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#222222',
  },
  confirmTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  confirmBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtnDanger: {
    backgroundColor: 'rgba(255, 48, 64, 0.15)',
  },
  confirmBtnDangerText: {
    color: '#ff3040',
    fontSize: 15,
    fontWeight: '700',
  },
});
