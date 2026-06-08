import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { StoryViewersSheet } from '@/components/StoryViewersSheet';
import { colors, spacing } from '@/constants/colors';
import { useUser } from '@/context/UserContext';
import * as api from '@/lib/api';
import {
  buildStoryBundles,
  findBundleIndex,
  type StoryBundle,
} from '@/lib/stories';
import type { FakeUser } from '@/lib/types';

const STORY_DURATION = 5000;
const FADE_MS = 150;
const QUICK_REACTIONS = ['❤️', '😍', '🔥', '😂'] as const;
const OWN_VIEWER_COUNT = 247;

function getPrefetchUrls(
  bundles: StoryBundle[],
  bundleIndex: number,
  slideIndex: number
): string[] {
  const urls = new Set<string>();
  const bundle = bundles[bundleIndex];
  if (!bundle) return [];

  const current = bundle.slides[slideIndex]?.image_url;
  if (current) urls.add(current);

  if (slideIndex < bundle.slides.length - 1) {
    urls.add(bundle.slides[slideIndex + 1].image_url);
  } else if (bundleIndex < bundles.length - 1) {
    urls.add(bundles[bundleIndex + 1].slides[0]?.image_url);
  }

  if (slideIndex > 0) {
    urls.add(bundle.slides[slideIndex - 1].image_url);
  } else if (bundleIndex > 0) {
    const prevBundle = bundles[bundleIndex - 1];
    const lastSlide = prevBundle.slides[prevBundle.slides.length - 1];
    if (lastSlide) urls.add(lastSlide.image_url);
  }

  return [...urls].filter(Boolean);
}

