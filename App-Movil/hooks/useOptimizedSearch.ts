/**
 * Hook optimizado para búsquedas
 * Incluye debounce y filtrado memoizado
 */

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '@/lib/utils/debounce';

interface UseOptimizedSearchOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  debounceMs?: number;
}

interface UseOptimizedSearchReturn<T> {
  query: string;
  setQuery: (query: string) => void;
  filteredData: T[];
  isSearching: boolean;
}

/**
 * Hook para búsquedas optimizadas con debounce
 */
export function useOptimizedSearch<T>({
  data,
  searchKeys,
  debounceMs = 300,
}: UseOptimizedSearchOptions<T>): UseOptimizedSearchReturn<T> {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, debounceMs);

  // Memoizar resultados de búsqueda
  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    const lowerQuery = debouncedQuery.toLowerCase();

    return data.filter((item) => {
      return searchKeys.some((key) => {
        const value = item[key];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [data, debouncedQuery, searchKeys]);

  const isSearching = query !== debouncedQuery;

  return {
    query,
    setQuery,
    filteredData,
    isSearching,
  };
}

/**
 * Hook para búsquedas avanzadas con múltiples filtros
 */
interface UseAdvancedSearchOptions<T> {
  data: T[];
  filters: {
    [key: string]: (item: T, value: any) => boolean;
  };
}

export function useAdvancedSearch<T>({
  data,
  filters,
}: UseAdvancedSearchOptions<T>) {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(activeFilters).every(([key, value]) => {
        const filterFn = filters[key];
        return filterFn ? filterFn(item, value) : true;
      });
    });
  }, [data, activeFilters, filters]);

  const setFilter = useCallback((key: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setActiveFilters((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  return {
    filteredData,
    activeFilters,
    setFilter,
    clearFilter,
    clearAllFilters,
  };
}
