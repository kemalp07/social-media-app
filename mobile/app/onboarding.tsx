import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useUser } from '@/context/UserContext';
import { colors, spacing } from '@/lib/theme';

export default function Onboarding() {
  const { register } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!username.trim() || !displayName.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve görünen ad gerekli.');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim().toLowerCase(), displayName.trim());
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Hata', 'Hesap oluşturulamadı. Kullanıcı adı alınmış olabilir.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>GlowUp</Text>
      <Text style={styles.subtitle}>İnfluencer yolculuğun başlıyor ✨</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Kullanıcı adı</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="kullaniciadi"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          maxLength={30}
        />

        <Text style={styles.label}>Görünen ad</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Adın"
          placeholderTextColor={colors.textMuted}
          maxLength={50}
        />
      </View>

      <Pressable style={styles.button} onPress={handleStart} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Başla 🚀</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    fontSize: 16,
  },
  form: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
