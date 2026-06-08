import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { getImageUrl } from '@/lib/media';
import { timeAgo } from '@/lib/timeAgo';
import type { Post } from '@/lib/types';

const ICON_SIZE = 26;
const ICON_WHITE = '#ffffff';
const HEART_ACTIVE = '#ff3040';

interface Props {
  post: Post;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function PostCard({ post }: Props) {
  const router = useRouter();
  const author = post.users;
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  useEffect(() => {
    setLikeCount(post.like_count);
  }, [post.id, post.like_count]);

  const animateHeart = () => {
    heartScale.setValue(0);
    Animated.spring(heartScale, { toValue: 1, useNativeDriver: true }).start(() => {
      Animated.timing(heartScale, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleLike = () => {
    setLiked((prev) => {
      if (!prev) setLikeCount((c) => c + 1);
      else setLikeCount((c) => Math.max(0, c - 1));
      return !prev;
    });
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
      animateHeart();
    }
    lastTap.current = now;
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => router.push(`/post/${post.id}`)}>
        <Avatar uri={author?.avatar_url} name={author?.display_name} size={32} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{author?.username ?? 'you'}</Text>
          {post.is_viral && <Text style={styles.viral}>Trend</Text>}
        </View>
        <Pressable hitSlop={8}>
          <Ionicons name="ellipsis-horizontal" size={18} color={ICON_WHITE} />
        </Pressable>
      </Pressable>

      <Pressable onPress={handleDoubleTap}>
        {post.image_url?.trim() ? (
          <Image source={{ uri: getImageUrl(post.image_url) }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          </View>
        )}
        <Animated.View
          style={[styles.bigHeart, { transform: [{ scale: heartScale }], opacity: heartScale }]}
        >
          <Ionicons name="heart" size={80} color={HEART_ACTIVE} />
        </Animated.View>
      </Pressable>

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <Pressable onPress={handleLike} hitSlop={6}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={ICON_SIZE}
              color={liked ? HEART_ACTIVE : ICON_WHITE}
            />
          </Pressable>
          <Pressable onPress={() => router.push(`/post/${post.id}`)} hitSlop={6}>
            <Ionicons name="chatbubble-outline" size={ICON_SIZE} color={ICON_WHITE} />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/messages')} hitSlop={6}>
            <Ionicons name="paper-plane-outline" size={ICON_SIZE} color={ICON_WHITE} />
          </Pressable>
        </View>
        <Pressable onPress={() => setSaved((s) => !s)} hitSlop={6}>
          <Ionicons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={ICON_SIZE}
            color={ICON_WHITE}
          />
        </Pressable>
      </View>
      <Text style={styles.likes}>{formatCount(likeCount)} beğeni</Text>
      {post.caption ? (
        <Text style={styles.caption} numberOfLines={3}>
          <Text style={styles.captionUser}>{author?.username} </Text>
          {post.caption}
        </Text>
      ) : null}
      {post.comment_count > 0 && (
        <Pressable onPress={() => router.push(`/post/${post.id}`)}>
          <Text style={styles.viewComments}>
            {post.comment_count} yorumun tamamını gör
          </Text>
        </Pressable>
      )}
      <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  headerText: { flex: 1 },
  username: { color: colors.text, fontWeight: '700', fontSize: 14 },
  viral: { color: colors.secondary, fontSize: 11, fontWeight: '600', marginTop: 1 },
  image: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigHeart: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  likes: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  caption: {
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    lineHeight: 20,
  },
  captionUser: { fontWeight: '700' },
  viewComments: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  time: {
    color: colors.textMuted,
    fontSize: 11,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    textTransform: 'uppercase',
  },
});
