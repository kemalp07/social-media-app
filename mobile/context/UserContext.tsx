import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import * as api from '@/lib/api';
import { clearStoredUserId, getStoredUserId, setStoredUserId } from '@/lib/storage';
import type { User } from '@/lib/types';

interface UserContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  register: (username: string, displayName: string) => Promise<void>;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const userId = await getStoredUserId();
    if (!userId) {
      setUser(null);
      return;
    }
    try {
      const data = await api.getUser(userId);
      setUser(data);
    } catch {
      await clearStoredUserId();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const register = async (username: string, displayName: string) => {
    const data = await api.createUser(username, displayName);
    await setStoredUserId(data.id);
    setUser(data);
  };

  const login = async (username: string) => {
    const data = await api.getUserByUsername(username);
    await setStoredUserId(data.id);
    setUser(data);
  };

  const logout = async () => {
    await clearStoredUserId();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, register, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
