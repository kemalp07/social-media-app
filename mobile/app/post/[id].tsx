import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import * as api from '@/lib/api';
import { getImageUrl } from '@/lib/media';
import { colors, spacing } from '@/lib/theme';
import type { Comment } from '@/lib/types';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .getPost(id)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Gönderi bulunamadı</Text>
      </View>
    );
  }

  const comments = (post.comments as Comment[]) ?? [];
  const users = post.users as { username: string; display_name: string } | undefined;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: getImageUrl(post.image_url as string) }} style={styles.image} resizeMode="cover" />

      <View style={styles.meta}>
        <Text style={styles.author}>@{users?.username ?? 'you'}</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>❤️ {post.like_count as number}</Text>
          <Text style={styles.stat}>💬 {post.comment_count as number}</Text>
          {post.is_viral ? <Text style={styles.viral}>🔥 Viral</Text> : null}
        </View>
        {post.caption ? <Text style={styles.caption}>{post.caption as string}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Yorumlar</Text>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const bot = item.fake_users;
          const name = item.username ?? bot?.display_name ?? bot?.username ?? 'user';
          const avatar = item.avatar_url;
          return (
            <View style={styles.comment}>
              <Avatar uri={avatar} name={name} size={32} />
              <View style={styles.commentBody}>
                <Text style={styles.commentUser}>{name}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                {!item.is_template && <Text style={styles.aiTag}>AI</Text>}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.noComments}>Henüz yorum yok</Text>}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.textMuted,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  meta: {
    padding: spacing.md,
  },
  author: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stat: {
    color: colors.text,
    fontWeight: '600',
  },
  viral: {
    color: colors.viral,
    fontWeight: '700',
  },
  caption: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontSize: 15,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  comment: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  commentBody: {
    flex: 1,
  },
  commentUser: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
  commentText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  aiTag: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  noComments: {
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
