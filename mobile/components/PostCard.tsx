import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, spacing } from '@/constants/colors';
import type { Post } from '@/lib/types';

interface Props {
  post: Post;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function PostCard({ post }: Props) {
  const router = useRouter();
  const author = post.users;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const animateHeart = () => {
    heartScale.setValue(0);
    Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }).start(() => {
      Animated.timing(heartScale, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleLike();
      animateHeart();
    }
    lastTap.current = now;
  };

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/post/${post.id}`)}>
      <View style={styles.header}>
        <Avatar uri={author?.avatar_url} name={author?.display_name} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{author?.username ?? 'you'}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </View>
        {post.is_viral && <Text style={styles.viral}>🔥</Text>}
      </View>

      <Pressable onPress={handleDoubleTap}>
        <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />
        <Animated.Text
          style={[styles.bigHeart, { transform: [{ scale: heartScale }], opacity: heartScale }]}
        >
          ❤️
        </Animated.Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={handleLike}>
          <Text style={styles.action}>{liked ? '❤️' : '🤍'} {formatCount(likeCount)}</Text>
        </Pressable>
        <Text style={styles.action}>💬 {formatCount(post.comment_count)}</Text>
        <Text style={styles.action}>↗</Text>
        <Text style={[styles.action, styles.save]}>🔖</Text>
      </View>

      <Text style={styles.likes}>{formatCount(likeCount)} beğeni</Text>
      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionUser}>{author?.username} </Text>
          {post.caption}
        </Text>
      ) : null}
      {post.comment_count > 0 && (
        <Text style={styles.viewComments}>
          {post.comment_count} yorumun tamamını gör
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerText: { flex: 1 },
  username: { color: colors.text, fontWeight: '700', fontSize: 14 },
  time: { color: colors.textMuted, fontSize: 12 },
  viral: { fontSize: 16 },
  image: { width: '100%', aspectRatio: 1 },
  bigHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    fontSize: 80,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  action: { color: colors.text, fontSize: 14, fontWeight: '600' },
  save: { marginLeft: 'auto' },
  likes: { color: colors.text, fontWeight: '700', fontSize: 14, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  caption: { color: colors.text, fontSize: 14, paddingHorizontal: spacing.md, paddingTop: 4 },
  captionUser: { fontWeight: '700' },
  viewComments: { color: colors.textMuted, fontSize: 13, padding: spacing.md, paddingTop: 4 },
});
