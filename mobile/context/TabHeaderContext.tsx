import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type TabHeaderActions = {
  scrollToTop: (() => void) | null;
};

type TabHeaderContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  createMenuVisible: boolean;
  openCreateMenu: () => void;
  closeCreateMenu: () => void;
  exploreSearchOpen: boolean;
  toggleExploreSearch: () => void;
  registerActions: (actions: Partial<TabHeaderActions>) => void;
  scrollToTop: () => void;
};

const TabHeaderContext = createContext<TabHeaderContextValue | null>(null);

export function TabHeaderProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [createMenuVisible, setCreateMenuVisible] = useState(false);
  const [exploreSearchOpen, setExploreSearchOpen] = useState(false);
  const actionsRef = useRef<TabHeaderActions>({
    scrollToTop: null,
  });

  const registerActions = useCallback((actions: Partial<TabHeaderActions>) => {
    actionsRef.current = { ...actionsRef.current, ...actions };
  }, []);

  const openCreateMenu = useCallback(() => setCreateMenuVisible(true), []);
  const closeCreateMenu = useCallback(() => setCreateMenuVisible(false), []);
  const toggleExploreSearch = useCallback(() => setExploreSearchOpen((v) => !v), []);

  const scrollToTop = useCallback(() => {
    actionsRef.current.scrollToTop?.();
  }, []);

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      createMenuVisible,
      openCreateMenu,
      closeCreateMenu,
      exploreSearchOpen,
      toggleExploreSearch,
      registerActions,
      scrollToTop,
    }),
    [
      unreadCount,
      createMenuVisible,
      exploreSearchOpen,
      openCreateMenu,
      closeCreateMenu,
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
