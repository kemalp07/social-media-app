import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { VibeLogo } from '@/components/VibeLogo';
import { colors } from '@/constants/colors';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      {focused && <View style={styles.dot} />}
    </View>
  );
}

function HeaderRight() {
  const router = useRouter();
  return (
    <View style={styles.headerRight}>
      <Pressable onPress={() => router.push('/(tabs)/notifications')} style={styles.iconBtn}>
        <Text style={styles.headerIcon}>🔔</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/(tabs)/messages')} style={styles.iconBtn}>
        <Text style={styles.headerIcon}>💬</Text>
      </Pressable>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitle: () => <VibeLogo size="sm" />,
        headerRight: () => <HeaderRight />,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Akış',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.createBtn}>
              <Text style={styles.createIcon}>+</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Bildirim',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔔" focused={focused} />,
          headerRight: undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          headerRight: undefined,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center' },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  createIcon: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  headerRight: { flexDirection: 'row', gap: 8, marginRight: 8 },
  iconBtn: { padding: 6 },
  headerIcon: { fontSize: 20 },
});
