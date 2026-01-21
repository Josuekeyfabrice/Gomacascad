import { useEffect, useRef, useState } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class OptimizedCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 50; // Maximum number of cache entries

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const globalCache = new OptimizedCache();

export const useOptimizedCache = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number; // Time to live in milliseconds (default: 5 minutes)
    skipCache?: boolean;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const fetchData = async () => {
      try {
        // Check cache first
        if (!options.skipCache && globalCache.has(key)) {
          const cachedData = globalCache.get<T>(key);
          if (isMountedRef.current) {
            setData(cachedData);
            setLoading(false);
          }
          return;
        }

        // Fetch fresh data
        const freshData = await fetchFn();

        if (isMountedRef.current) {
          // Store in cache
          globalCache.set(key, freshData, options.ttl || 5 * 60 * 1000);
          setData(freshData);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          
          // Try to use stale cache on error
          const staleData = globalCache.get<T>(key);
          if (staleData) {
            setData(staleData);
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, [key, fetchFn, options]);

  const invalidateCache = () => {
    globalCache.clear();
  };

  return { data, loading, error, invalidateCache };
};

export { globalCache };
