import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  content: string;
  isUser: boolean;
  time?: string;
  isTyping?: boolean;
}

export function ChatBubble({ content, isUser, time, isTyping }: Props) {
  if (isTyping) {
    return (
      <View style={[styles.bubble, styles.aiBubble]}>
        <Text style={styles.typing}>yazıyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.text, isUser && styles.userText]}>{content}</Text>
      {time && <Text style={styles.time}>{time}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  text: { color: colors.text, fontSize: 15 },
  userText: { color: '#fff' },
  time: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  typing: { color: colors.textMuted, fontStyle: 'italic', fontSize: 13 },
});
