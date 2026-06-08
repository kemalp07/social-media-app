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

import { ChatBubble } from '@/components/ChatBubble';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';
import type { Message } from '@/lib/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!user || !id) return;
    const data = await api.getMessages(id, user.id);
    setMessages(data);
  }, [user, id]);

  useEffect(() => {
    loadMessages().catch(() => setMessages([])).finally(() => setLoading(false));
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

    setTyping(true);
    const delay = 1000 + Math.random() * 2000;

    try {
      const result = await api.sendMessage(id, user.id, content);
      setTimeout(async () => {
        setTyping(false);
        if (result.replied) {
          await loadMessages();
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
          setMessages((prev) => [...prev, optimistic]);
        }
        setSending(false);
      }, delay);
    } catch {
      setTyping(false);
      setSending(false);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
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
        ListFooterComponent={typing ? <ChatBubble content="" isUser={false} isTyping /> : null}
        renderItem={({ item }) => (
          <ChatBubble
            content={item.content}
            isUser={item.sender === 'user'}
            time={new Date(item.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          />
        )}
      />
      <View style={styles.inputRow}>
        <Text style={styles.camera}>📷</Text>
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
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md },
  inputRow: {
    flexDirection: 'row', padding: spacing.md, gap: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end',
  },
  camera: { fontSize: 22, paddingBottom: 10 },
  input: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 22,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.text, fontSize: 15, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#fff', fontSize: 18 },
});
