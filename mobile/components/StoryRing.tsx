import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { resolveAvatarUri } from '@/lib/avatar';

const GRADIENT = ['#378ADD', '#1D9E75'] as const;
const AVATAR_SIZE = 58;
const RING_SIZE = AVATAR_SIZE + 8;

interface Props {
  name: string;
  avatarUrl?: string | null;
  isOwn?: boolean;
  hasStory?: boolean;
  onPress?: () => void;
}

export function StoryRing({ name, avatarUrl, isOwn, hasStory = true, onPress }: Props) {
  const imageUri = resolveAvatarUri(avatarUrl, name);
  const displayName = isOwn ? 'Sen' : name.split(' ')[0];

  const avatar = (
    <View style={styles.avatarWrap}>
      <Image source={{ uri: imageUri }} style={styles.avatar} />
      {isOwn && !hasStory && (
        <View style={styles.plusBadge}>
          <Ionicons name="add" size={14} color="#ffffff" />
        </View>
      )}
    </View>
  );

  const showGradient = hasStory;

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {showGradient ? (
        <LinearGradient
          colors={[...GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={styles.innerRing}>{avatar}</View>
        </LinearGradient>
      ) : (
        <View style={[styles.plainRing, isOwn && styles.ownRing]}>{avatar}</View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {displayName}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 78, marginRight: 12 },
  gradientRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    backgroundColor: colors.bg,
    borderRadius: (RING_SIZE - 5) / 2,
    padding: 2,
  },
  plainRing: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#378ADD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  ownRing: {
    borderColor: colors.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
  },
  plusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  name: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
    maxWidth: 74,
    textAlign: 'center',
  },
});
