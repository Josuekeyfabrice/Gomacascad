import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { useGeolocation, saveLocation, getSavedLocation } from '@/hooks/useGeolocation';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GeolocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (lat: number | null, lng: number | null) => void;
}

export const GeolocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange 
}: GeolocationPickerProps) => {
  const { 
    latitude: geoLat, 
    longitude: geoLng, 
    loading: geoLoading, 
    error: geoError,
    getCurrentPosition 
  } = useGeolocation();
  
  const [manualMode, setManualMode] = useState(false);
  const [manualLat, setManualLat] = useState(latitude?.toString() || '');
  const [manualLng, setManualLng] = useState(longitude?.toString() || '');

  // Load saved location on mount
  useEffect(() => {
    if (!latitude && !longitude) {
      const saved = getSavedLocation();
      if (saved) {
        onLocationChange(saved.latitude, saved.longitude);
      }
    }
  }, []);

  // Update location when geolocation succeeds
  useEffect(() => {
    if (geoLat && geoLng) {
      onLocationChange(geoLat, geoLng);
      saveLocation(geoLat, geoLng);
    }
  }, [geoLat, geoLng, onLocationChange]);

  const handleGetLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const handleManualSubmit = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      onLocationChange(lat, lng);
      saveLocation(lat, lng);
      setManualMode(false);
    }
  }, [manualLat, manualLng, onLocationChange]);

  const clearLocation = useCallback(() => {
    onLocationChange(null, null);
    setManualLat('');
    setManualLng('');
  }, [onLocationChange]);

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Localisation GPS (optionnel)
      </Label>

      {geoError && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{geoError}</AlertDescription>
        </Alert>
      )}

      {latitude && longitude ? (
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            <span>Position enregistrée</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Lat:</span>{' '}
              <span className="font-mono">{latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Lng:</span>{' '}
              <span className="font-mono">{longitude.toFixed(6)}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleGetLocation}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Navigation className="h-3 w-3 mr-1" />
              )}
              Actualiser
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={clearLocation}
            >
              Supprimer
            </Button>
          </div>
        </div>
      ) : manualMode ? (
        <div className="space-y-3 p-3 border rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="manual-lat" className="text-xs">Latitude</Label>
              <Input
                id="manual-lat"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="-1.6789"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label htmlFor="manual-lng" className="text-xs">Longitude</Label>
              <Input
                id="manual-lng"
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="29.2345"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              type="button" 
              size="sm"
              onClick={handleManualSubmit}
            >
              Confirmer
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setManualMode(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button 
            type="button" 
            variant="outline"
            onClick={handleGetLocation}
            disabled={geoLoading}
            className="flex-1"
          >
            {geoLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Localisation...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Utiliser ma position
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="ghost"
            onClick={() => setManualMode(true)}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Saisir manuellement
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        La géolocalisation permet aux acheteurs de trouver votre produit plus facilement
      </p>
    </div>
  );
};
