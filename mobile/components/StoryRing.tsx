import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { resolveAvatarUri } from '@/lib/avatar';

const GRADIENT = ['#378ADD', '#1D9E75'] as const;

interface Props {
  name: string;
  avatarUrl?: string | null;
  isOwn?: boolean;
  hasStory?: boolean;
  onPress?: () => void;
}

export function StoryRing({ name, avatarUrl, isOwn, hasStory = true, onPress }: Props) {
  const imageUri = resolveAvatarUri(avatarUrl, name);

  const ringContent = (
    <View style={styles.avatarWrap}>
      <Image source={{ uri: imageUri }} style={styles.avatar} />
      {isOwn && <Text style={styles.plus}>+</Text>}
    </View>
  );

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {hasStory && !isOwn ? (
        <LinearGradient
          colors={[...GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={styles.innerRing}>{ringContent}</View>
        </LinearGradient>
      ) : (
        <View style={[styles.plainRing, isOwn && styles.ownRing]}>{ringContent}</View>
      )}
      <Text style={styles.name} numberOfLines={1}>
        {isOwn ? 'Hikayen' : name.split(' ')[0]}
      </Text>
    </Pressable>
  );
}

const AVATAR_SIZE = 56;

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 76, marginRight: 10 },
  gradientRing: {
    padding: 2.5,
    borderRadius: 34,
  },
  innerRing: {
    backgroundColor: colors.bg,
    borderRadius: 31,
    padding: 2,
  },
  plainRing: {
    padding: 2,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#378ADD',
  },
  ownRing: {
    borderColor: colors.textMuted,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  plus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    color: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  name: { color: colors.text, fontSize: 11, marginTop: 6, maxWidth: 72 },
});
