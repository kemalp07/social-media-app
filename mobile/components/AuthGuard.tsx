import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useUser } from '@/context/UserContext';
import { colors } from '@/lib/theme';

const PUBLIC_ROUTES = new Set(['login', 'onboarding']);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  const root = segments[0] ?? '';
  const isPublic = PUBLIC_ROUTES.has(root);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublic) {
      router.replace('/onboarding');
      return;
    }

    if (user && isPublic) {
      router.replace('/(tabs)');
    }
  }, [user, loading, isPublic, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user && !isPublic) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <>{children}</>;
}
