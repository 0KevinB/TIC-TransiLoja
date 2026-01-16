import { useEffect, useState, useRef, useCallback } from 'react'
import type { Query, DocumentData } from 'firebase/firestore'
import { getDocs } from 'firebase/firestore'

interface CacheEntry<T> {
  data: T[]
  timestamp: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds (default: 5 minutes)
  forceRefresh?: boolean
}

// Global cache storage (persists across component remounts)
const cache = new Map<string, CacheEntry<any>>()

/**
 * Hook to cache Firestore query results in memory
 * Reduces redundant network requests and improves performance
 *
 * @param query - Firestore query to execute
 * @param cacheKey - Unique key for this query in the cache
 * @param options - Cache configuration options
 * @returns Object with data, loading state, error, and refresh function
 *
 * @example
 * const { data: buses, loading, error, refresh } = useFirestoreCache(
 *   query(collection(db, "buses"), limit(50)),
 *   "buses-page-1",
 *   { ttl: 5 * 60 * 1000 } // 5 minutes
 * )
 */
export function useFirestoreCache<T = DocumentData>(
  query: Query | null,
  cacheKey: string,
  options: CacheOptions = {}
) {
  const { ttl = 5 * 60 * 1000, forceRefresh = false } = options // Default: 5 minutes TTL

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const queryRef = useRef(query)
  const isMountedRef = useRef(true)

  // Update query ref when it changes
  useEffect(() => {
    queryRef.current = query
  }, [query])

  const fetchData = useCallback(async (force = false) => {
    if (!queryRef.current) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const now = Date.now()
      const cached = cache.get(cacheKey)

      // Check if we have valid cached data
      if (!force && !forceRefresh && cached && (now - cached.timestamp) < ttl) {
        setData(cached.data)
        setLoading(false)
        return
      }

      // Fetch fresh data
      const snapshot = await getDocs(queryRef.current)
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]

      // Update cache
      cache.set(cacheKey, {
        data: results,
        timestamp: now
      })

      if (isMountedRef.current) {
        setData(results)
        setLoading(false)
      }
    } catch (err) {
      console.error(`Error fetching data for key "${cacheKey}":`, err)
      if (isMountedRef.current) {
        setError(err as Error)
        setLoading(false)
      }
    }
  }, [cacheKey, ttl, forceRefresh])

  // Fetch data on mount or when dependencies change
  useEffect(() => {
    isMountedRef.current = true
    fetchData()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchData])

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  return { data, loading, error, refresh }
}

/**
 * Invalidate cache for a specific key or all keys matching a pattern
 */
export function invalidateCache(keyOrPattern: string | RegExp) {
  if (typeof keyOrPattern === 'string') {
    cache.delete(keyOrPattern)
  } else {
    // Remove all keys matching the pattern
    const keysToDelete: string[] = []
    cache.forEach((_, key) => {
      if (keyOrPattern.test(key)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => cache.delete(key))
  }
}

/**
 * Clear entire cache
 */
export function clearCache() {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      itemCount: value.data.length,
      age: Date.now() - value.timestamp,
      timestamp: new Date(value.timestamp).toISOString()
    }))
  }
}
