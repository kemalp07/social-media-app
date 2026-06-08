import { Tabs, useRouter } from 'expo-router';
import { Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { VibeLogo } from '@/components/VibeLogo';
import { colors } from '@/constants/colors';

const TAB_ICONS = {
  home: require('../../assets/icons/icon_home.png'),
  explore: require('../../assets/icons/icon_explore.png'),
  create: require('../../assets/icons/icon_add_post.png'),
  notifications: require('../../assets/icons/icon_notification.png'),
  messages: require('../../assets/icons/icon_dm.png'),
  profile: require('../../assets/icons/icon_profile.png'),
} as const;

function TabIcon({
  source,
  focused,
  tintColor,
}: {
  source: ImageSourcePropType;
  focused: boolean;
  tintColor: string;
}) {
  return (
    <View style={styles.tabIcon}>
      <Image source={source} style={[styles.tabBarImage, { tintColor }]} />
      {focused && <View style={styles.dot} />}
    </View>
  );
}

function HeaderRight() {
  const router = useRouter();
  return (
    <View style={styles.headerRight}>
      <Pressable onPress={() => router.push('/(tabs)/notifications')} style={styles.iconBtn}>
        <Image
          source={TAB_ICONS.notifications}
          style={[styles.headerImage, { tintColor: colors.text }]}
        />
      </Pressable>
      <Pressable onPress={() => router.push('/(tabs)/messages')} style={styles.iconBtn}>
        <Image
          source={TAB_ICONS.messages}
          style={[styles.headerImage, { tintColor: colors.text }]}
        />
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
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={TAB_ICONS.home} focused={focused} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={TAB_ICONS.explore} focused={focused} tintColor={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <Image source={TAB_ICONS.create} style={[styles.tabBarImage, { tintColor: color }]} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Bildirim',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={TAB_ICONS.notifications} focused={focused} tintColor={color} />
          ),
          headerRight: undefined,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={TAB_ICONS.messages} focused={focused} tintColor={color} />
          ),
          headerRight: undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon source={TAB_ICONS.profile} focused={focused} tintColor={color} />
          ),
          headerRight: undefined,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: { alignItems: 'center' },
  tabBarImage: { width: 24, height: 24 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
  headerRight: { flexDirection: 'row', gap: 8, marginRight: 8 },
  iconBtn: { padding: 6 },
  headerImage: { width: 24, height: 24 },
});
