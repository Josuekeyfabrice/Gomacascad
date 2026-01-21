import { useState, useEffect, useCallback } from 'react';
import { MapPin, Navigation, Loader2, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGeolocation, getSavedLocation, saveLocation } from '@/hooks/useGeolocation';
import { useLocationPreferences } from '@/hooks/useLocationPreferences';
import { useToast } from '@/hooks/use-toast';

interface LocationFilterProps {
  onLocationChange: (location: { latitude: number; longitude: number } | null, radius: number) => void;
  currentRadius: number;
}

export const LocationFilter = ({ onLocationChange, currentRadius }: LocationFilterProps) => {
  const { toast } = useToast();
  const { latitude, longitude, loading, error, getCurrentPosition } = useGeolocation();
  const { 
    preferences, 
    setDefaultRadius, 
    setLocation, 
    setAutoDetect,
    clearLocation 
  } = useLocationPreferences();
  
  const [isOpen, setIsOpen] = useState(false);
  const [radius, setRadius] = useState(currentRadius || preferences.defaultRadius);
  const [hasLocation, setHasLocation] = useState(false);

  // Check for saved location on mount
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setHasLocation(true);
    } else if (preferences.latitude && preferences.longitude) {
      setHasLocation(true);
    }
  }, [preferences.latitude, preferences.longitude]);

  // Update radius from preferences
  useEffect(() => {
    if (preferences.defaultRadius && currentRadius === 0) {
      setRadius(preferences.defaultRadius);
    }
  }, [preferences.defaultRadius, currentRadius]);

  // Update when geolocation is obtained
  useEffect(() => {
    if (latitude && longitude) {
      saveLocation(latitude, longitude);
      setLocation(latitude, longitude);
      setHasLocation(true);
    }
  }, [latitude, longitude, setLocation]);

  const handleEnableLocation = useCallback(() => {
    getCurrentPosition();
  }, [getCurrentPosition]);

  const handleApply = useCallback(() => {
    let location = getSavedLocation();
    
    if (!location && preferences.latitude && preferences.longitude) {
      location = { latitude: preferences.latitude, longitude: preferences.longitude };
    }
    
    if (!location && latitude && longitude) {
      location = { latitude, longitude };
    }
    
    if (location) {
      onLocationChange(location, radius);
      toast({
        title: 'Localisation activée',
        description: `Affichage des produits dans un rayon de ${radius} km`,
      });
    }
    setIsOpen(false);
  }, [latitude, longitude, radius, onLocationChange, toast, preferences]);

  const handleClear = useCallback(() => {
    onLocationChange(null, 0);
    setHasLocation(false);
    clearLocation();
    localStorage.removeItem('userLocation');
    toast({
      title: 'Localisation désactivée',
      description: 'Tous les produits sont affichés',
    });
    setIsOpen(false);
  }, [onLocationChange, toast, clearLocation]);

  const handleSaveDefaultRadius = useCallback(() => {
    setDefaultRadius(radius);
    toast({
      title: 'Rayon par défaut sauvegardé',
      description: `Le rayon par défaut est maintenant de ${radius} km`,
    });
  }, [radius, setDefaultRadius, toast]);

  const handleAutoDetectChange = useCallback((checked: boolean) => {
    setAutoDetect(checked);
    if (checked) {
      getCurrentPosition();
    }
  }, [setAutoDetect, getCurrentPosition]);

  const locationAvailable = hasLocation || (latitude && longitude) || (preferences.latitude && preferences.longitude);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MapPin className="h-4 w-4" />
          {hasLocation && currentRadius > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {currentRadius} km
            </Badge>
          ) : (
            'À proximité'
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rechercher à proximité
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="location" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">Position</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-1" />
              Préférences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-6 py-4">
            {/* Location status */}
            <div className="text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Obtention de votre position...
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <p className="text-sm text-destructive">{error}</p>
                  <Button onClick={handleEnableLocation} variant="outline" size="sm">
                    Réessayer
                  </Button>
                </div>
              ) : locationAvailable ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Navigation className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-sm text-green-600">
                    Position obtenue avec succès
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Activez la localisation pour voir les produits proches de vous
                  </p>
                  <Button onClick={handleEnableLocation} className="mt-2">
                    <Navigation className="h-4 w-4 mr-2" />
                    Activer la localisation
                  </Button>
                </div>
              )}
            </div>

            {/* Radius slider */}
            {locationAvailable && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Rayon de recherche</span>
                  <Badge variant="outline">{radius} km</Badge>
                </div>
                <Slider
                  value={[radius]}
                  onValueChange={([value]) => setRadius(value)}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}

            {/* Actions */}
            {locationAvailable && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClear}>
                  Désactiver
                </Button>
                <Button className="flex-1" onClick={handleApply}>
                  Appliquer
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 py-4">
            {/* Auto-detect toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-detect">Détection automatique</Label>
                <p className="text-xs text-muted-foreground">
                  Obtenir la position au démarrage
                </p>
              </div>
              <Switch
                id="auto-detect"
                checked={preferences.autoDetect}
                onCheckedChange={handleAutoDetectChange}
              />
            </div>

            {/* Default radius */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Rayon par défaut</span>
                <Badge variant="outline">{radius} km</Badge>
              </div>
              <Slider
                value={[radius]}
                onValueChange={([value]) => setRadius(value)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>100 km</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSaveDefaultRadius}
              >
                Sauvegarder comme défaut
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Rayon actuel par défaut: {preferences.defaultRadius} km
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
