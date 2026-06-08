import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useUser } from '@/context/UserContext';
import { colors } from '@/lib/theme';

export default function Index() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
