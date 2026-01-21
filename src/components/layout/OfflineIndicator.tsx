import { useOfflineMode } from '@/hooks/useOfflineMode';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export const OfflineIndicator = () => {
  const { isOnline } = useOfflineMode();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when going offline
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Hide after 3 seconds when coming back online
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-center gap-2 transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Connexion rétablie</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Mode hors-ligne - Les données en cache sont disponibles</span>
        </>
      )}
    </div>
  );
};
