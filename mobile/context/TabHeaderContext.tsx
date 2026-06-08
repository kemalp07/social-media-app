import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type TabHeaderActions = {
  scrollToTop: (() => void) | null;
};

type TabHeaderContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  dmUnreadCount: number;
  setDmUnreadCount: (count: number) => void;
  createMenuVisible: boolean;
  openCreateMenu: () => void;
  closeCreateMenu: () => void;
  settingsVisible: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  exploreSearchOpen: boolean;
  toggleExploreSearch: () => void;
  registerActions: (actions: Partial<TabHeaderActions>) => void;
  scrollToTop: () => void;
};

const TabHeaderContext = createContext<TabHeaderContextValue | null>(null);

export function TabHeaderProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [createMenuVisible, setCreateMenuVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [exploreSearchOpen, setExploreSearchOpen] = useState(false);
  const actionsRef = useRef<TabHeaderActions>({
    scrollToTop: null,
  });

  const registerActions = useCallback((actions: Partial<TabHeaderActions>) => {
    actionsRef.current = { ...actionsRef.current, ...actions };
  }, []);

  const openCreateMenu = useCallback(() => setCreateMenuVisible(true), []);
  const closeCreateMenu = useCallback(() => setCreateMenuVisible(false), []);
  const openSettings = useCallback(() => setSettingsVisible(true), []);
  const closeSettings = useCallback(() => setSettingsVisible(false), []);
  const toggleExploreSearch = useCallback(() => setExploreSearchOpen((v) => !v), []);

  const scrollToTop = useCallback(() => {
    actionsRef.current.scrollToTop?.();
  }, []);

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      dmUnreadCount,
      setDmUnreadCount,
      createMenuVisible,
      openCreateMenu,
      closeCreateMenu,
      settingsVisible,
      openSettings,
      closeSettings,
      exploreSearchOpen,
      toggleExploreSearch,
      registerActions,
      scrollToTop,
    }),
    [
      unreadCount,
      dmUnreadCount,
      createMenuVisible,
      settingsVisible,
      exploreSearchOpen,
      openCreateMenu,
      closeCreateMenu,
      openSettings,
      closeSettings,
      toggleExploreSearch,
      registerActions,
      scrollToTop,
    ]
  );

  return <TabHeaderContext.Provider value={value}>{children}</TabHeaderContext.Provider>;
}

export function useTabHeader() {
  const ctx = useContext(TabHeaderContext);
  if (!ctx) throw new Error('useTabHeader must be used within TabHeaderProvider');
  return ctx;
}
