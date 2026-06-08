import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useUser } from '@/context/UserContext';
import { colors } from '@/constants/colors';

const ACTIVE_COLOR = '#378ADD';
const INACTIVE_COLOR = '#ffffff';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICON_MAP: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  explore: { active: 'compass', inactive: 'compass-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
  messages: { active: 'mail', inactive: 'mail-outline' },
};

function CreateTabButton(_props: BottomTabBarButtonProps) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/(tabs)/create')}
      style={styles.createBtn}
      accessibilityRole="button"
      accessibilityLabel="Yeni gönderi"
    >
      <Ionicons name="add" size={30} color="#ffffff" />
    </Pressable>
  );
}

function TabBarIcon({
  routeName,
  focused,
}: {
  routeName: string;
  focused: boolean;
}) {
  const { user } = useUser();

  if (routeName === 'profile') {
    return (
      <View style={[styles.profileTab, focused && styles.profileTabFocused]}>
        <Avatar uri={user?.avatar_url} name={user?.display_name} size={24} />
      </View>
    );
  }

  const icons = TAB_ICON_MAP[routeName];
  if (!icons) return null;

  return (
    <Ionicons
      name={focused ? icons.active : icons.inactive}
      size={24}
      color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: '#000000' },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarIcon: ({ focused }) => (
          <TabBarIcon routeName={route.name} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Akış' }} />
      <Tabs.Screen name="explore" options={{ title: 'Keşfet' }} />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: (props) => <CreateTabButton {...props} />,
        }}
      />
      <Tabs.Screen name="messages" options={{ title: 'Mesajlar' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Bildirim' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
  },
  createBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  profileTab: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  profileTabFocused: {
    borderWidth: 2,
    borderColor: ACTIVE_COLOR,
  },
});