function ProgressBars({
  total,
  current,
  progress,
}: {
  total: number;
  current: number;
  progress: Animated.Value;
}) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, index) => (
        <View key={index} style={styles.progressTrack}>
          {index < current ? (
            <View style={[styles.progressFill, styles.progressFull]} />
          ) : index === current ? (
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function FloatingReaction({ emoji }: { emoji: string }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    translateY.setValue(0);
    opacity.setValue(1);
    scale.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [emoji, opacity, scale, translateY]);

  return (
    <Animated.Text
      style={[
        styles.floatingReaction,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

export default function StoryViewerScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const [characters, setCharacters] = useState<FakeUser[]>([]);
  const [bundles, setBundles] = useState<StoryBundle[]>([]);
  const [bundleIndex, setBundleIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [holdPaused, setHoldPaused] = useState(false);
  const [message, setMessage] = useState('');
  const [viewersOpen, setViewersOpen] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<string | null>(null);
  const [floatingKey, setFloatingKey] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedAtRef = useRef(0);
  const pendingFadeInRef = useRef(false);
  const isTransitioningRef = useRef(false);

  const paused = holdPaused || keyboardOpen || viewersOpen;

  useEffect(() => {
    api.getTier1Characters().then(setCharacters).catch(() => setCharacters([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    const nextBundles = buildStoryBundles(user, characters);
    setBundles(nextBundles);
    if (userId) {
      setBundleIndex(findBundleIndex(nextBundles, userId));
      setSlideIndex(0);
    }
  }, [user, characters, userId]);

  const bundle = bundles[bundleIndex];
  const slide = bundle?.slides[slideIndex];

  const fadeIn = useCallback(() => {
    pendingFadeInRef.current = false;
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      isTransitioningRef.current = false;
    });
  }, [fadeAnim]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    if (pendingFadeInRef.current) {
      fadeIn();
    }
  }, [fadeIn]);

  useEffect(() => {
    if (!slide?.image_url) return;
    setImageLoaded(false);
    pendingFadeInRef.current = true;
    fadeAnim.setValue(0);

    getPrefetchUrls(bundles, bundleIndex, slideIndex).forEach((url) => {
      void Image.prefetch(url).catch(() => undefined);
    });

    const fallback = setTimeout(() => {
      if (pendingFadeInRef.current) {
        fadeIn();
      }
    }, 400);

    return () => clearTimeout(fallback);
  }, [slide?.image_url, bundleIndex, slideIndex, bundles, fadeAnim, fadeIn]);

  const closeViewer = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  const fadeTransition = useCallback(
    (onSwap: () => void) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: FADE_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        onSwap();
      });
    },
    [fadeAnim]
  );

  const goNext = useCallback(() => {
    if (!bundle) return;

    if (slideIndex < bundle.slides.length - 1) {
      fadeTransition(() => setSlideIndex((i) => i + 1));
      return;
    }

    if (bundleIndex < bundles.length - 1) {
      fadeTransition(() => {
        setBundleIndex((i) => i + 1);
        setSlideIndex(0);
      });
      return;
    }

    closeViewer();
  }, [fadeTransition, bundle, bundleIndex, bundles.length, closeViewer, slideIndex]);

  const goPrev = useCallback(() => {
    if (slideIndex > 0) {
      fadeTransition(() => setSlideIndex((i) => i - 1));
      return;
    }

    if (bundleIndex > 0) {
      fadeTransition(() => {
        const prevIndex = bundleIndex - 1;
        setBundleIndex(prevIndex);
        setSlideIndex(Math.max(bundles[prevIndex].slides.length - 1, 0));
      });
    }
  }, [fadeTransition, bundleIndex, bundles, slideIndex]);

  const startProgress = useCallback(
    (fromValue = 0) => {
      timerRef.current?.stop();
      progressAnim.setValue(fromValue);
      const remaining = (1 - fromValue) * STORY_DURATION;
      if (remaining <= 0) {
        goNext();
        return;
      }
      timerRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: remaining,
        easing: Easing.linear,
        useNativeDriver: false,
      });
      timerRef.current.start(({ finished }) => {
        if (finished) goNext();
      });
    },
    [goNext, progressAnim]
  );

  const pauseProgress = useCallback(() => {
    timerRef.current?.stop();
    progressAnim.stopAnimation((value) => {
      pausedAtRef.current = value;
    });
    setHoldPaused(true);
  }, [progressAnim]);

  const resumeProgress = useCallback(() => {
    setHoldPaused(false);
  }, []);

  useEffect(() => {
    pausedAtRef.current = 0;
  }, [bundleIndex, slideIndex]);

  useEffect(() => {
    if (!bundle) return;

    if (paused) {
      timerRef.current?.stop();
      progressAnim.stopAnimation((value) => {
        pausedAtRef.current = value;
      });
      return;
    }

    startProgress(pausedAtRef.current);
    return () => timerRef.current?.stop();
  }, [bundle, bundleIndex, slideIndex, paused, progressAnim, startProgress]);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => pauseProgress(),
      onPanResponderRelease: (_, g) => {
        resumeProgress();
        if (g.dx < -50) {
          goNext();
        } else if (g.dx > 50) {
          goPrev();
        }
      },
      onPanResponderTerminate: () => resumeProgress(),
    })
  ).current;

  const handleReaction = async (emoji: string) => {
    setFloatingEmoji(emoji);
    setFloatingKey((k) => k + 1);
    if (!bundle?.fakeUserId) return;

    try {
      await api.sendStoryReaction(bundle.fakeUserId, emoji);
    } catch {
      // Simülasyon — sessizce devam et
    }
  };

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || !user || !bundle?.fakeUserId) return;

    try {
      const { id: convId } = await api.startConversation(user.id, bundle.fakeUserId);
      await api.sendMessage(convId, user.id, text);
      setMessage('');
      Keyboard.dismiss();
    } catch {
      // Simülasyon — sessizce devam et
    }
  };

  if (!user || !bundle || !slide) {
    return (
      <View style={styles.screen}>
        <StatusBar hidden />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      {...panResponder.panHandlers}
    >
      <StatusBar hidden />

      <Animated.View style={[styles.slideWrap, { opacity: fadeAnim }]}>
        <Image
          source={{ uri: slide.image_url }}
          style={styles.storyImage}
          resizeMode="cover"
          onLoad={handleImageLoad}
        />

        <Pressable
          style={styles.tapLeft}
          onPress={goPrev}
          onPressIn={pauseProgress}
          onPressOut={resumeProgress}
        />
        <Pressable
          style={styles.tapRight}
          onPress={goNext}
          onPressIn={pauseProgress}
          onPressOut={resumeProgress}
        />

        {floatingEmoji && <FloatingReaction key={floatingKey} emoji={floatingEmoji} />}

        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
          <ProgressBars
            total={bundle.slides.length}
            current={slideIndex}
            progress={progressAnim}
          />

          <View style={styles.headerRow}>
            <View style={styles.headerUser}>
              <Avatar uri={bundle.avatarUrl} name={bundle.displayName} size={36} />
              <View>
                <Text style={styles.headerName} numberOfLines={1}>
                  {bundle.displayName}
                </Text>
                <Text style={styles.headerTime}>az önce</Text>
              </View>
            </View>
            <Pressable onPress={closeViewer} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="#ffffff" />
            </Pressable>
          </View>
        </View>

        {bundle.isOwn ? (
          <Pressable
            style={[styles.viewersBtn, { bottom: insets.bottom + spacing.xl }]}
            onPress={() => setViewersOpen(true)}
          >
            <Text style={styles.viewersIcon}>👁</Text>
            <Text style={styles.viewersText}>{OWN_VIEWER_COUNT}</Text>
          </Pressable>
        ) : (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.sm }]}>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Mesaj gönder..."
              placeholderTextColor={colors.textMuted}
              onFocus={() => setKeyboardOpen(true)}
              onBlur={() => setKeyboardOpen(false)}
              onSubmitEditing={() => void handleSendMessage()}
              returnKeyType="send"
            />
            <View style={styles.reactionRow}>
              {QUICK_REACTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => void handleReaction(emoji)}
                  onPressIn={pauseProgress}
                  onPressOut={resumeProgress}
                  hitSlop={8}
                >
                  <Text style={styles.reactionBtn}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </Animated.View>

      <StoryViewersSheet
        visible={viewersOpen}
        onClose={() => setViewersOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  slideWrap: {
    flex: 1,
  },
  storyImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  tapLeft: {
    position: 'absolute',
    left: 0,
    top: 100,
    bottom: 140,
    width: '30%',
    zIndex: 2,
  },
  tapRight: {
    position: 'absolute',
    right: 0,
    top: 100,
    bottom: 140,
    width: '70%',
    zIndex: 2,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
  },
  progressTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  progressFull: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  headerTime: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  floatingReaction: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '40%',
    fontSize: 72,
    zIndex: 20,
  },
  viewersBtn: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    zIndex: 10,
  },
  viewersIcon: {
    fontSize: 16,
  },
  viewersText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    zIndex: 10,
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  reactionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  reactionBtn: {
    fontSize: 28,
  },
});
