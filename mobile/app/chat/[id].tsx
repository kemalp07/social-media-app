import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/lib/theme';
import type { Message } from '@/lib/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user || !id) return;
    const data = await api.getMessages(id, user.id);
    setMessages(data);
  }, [user, id]);

  useEffect(() => {
    loadMessages()
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [loadMessages]);

  const handleSend = async () => {
    if (!user || !id || !text.trim() || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content,
      created_at: new Date().toISOString(),
      is_read: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await api.sendMessage(id, user.id, content);
      await loadMessages();

      if (!result.replied) {
        setMessages((prev) => [
          ...prev,
          {
            id: `read-${Date.now()}`,
            sender: 'ai',
            content: '...',
            created_at: new Date().toISOString(),
            is_read: false,
          },
        ]);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        renderItem={({ item }) => {
          const isUser = item.sender === 'user';
          const isReadReceipt = item.content === '...';
          return (
            <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
              {isReadReceipt ? (
                <Text style={styles.readReceipt}>Görüldü</Text>
              ) : (
                <Text style={[styles.bubbleText, isUser && styles.userText]}>{item.content}</Text>
              )}
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  list: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: colors.text,
    fontSize: 15,
  },
  userText: {
    color: '#fff',
  },
  readReceipt: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#fff',
    fontSize: 18,
  },
});
