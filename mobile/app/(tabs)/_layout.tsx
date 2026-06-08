import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { useUser } from '@/context/UserContext';

const ACTIVE_COLOR = '#378ADD';
const INACTIVE_COLOR = '#ffffff';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICON_MAP: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  explore: { active: 'compass', inactive: 'compass-outline' },
  messages: { active: 'mail', inactive: 'mail-outline' },
};

function TabBarButton(props: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      onPress={props.onPress}
      android_ripple={null}
      hitSlop={0}
    />
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
        tabBarPressColor: 'transparent',
        tabBarPressOpacity: 1,
        tabBarButton: (props) => <TabBarButton {...props} />,
        tabBarIcon: ({ focused }) => (
          <TabBarIcon routeName={route.name} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Akış' }} />
      <Tabs.Screen name="explore" options={{ title: 'Keşfet' }} />
      <Tabs.Screen name="messages" options={{ title: 'Mesajlar' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 0,
    height: 56,
    paddingBottom: 6,
    paddingTop: 4,
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
