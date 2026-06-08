import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VibeLogo } from '@/components/VibeLogo';
import { colors, spacing } from '@/constants/colors';
import { useUser } from '@/context/UserContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useUser();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0;

  const handleLogin = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      await login(username.trim().toLowerCase());
      router.replace('/(tabs)');
    } catch (error) {
      const msg = axios.isAxiosError(error) && error.response?.status === 404
        ? 'Kullanıcı bulunamadı'
        : error instanceof Error
          ? error.message
          : 'Giriş yapılamadı';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <VibeLogo size="lg" />
        <Text style={styles.title}>Tekrar hoş geldin</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="@kullanıcıadı"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Şifre"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <Pressable
            style={[styles.btnWrap, !canSubmit && styles.btnDisabled]}
            onPress={() => void handleLogin()}
            disabled={!canSubmit || loading}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Giriş Yap</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/onboarding')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Hesabın yok mu? <Text style={styles.registerHighlight}>Kayıt ol</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  form: {
    width: '100%',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  btnWrap: {
    marginTop: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  registerText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },
});
