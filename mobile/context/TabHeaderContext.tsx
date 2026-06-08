import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type TabHeaderActions = {
  openCreateMenu: (() => void) | null;
  scrollToTop: (() => void) | null;
};

type TabHeaderContextValue = {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  registerActions: (actions: Partial<TabHeaderActions>) => void;
  openCreateMenu: () => void;
  scrollToTop: () => void;
};

const TabHeaderContext = createContext<TabHeaderContextValue | null>(null);

export function TabHeaderProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const actionsRef = useRef<TabHeaderActions>({
    openCreateMenu: null,
    scrollToTop: null,
  });

  const registerActions = useCallback((actions: Partial<TabHeaderActions>) => {
    actionsRef.current = { ...actionsRef.current, ...actions };
  }, []);

  const openCreateMenu = useCallback(() => {
    actionsRef.current.openCreateMenu?.();
  }, []);

  const scrollToTop = useCallback(() => {
    actionsRef.current.scrollToTop?.();
  }, []);

  const value = useMemo(
    () => ({
      unreadCount,
      setUnreadCount,
      registerActions,
      openCreateMenu,
      scrollToTop,
    }),
    [unreadCount, registerActions, openCreateMenu, scrollToTop]
  );

  return <TabHeaderContext.Provider value={value}>{children}</TabHeaderContext.Provider>;
}

export function useTabHeader() {
  const ctx = useContext(TabHeaderContext);
  if (!ctx) throw new Error('useTabHeader must be used within TabHeaderProvider');
  return ctx;
}
