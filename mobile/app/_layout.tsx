import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { UserProvider } from '@/context/UserContext';
import { colors } from '@/lib/theme';

export default function RootLayout() {
  return (
    <UserProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Gönderi' }} />
        <Stack.Screen name="chat/[id]" options={{ title: 'Mesajlar' }} />
        <Stack.Screen name="characters" options={{ title: 'Karakterler' }} />
      </Stack>
    </UserProvider>
  );
}
