import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { CreateMenuModal } from '@/components/CreateMenuModal';
import { VibeLogo } from '@/components/VibeLogo';
import { TabHeaderProvider, useTabHeader } from '@/context/TabHeaderContext';
import { useUser } from '@/context/UserContext';

const ACTIVE_COLOR = '#378ADD';
const INACTIVE_COLOR = '#ffffff';
const HEART_ACTIVE = '#ff3040';

const TAB_TITLES: Record<string, string> = {
  explore: 'Keşfet',
  messages: 'Mesajlar',
  profile: 'Profil',
};

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

function TabHeaderLeft() {
  const { openCreateMenu } = useTabHeader();

  return (
    <Pressable onPress={openCreateMenu} hitSlop={8} style={styles.headerBtn}>
      <Ionicons name="add-outline" size={28} color="#ffffff" />
    </Pressable>
  );
}

function TabHeaderTitle({ routeName }: { routeName: string }) {
  const { scrollToTop } = useTabHeader();

  if (routeName === 'index') {
    return (
      <Pressable onPress={scrollToTop} hitSlop={8}>
        <VibeLogo size="sm" />
      </Pressable>
    );
  }

  const title = TAB_TITLES[routeName];
  if (!title) return null;

  return <Text style={styles.headerTitleText}>{title}</Text>;
}

function TabHeaderRight({ routeName }: { routeName: string }) {
  const router = useRouter();
  const { unreadCount, toggleExploreSearch, openSettings } = useTabHeader();

  if (routeName === 'index') {
    const hasUnread = unreadCount > 0;
    const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

    return (
      <Pressable
        onPress={() => router.push('/(tabs)/notifications')}
        hitSlop={8}
        style={styles.headerBtn}
      >
        <View style={styles.heartWrap}>
          <Ionicons
            name={hasUnread ? 'heart' : 'heart-outline'}
            size={26}
            color={hasUnread ? HEART_ACTIVE : '#ffffff'}
          />
          {hasUnread && (
            <View style={styles.heartBadge}>
              <Text style={styles.heartBadgeText}>{badgeLabel}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  if (routeName === 'explore') {
    return (
      <Pressable onPress={toggleExploreSearch} hitSlop={8} style={styles.headerBtn}>
        <Ionicons name="search-outline" size={24} color="#ffffff" />
      </Pressable>
    );
  }

  if (routeName === 'messages') {
    return (
      <Pressable
        onPress={() => router.push('/characters')}
        hitSlop={8}
        style={styles.headerBtn}
      >
        <Ionicons name="create-outline" size={24} color="#ffffff" />
      </Pressable>
    );
  }

  if (routeName === 'profile') {
    return (
      <Pressable onPress={openSettings} hitSlop={8} style={styles.headerBtn}>
        <Ionicons name="settings-outline" size={24} color="#ffffff" />
      </Pressable>
    );
  }

  return null;
}

function GlobalCreateMenu() {
  const router = useRouter();
  const { createMenuVisible, closeCreateMenu } = useTabHeader();

  const openCreate = () => {
    closeCreateMenu();
    router.push('/(tabs)/create');
  };

  return (
    <CreateMenuModal
      visible={createMenuVisible}
      onClose={closeCreateMenu}
      onPost={openCreate}
      onStory={openCreate}
    />
  );
}

function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={({ route }) => {
          const showHeader = ['index', 'explore', 'messages', 'profile'].includes(route.name);

          return {
            headerShown: showHeader,
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#ffffff',
            headerTitleStyle: { color: '#ffffff', fontWeight: '700' },
            headerShadowVisible: false,
            headerTitleAlign: 'center',
            headerLeft: () => <TabHeaderLeft />,
            headerTitle: () => <TabHeaderTitle routeName={route.name} />,
            headerRight: () => <TabHeaderRight routeName={route.name} />,
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
          };
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Akış' }} />
        <Tabs.Screen name="explore" options={{ title: 'Keşfet' }} />
        <Tabs.Screen name="messages" options={{ title: 'Mesajlar' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="create" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="notifications" options={{ href: null, headerShown: false }} />
        <Tabs.Screen name="search" options={{ href: null, headerShown: false }} />
      </Tabs>
      <GlobalCreateMenu />
    </>
  );
}

export default function TabLayout() {
  return (
    <TabHeaderProvider>
      <TabsLayout />
    </TabHeaderProvider>
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
  headerBtn: { padding: 2 },
  headerTitleText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  heartWrap: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: HEART_ACTIVE,
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  heartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
