import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { colors } from '@/constants/colors';

interface Props {
  name: string;
  avatarUrl?: string | null;
  isOwn?: boolean;
  hasStory?: boolean;
  onPress?: () => void;
}

export function StoryRing({ name, avatarUrl, isOwn, hasStory = true, onPress }: Props) {
  const inner = (
    <View style={styles.inner}>
      <Avatar uri={avatarUrl} name={name} size={56} />
      {isOwn && <Text style={styles.plus}>+</Text>}
    </View>
  );

  return (
    <Pressable style={styles.container} onPress={onPress}>
      {hasStory && !isOwn ? (
        <View style={[styles.ring, { borderColor: colors.primary }]}>
          {inner}
        </View>
      ) : (
        <View style={styles.plainRing}>{inner}</View>
      )}
      <Text style={styles.name} numberOfLines={1}>{isOwn ? 'Sen' : name.split(' ')[0]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: 72, marginRight: 12 },
  ring: {
    padding: 2,
    borderRadius: 32,
    borderWidth: 2,
  },
  plainRing: { padding: 2 },
  inner: { position: 'relative' },
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
  },
  name: { color: colors.textMuted, fontSize: 11, marginTop: 4, maxWidth: 72 },
});
