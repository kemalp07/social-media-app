import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { colors, spacing } from '@/constants/colors';

export default function CreateScreen() {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Kamera erişimi için izin ver.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!user || !imageUri) {
      Alert.alert('Hata', 'Önce bir fotoğraf seç.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.createPost(user.id, imageUri, caption);
      await refreshUser();

      const likes = result.target_like_count ?? 0;
      const gain = result.follower_gain ?? 0;
      const viral = result.is_viral ? '\n🔥 Viral olma ihtimali tetiklendi!' : '';

      Alert.alert(
        'Paylaşıldı! Beğeniler geliyor 🚀',
        `AI Skor: ${result.analysis?.quality_score ?? '?'}/10\n~${likes} beğeni\n+${gain} takipçi${viral}`,
        [{ text: 'Tamam', onPress: () => router.push('/(tabs)') }]
      );
      setImageUri(null);
      setCaption('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gönderi paylaşılamadı.';
      Alert.alert('Hata', msg.includes('limit') ? 'Günlük post limitine ulaştın (3/gün). Premium ile sınırsız!' : msg);
    } finally {
      setLoading(false);
    }
  };

  const isPremium = user?.tier_level === 'premium';
  const dailyLimit = isPremium ? '∞' : '3';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.limit}>
        Günlük post: {dailyLimit} {isPremium ? '(Premium)' : '(Ücretsiz)'}
      </Text>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Fotoğraf seç veya çek</Text>
        </View>
      )}

      <View style={styles.pickRow}>
        <Pressable style={styles.pickBtn} onPress={pickImage}>
          <Text style={styles.pickBtnText}>📁 Galeri</Text>
        </Pressable>
        <Pressable style={styles.pickBtn} onPress={takePhoto}>
          <Text style={styles.pickBtnText}>📷 Kamera</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.caption}
        placeholder="Bir açıklama yaz..."
        placeholderTextColor={colors.textMuted}
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={500}
      />

      <Pressable
        style={[styles.postBtn, (!imageUri || loading) && styles.postBtnDisabled]}
        onPress={handlePost}
        disabled={!imageUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.postBtnText}>Paylaş 🚀</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
  },
  limit: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  pickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pickBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickBtnText: {
    color: colors.text,
    fontWeight: '600',
  },
  caption: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginTop: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  postBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
