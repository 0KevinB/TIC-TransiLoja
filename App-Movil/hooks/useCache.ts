/**
 * Hook personalizado para usar el sistema de caché
 * Facilita el uso del cacheService en componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import { cacheService } from '@/lib/cacheService';

interface UseCacheOptions<T> {
  key: string;
  fetchFunction: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  dependencies?: any[];
}

interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => Promise<void>;
}

/**
 * Hook para gestionar datos con caché automático
 */
export function useCache<T>({
  key,
  fetchFunction,
  ttl,
  enabled = true,
  dependencies = [],
}: UseCacheOptions<T>): UseCacheReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Usar getOrSet del cacheService
      const cachedData = await cacheService.getOrSet(key, fetchFunction, ttl);
      setData(cachedData);
    } catch (err) {
      setError(err as Error);
      console.error(`Error loading data for key ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, enabled, ttl, ...dependencies]);

  const refetch = useCallback(async () => {
    await cacheService.remove(key);
    await loadData();
  }, [key, loadData]);

  const invalidate = useCallback(async () => {
    await cacheService.remove(key);
    setData(null);
  }, [key]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Hook simplificado para caché de solo lectura
 */
export function useCachedData<T>(
  key: string,
  defaultValue: T | null = null
): [T | null, (value: T) => Promise<void>] {
  const [data, setData] = useState<T | null>(defaultValue);

  useEffect(() => {
    const loadFromCache = async () => {
      const cached = await cacheService.get<T>(key);
      if (cached !== null) {
        setData(cached);
      }
    };

    loadFromCache();
  }, [key]);

  const updateCache = useCallback(
    async (value: T) => {
      setData(value);
      await cacheService.set(key, value);
    },
    [key]
  );

  return [data, updateCache];
}
