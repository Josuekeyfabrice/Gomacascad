import { useState, useEffect, useCallback } from 'react';

export const useOfflineMode = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedData, setCachedData] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheData = useCallback((key: string, data: any, ttl: number = 3600000) => {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      setCachedData(prev => ({ ...prev, [key]: data }));
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  const getCachedData = useCallback((key: string) => {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      
      // Check if cache has expired
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }
  }, []);

  const clearCache = useCallback((key?: string) => {
    try {
      if (key) {
        localStorage.removeItem(`cache_${key}`);
        setCachedData(prev => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      } else {
        // Clear all cache
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith('cache_')) {
            localStorage.removeItem(k);
          }
        });
        setCachedData({});
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }, []);

  return {
    isOnline,
    cachedData,
    cacheData,
    getCachedData,
    clearCache,
    registerServiceWorker,
  };
};
