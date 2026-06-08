import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { StoryViewersSheet } from '@/components/StoryViewersSheet';
import { colors, spacing } from '@/constants/colors';

const QUICK_REACTIONS = ['❤️', '😍', '🔥', '😂'] as const;
const OWN_VIEWER_COUNT = 247;

interface Props {
  visible: boolean;
  name: string;
  avatarUrl?: string | null;
  isOwn?: boolean;
  onClose: () => void;
}

function ReactionButton({
  emoji,
  onPress,
}: {
  emoji: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    scale.setValue(0.6);
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 200,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.Text style={[styles.reactionBtn, { transform: [{ scale }] }]}>
        {emoji}
      </Animated.Text>
    </Pressable>
  );
}

export function StoryViewModal({ visible, name, avatarUrl, isOwn = false, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const [viewersOpen, setViewersOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const floatOpacity = useRef(new Animated.Value(0)).current;
  const floatScale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setMessage('');
      setViewersOpen(false);
      setFloatingReaction(null);
    }
  }, [visible, translateY]);

  const showReactionBurst = (emoji: string) => {
    setFloatingReaction(emoji);
    floatOpacity.setValue(1);
    floatScale.setValue(0.5);
    Animated.parallel([
      Animated.spring(floatScale, { toValue: 1.4, useNativeDriver: true }),
      Animated.timing(floatOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start(() => setFloatingReaction(null));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          onClose();
          return;
        }
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <Animated.View
          style={[styles.screen, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
            <View style={styles.headerUser}>
              <Avatar uri={avatarUrl} name={name} size={36} />
              <Text style={styles.headerName} numberOfLines={1}>
                {name}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          </View>

          <View style={styles.body}>
            <Text style={styles.comingSoon}>Yakında 🔜</Text>
            {floatingReaction && (
              <Animated.Text
                style={[
                  styles.floatingReaction,
                  { opacity: floatOpacity, transform: [{ scale: floatScale }] },
                ]}
              >
                {floatingReaction}
              </Animated.Text>
            )}
          </View>

          {isOwn ? (
            <Pressable
              style={[styles.viewersBtn, { bottom: insets.bottom + spacing.xl + 12 }]}
              onPress={() => setViewersOpen(true)}
            >
              <Text style={styles.viewersIcon}>👁</Text>
              <Text style={styles.viewersText}>{OWN_VIEWER_COUNT} kişi gördü</Text>
            </Pressable>
          ) : (
            <View style={[styles.reactionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
              <TextInput
                style={styles.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Mesaj gönder..."
                placeholderTextColor={colors.textMuted}
              />
              <View style={styles.reactionRow}>
                {QUICK_REACTIONS.map((emoji) => (
                  <ReactionButton
                    key={emoji}
                    emoji={emoji}
                    onPress={() => showReactionBurst(emoji)}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </Animated.View>
      </Modal>

      <StoryViewersSheet visible={viewersOpen} onClose={() => setViewersOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: { padding: 4 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoon: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  floatingReaction: {
    position: 'absolute',
    fontSize: 64,
  },
  viewersBtn: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  viewersIcon: { fontSize: 16 },
  viewersText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  reactionBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  reactionBtn: { fontSize: 28 },
  footer: {
    paddingHorizontal: spacing.md,
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
});
