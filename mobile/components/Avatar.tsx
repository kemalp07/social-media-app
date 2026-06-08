import { Image, StyleSheet } from 'react-native';

import { resolveAvatarUri } from '@/lib/avatar';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: Props) {
  const sourceUri = resolveAvatarUri(uri, name);

  return (
    <Image
      source={{ uri: sourceUri }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'transparent',
  },
});
