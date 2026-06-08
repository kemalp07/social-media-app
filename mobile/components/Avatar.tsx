import { Image, StyleSheet } from 'react-native';

import { useUser } from '@/context/UserContext';
import { resolveAvatarUri } from '@/lib/avatar';

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: Props) {
  const { localAvatarUri, user } = useUser();

  const isOwnAvatar = uri === user?.avatar_url || !uri;
  const finalUri =
    isOwnAvatar && localAvatarUri
      ? localAvatarUri
      : resolveAvatarUri(uri, name ?? user?.username);

  return (
    <Image
      source={{ uri: finalUri }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: 'transparent',
  },
});
