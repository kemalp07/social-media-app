import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { VibeLogo } from '@/components/VibeLogo';
import { useUser } from '@/context/UserContext';
import { colors, spacing } from '@/constants/colors';
import { API_URL } from '@/lib/config';

const STEPS = ['welcome', 'profile', 'ready'] as const;

const ONBOARDING_BACKGROUNDS = [
  require('../assets/splash/onboarding_1.png'),
  require('../assets/splash/onboarding_2.png'),
  require('../assets/splash/onboarding_3.png'),
] as const;

export default function Onboarding() {
  const { register } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('[Onboarding] API_URL:', API_URL);
    console.log('[Onboarding] EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL ?? '(not set)');
  }, []);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  };

  const handleFinish = async () => {
    if (!username.trim() || !displayName.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve isim gerekli.');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim().toLowerCase(), displayName.trim());
      router.replace('/(tabs)');
    } catch (error) {
      const axiosDetail = axios.isAxiosError(error)
        ? {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            message: error.message,
          }
        : null;

      console.log('[Onboarding] Hesap oluşturma hatası:', {
        apiUrl: API_URL,
        username: username.trim().toLowerCase(),
        error,
        axiosDetail,
      });

      const serverMessage =
        axios.isAxiosError(error) && error.response?.data?.detail
          ? String(error.response.data.detail)
          : error instanceof Error
            ? error.message
            : 'Bilinmeyen hata';

      Alert.alert('Hata', `Hesap oluşturulamadı: ${serverMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={ONBOARDING_BACKGROUNDS[step]}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.step}>
            <VibeLogo size="lg" />
            <Text style={styles.title}>Sosyal medya deneyimini yaşa</Text>
            <Text style={styles.subtitle}>
              Gerçek gibi hissettiren yapay zeka sosyal dünyasına hoş geldin
            </Text>
            <Pressable style={styles.btn} onPress={() => setStep(1)}>
              <Text style={styles.btnText}>Başlayalım →</Text>
            </Pressable>
          </View>
        )}

        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Profil oluştur</Text>
            <Pressable onPress={pickAvatar} style={styles.avatarPicker}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <Image
                  source={require('../assets/icons/icon_camera.png')}
                  style={styles.avatarPlaceholderIcon}
                />
              )}
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="Adın"
              placeholderTextColor={colors.textMuted}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <TextInput
              style={styles.input}
              placeholder="@kullaniciadi"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Bio (opsiyonel)"
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
            />
            <Pressable style={styles.btn} onPress={() => setStep(2)}>
              <Text style={styles.btnText}>Devam →</Text>
            </Pressable>
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.stepTitle}>Hesabın oluşturuldu!</Text>
            <Text style={styles.subtitle}>İlk postunu atmaya hazır mısın?</Text>
            <Text style={styles.followerStart}>0 takipçi</Text>
            <Pressable style={styles.btn} onPress={handleFinish} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Keşfet →</Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  container: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.xl,
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: '100%',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 24 },
  step: { alignItems: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: spacing.lg },
  subtitle: { color: colors.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  stepTitle: { color: colors.text, fontSize: 24, fontWeight: '700' },
  followerStart: { color: colors.secondary, fontSize: 32, fontWeight: '800' },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholderIcon: { width: 36, height: 36, tintColor: colors.textMuted },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    width: '100%',
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
