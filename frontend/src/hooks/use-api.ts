'use client';

import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { AxiosRequestConfig } from 'axios';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (config: AxiosRequestConfig): Promise<T | null> => {
    setState({ data: null, error: null, isLoading: true });
    try {
      const { data } = await api.request<T>(config);
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setState({ data: null, error: message, isLoading: false });
      return null;
    }
  }, []);

  return { ...state, execute };
}
