import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { colors, spacing } from '@/lib/theme';
import type { Post } from '@/lib/types';

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

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/post/${post.id}`)}>
      <View style={styles.header}>
        <Avatar uri={author?.avatar_url} name={author?.display_name} size={36} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{author?.username ?? 'you'}</Text>
          {post.is_viral && <Text style={styles.viralBadge}>🔥 Viral</Text>}
        </View>
      </View>

      <Image source={{ uri: post.image_url }} style={styles.image} resizeMode="cover" />

      <View style={styles.stats}>
        <Text style={styles.stat}>❤️ {formatCount(post.like_count)}</Text>
        <Text style={styles.stat}>💬 {formatCount(post.comment_count)}</Text>
        {post.quality_score > 0 && (
          <Text style={styles.score}>⭐ {Number(post.quality_score).toFixed(1)}</Text>
        )}
      </View>

      {post.caption ? <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text> : null}
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
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  username: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  viralBadge: {
    color: colors.viral,
    fontSize: 12,
    fontWeight: '700',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  stat: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  score: {
    color: colors.premium,
    fontSize: 13,
    marginLeft: 'auto',
  },
  caption: {
    color: colors.textMuted,
    fontSize: 14,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
});
