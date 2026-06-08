import { Tabs } from 'expo-router';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';

const TAB_ICONS = {
  home: require('../../assets/icons/icon_home.png'),
  explore: require('../../assets/icons/icon_explore.png'),
  create: require('../../assets/icons/icon_add_post.png'),
  notifications: require('../../assets/icons/icon_notification.png'),
  messages: require('../../assets/icons/icon_dm.png'),
} as const;

const ACTIVE_TINT = '#378ADD';
const INACTIVE_TINT = '#8b8fa3';

function TabBarIcon({ source, focused }: { source: ImageSourcePropType; focused: boolean }) {
  return (
    <Image
      source={source}
      style={{
        width: 24,
        height: 24,
        tintColor: focused ? ACTIVE_TINT : INACTIVE_TINT,
      }}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#000000' },
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Akış',
          tabBarIcon: ({ focused }) => <TabBarIcon source={TAB_ICONS.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ focused }) => <TabBarIcon source={TAB_ICONS.explore} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Yeni',
          tabBarIcon: ({ focused }) => <TabBarIcon source={TAB_ICONS.create} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Bildirim',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon source={TAB_ICONS.notifications} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ focused }) => <TabBarIcon source={TAB_ICONS.messages} focused={focused} />,
        }}
      />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#000000',
    borderTopWidth: 0,
    height: 60,
    paddingBottom: 8,
  },
});
