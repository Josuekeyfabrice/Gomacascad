import { useState, useEffect, useCallback } from 'react';

interface LocationPreferences {
  defaultRadius: number;
  latitude: number | null;
  longitude: number | null;
  city: string;
  autoDetect: boolean;
}

const DEFAULT_PREFERENCES: LocationPreferences = {
  defaultRadius: 25,
  latitude: null,
  longitude: null,
  city: '',
  autoDetect: true,
};

const STORAGE_KEY = 'location_preferences';

export const useLocationPreferences = () => {
  const [preferences, setPreferences] = useState<LocationPreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading location preferences:', e);
    }
    return DEFAULT_PREFERENCES;
  });

  const updatePreferences = useCallback((updates: Partial<LocationPreferences>) => {
    setPreferences((prev) => {
      const newPrefs = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      } catch (e) {
        console.error('Error saving location preferences:', e);
      }
      return newPrefs;
    });
  }, []);

  const setDefaultRadius = useCallback((radius: number) => {
    updatePreferences({ defaultRadius: radius });
  }, [updatePreferences]);

  const setLocation = useCallback((latitude: number, longitude: number, city?: string) => {
    updatePreferences({ 
      latitude, 
      longitude, 
      city: city || preferences.city 
    });
  }, [updatePreferences, preferences.city]);

  const setCity = useCallback((city: string) => {
    updatePreferences({ city });
  }, [updatePreferences]);

  const setAutoDetect = useCallback((autoDetect: boolean) => {
    updatePreferences({ autoDetect });
  }, [updatePreferences]);

  const clearLocation = useCallback(() => {
    updatePreferences({ 
      latitude: null, 
      longitude: null, 
      city: '' 
    });
  }, [updatePreferences]);

  const resetToDefaults = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Auto-detect location on first load if enabled
  useEffect(() => {
    if (preferences.autoDetect && !preferences.latitude && !preferences.longitude) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updatePreferences({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.log('Geolocation error:', error.message);
          },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      }
    }
  }, [preferences.autoDetect, preferences.latitude, preferences.longitude, updatePreferences]);

  return {
    preferences,
    setDefaultRadius,
    setLocation,
    setCity,
    setAutoDetect,
    clearLocation,
    resetToDefaults,
    updatePreferences,
  };
};

export type { LocationPreferences };
