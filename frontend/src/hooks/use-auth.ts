'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import api from '@/lib/api';

export function useAuth() {
  const { user, token, isLoading, setAuth, clearAuth, setLoading } = useAuthStore();

  const verify = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setAuth(data.user, token);
    } catch {
      clearAuth();
    }
  }, [token, setAuth, clearAuth, setLoading]);

  useEffect(() => {
    verify();
  }, [verify]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data.user, data.token);
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    role: user?.role ?? null,
    login,
    logout,
  };
}
