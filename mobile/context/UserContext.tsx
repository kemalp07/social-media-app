import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '@/lib/api';
import {
  clearStoredUserId,
  getLocalAvatar,
  getStoredUserId,
  setLocalAvatar,
  setStoredUserId,
} from '@/lib/storage';
import type { User } from '@/lib/types';

interface UserContextValue {
  user: User | null;
  loading: boolean;
  localAvatarUri: string | null;
  refreshUser: () => Promise<void>;
  register: (username: string, displayName: string) => Promise<void>;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  updateLocalAvatar: (uri: string) => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const loadLocalAvatar = useCallback(async (userId: string) => {
    const local = await getLocalAvatar(userId);
    setLocalAvatarUri(local);
  }, []);

  const refreshUser = useCallback(async () => {
    const userId = await getStoredUserId();
    if (!userId) {
      setUser(null);
      setLocalAvatarUri(null);
      return;
    }
    try {
      const data = await api.getUser(userId);
      setUser(data);
      await loadLocalAvatar(userId);
    } catch {
      await clearStoredUserId();
      setUser(null);
      setLocalAvatarUri(null);
    }
  }, [loadLocalAvatar]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const register = async (username: string, displayName: string) => {
    const data = await api.createUser(username, displayName);
    await setStoredUserId(data.id);
    setUser(data);
    await loadLocalAvatar(data.id);
  };

  const login = async (username: string) => {
    const data = await api.getUserByUsername(username);
    await setStoredUserId(data.id);
    setUser(data);
    await loadLocalAvatar(data.id);
  };

  const logout = async () => {
    await clearStoredUserId();
    setUser(null);
    setLocalAvatarUri(null);
  };

  const updateLocalAvatar = useCallback(
    async (uri: string) => {
      if (!user?.id) return;
      await setLocalAvatar(user.id, uri);
      setLocalAvatarUri(uri);
    },
    [user?.id]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      localAvatarUri,
      refreshUser,
      register,
      login,
      logout,
      updateLocalAvatar,
    }),
    [user, loading, localAvatarUri, refreshUser, updateLocalAvatar]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
