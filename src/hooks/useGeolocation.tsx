import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

const defaultOptions: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minutes cache
};

export const useGeolocation = (options: GeolocationOptions = {}) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const mergedOptions = { ...defaultOptions, ...options };

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé. Veuillez activer la géolocalisation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible. Vérifiez votre connexion GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé. Réessayez.';
            break;
        }
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      mergedOptions
    );
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  // Watch position for continuous updates
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La géolocalisation n\'est pas supportée par ce navigateur',
      }));
      return null;
    }

    setState(prev => ({ ...prev, loading: true }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = 'Erreur de géolocalisation';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Accès à la localisation refusé';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé';
            break;
        }
        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
      },
      mergedOptions
    );

    return watchId;
  }, [mergedOptions.enableHighAccuracy, mergedOptions.timeout, mergedOptions.maximumAge]);

  const clearWatch = useCallback((watchId: number | null) => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
};

// Calculate distance between two points in kilometers (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg: number): number => deg * (Math.PI / 180);

// Format distance for display
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

// Get saved location from localStorage
export const getSavedLocation = (): { latitude: number; longitude: number } | null => {
  const saved = localStorage.getItem('userLocation');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
};

// Save location to localStorage
export const saveLocation = (latitude: number, longitude: number): void => {
  localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude }));
};
