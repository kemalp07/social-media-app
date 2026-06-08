import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CharacterPhotoPicker } from '@/components/CharacterPhotoPicker';
import { colors, spacing } from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import { getGameMode, type GameMode } from '@/lib/storage';

type ContentMode = 'post' | 'story';
type RealScreen = 'camera' | 'preview';
type CharacterScreen = 'pick' | 'preview';

async function ensureLocalImageUri(uri: string): Promise<string> {
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://')
  ) {
    return uri;
  }

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('Önbellek dizinine erişilemedi.');
  }

  const path = `${cacheDir}post-${Date.now()}.jpg`;
  const result = await FileSystem.downloadAsync(uri, path);
  return result.uri;
}

export default function CreateScreen() {
  const [gameMode, setGameModeState] = useState<GameMode | null>(null);

  React.useEffect(() => {
    void getGameMode().then((mode) => setGameModeState(mode ?? 'real'));
  }, []);

  if (gameMode === null) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (gameMode === 'character') {
    return <CharacterCreateScreen />;
  }

  return <RealCreateScreen />;
}

function CharacterCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useUser();

  const [screen, setScreen] = useState<CharacterScreen>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleShare = async () => {
    if (!user || !imageUri) {
      Alert.alert('Hata', 'Önce bir fotoğraf seç.');
      return;
    }

    setSharing(true);
    try {
      const localUri = await ensureLocalImageUri(imageUri);
      const result = await api.createPost(user.id, localUri, caption, location.trim() || undefined);
      router.replace('/(tabs)');
      void refreshUser();
      if (result?.on_explore) {
        setTimeout(() => {
          Alert.alert('Keşfet 🌟', 'Gönderin Keşfet sayfasına düştü!');
        }, 400);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gönderi paylaşılamadı.';
      Alert.alert(
        'Hata',
        msg.includes('limit')
          ? 'Günlük post limitine ulaştın (3/gün). Premium ile sınırsız!'
          : msg
      );
    } finally {
      setSharing(false);
    }
  };

  if (sharing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Paylaşılıyor...</Text>
      </View>
    );
  }

  if (screen === 'preview' && imageUri) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.previewImageWrap, { paddingTop: insets.top }]}>
          <Image source={{ uri: imageUri }} style={styles.previewImageSquare} resizeMode="cover" />
        </View>

        <View style={[styles.previewTopBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={() => setScreen('pick')} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <Pressable onPress={() => void handleShare()} hitSlop={8}>
            <Text style={styles.shareBtn}>Paylaş</Text>
          </Pressable>
        </View>

        <View style={[styles.previewBottom, { paddingBottom: insets.bottom + spacing.md }]}>
          <TextInput
            style={styles.captionInput}
            placeholder="Bir açıklama yaz..."
            placeholderTextColor={colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />

          {showLocationInput ? (
            <TextInput
              style={styles.locationInput}
              placeholder="Konum ekle..."
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          ) : (
            <Pressable style={styles.locationBtn} onPress={() => setShowLocationInput(true)}>
              <Ionicons name="location-outline" size={20} color={colors.text} />
              <Text style={styles.locationBtnText}>Konum ekle</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <CharacterPhotoPicker
      onClose={handleClose}
      onSelect={(uri) => {
        setImageUri(uri);
        setScreen('preview');
      }}
    />
  );
}

function RealCreateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useUser();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [screen, setScreen] = useState<RealScreen>('camera');
  const [contentMode, setContentMode] = useState<ContentMode>('post');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [sharing, setSharing] = useState(false);

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Galeri izni gerekli',
        'Fotoğraf seçmek için galeri erişimine izin ver.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Ayarlar', onPress: () => void Linking.openSettings() },
        ]
      );
      return;
    }

    const aspect = contentMode === 'story' ? [9, 16] as [number, number] : [1, 1] as [number, number];
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.85,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setScreen('preview');
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setImageUri(photo.uri);
        setScreen('preview');
      }
    } catch {
      Alert.alert('Hata', 'Fotoğraf çekilemedi. Tekrar dene.');
    } finally {
      setCapturing(false);
    }
  };

  const handleBackFromPreview = () => {
    setImageUri(null);
    setScreen('camera');
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleShare = async () => {
    if (!user || !imageUri) {
      Alert.alert('Hata', 'Önce bir fotoğraf seç.');
      return;
    }

    setSharing(true);
    try {
      const result = await api.createPost(user.id, imageUri, caption, location.trim() || undefined);
      router.replace('/(tabs)');
      void refreshUser();
      if (result?.on_explore) {
        setTimeout(() => {
          Alert.alert('Keşfet 🌟', 'Gönderin Keşfet sayfasına düştü!');
        }, 400);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gönderi paylaşılamadı.';
      Alert.alert(
        'Hata',
        msg.includes('limit')
          ? 'Günlük post limitine ulaştın (3/gün). Premium ile sınırsız!'
          : msg
      );
    } finally {
      setSharing(false);
    }
  };

  if (sharing) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Paylaşılıyor...</Text>
      </View>
    );
  }

  if (screen === 'preview' && imageUri) {
    const previewAspect = contentMode === 'story' ? 9 / 16 : 1;

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.previewImageWrap, { paddingTop: insets.top }]}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.previewImage, { aspectRatio: previewAspect }]}
            resizeMode="cover"
          />
        </View>

        <View style={[styles.previewTopBar, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable onPress={handleBackFromPreview} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <Pressable onPress={() => void handleShare()} hitSlop={8}>
            <Text style={styles.shareBtn}>Paylaş</Text>
          </Pressable>
        </View>

        <View style={[styles.previewBottom, { paddingBottom: insets.bottom + spacing.md }]}>
          <TextInput
            style={styles.captionInput}
            placeholder="Bir açıklama yaz..."
            placeholderTextColor={colors.textMuted}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />

          {showLocationInput ? (
            <TextInput
              style={styles.locationInput}
              placeholder="Konum ekle..."
              placeholderTextColor={colors.textMuted}
              value={location}
              onChangeText={setLocation}
              maxLength={100}
            />
          ) : (
            <Pressable
              style={styles.locationBtn}
              onPress={() => setShowLocationInput(true)}
            >
              <Ionicons name="location-outline" size={20} color={colors.text} />
              <Text style={styles.locationBtnText}>Konum ekle</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.permissionScreen}>
        <Pressable onPress={handleClose} style={[styles.closeBtn, { top: insets.top + spacing.sm }]}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Kamera web'de desteklenmiyor</Text>
        <Text style={styles.permissionText}>Galeriden fotoğraf seçerek devam edebilirsin.</Text>
        <Pressable style={styles.permissionAction} onPress={() => void openGallery()}>
          <Text style={styles.permissionActionText}>Galeriden seç</Text>
        </Pressable>
      </View>
    );
  }

  if (!cameraPermission) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <Pressable onPress={handleClose} style={[styles.closeBtn, { top: insets.top + spacing.sm }]}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
        <Text style={styles.permissionTitle}>Kamera izni gerekli</Text>
        <Text style={styles.permissionText}>
          Fotoğraf çekmek için kamera erişimine izin ver. Ayarlardan istediğin zaman kapatabilirsin.
        </Text>
        <Pressable style={styles.permissionAction} onPress={() => void requestCameraPermission()}>
          <Text style={styles.permissionActionText}>İzin ver</Text>
        </Pressable>
        <Pressable style={styles.permissionSecondary} onPress={() => void openGallery()}>
          <Text style={styles.permissionSecondaryText}>Galeriden seç</Text>
        </Pressable>
      </View>
    );
  }

  const frameAspect = contentMode === 'story' ? 9 / 16 : 1;

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />

      {contentMode === 'story' && (
        <View style={styles.storyOverlay} pointerEvents="none">
          <View style={styles.storyOverlayTop} />
          <View style={[styles.storyFrame, { aspectRatio: frameAspect }]} />
          <View style={styles.storyOverlayBottom} />
        </View>
      )}

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        <View style={styles.modeToggle}>
          <Pressable
            style={[styles.modeBtn, contentMode === 'post' && styles.modeBtnActive]}
            onPress={() => setContentMode('post')}
          >
            <Text style={[styles.modeBtnText, contentMode === 'post' && styles.modeBtnTextActive]}>
              Gönderi
            </Text>
          </Pressable>
          <Pressable
            style={[styles.modeBtn, contentMode === 'story' && styles.modeBtnActive]}
            onPress={() => setContentMode('story')}
          >
            <Text style={[styles.modeBtnText, contentMode === 'story' && styles.modeBtnTextActive]}>
              Hikaye
            </Text>
          </Pressable>
        </View>

        <View style={styles.topBarSpacer} />
      </View>

      <Text style={[styles.title, { top: insets.top + spacing.sm + 44 }]}>
        Yeni gönderi
      </Text>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={styles.galleryBtn}
          onPress={() => void openGallery()}
        >
          <View style={styles.galleryPlaceholder}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </View>
        </Pressable>

        <Pressable
          style={styles.captureOuter}
          onPress={() => void takePhoto()}
          disabled={capturing}
        >
          <View style={[styles.captureInner, capturing && styles.captureInnerActive]} />
        </Pressable>

        <Pressable
          style={styles.flipBtn}
          onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
        >
          <Ionicons name="camera-reverse-outline" size={32} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const BAR_SIDE = 52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionAction: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 10,
  },
  permissionActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  permissionSecondary: {
    paddingVertical: spacing.sm,
  },
  permissionSecondaryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  iconBtn: {
    width: BAR_SIDE,
    alignItems: 'flex-start',
  },
  topBarSpacer: {
    width: BAR_SIDE,
  },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 3,
  },
  modeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 18,
  },
  modeBtnActive: {
    backgroundColor: '#fff',
  },
  modeBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  modeBtnTextActive: {
    color: '#000',
  },
  title: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    zIndex: 10,
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  storyOverlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  storyFrame: {
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  storyOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  galleryBtn: {
    width: BAR_SIDE,
    height: BAR_SIDE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  galleryPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  captureInnerActive: {
    opacity: 0.5,
    transform: [{ scale: 0.92 }],
  },
  flipBtn: {
    width: BAR_SIDE,
    height: BAR_SIDE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImageWrap: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    maxHeight: '100%',
  },
  previewImageSquare: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: '100%',
  },
  previewTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  shareBtn: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  previewBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.75)',
    gap: spacing.sm,
  },
  captionInput: {
    color: colors.text,
    fontSize: 16,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  locationBtnText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  locationInput: {
    color: colors.text,
    fontSize: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
});
