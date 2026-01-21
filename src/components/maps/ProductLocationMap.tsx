import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductLocationMapProps {
  latitude: number;
  longitude: number;
  productName: string;
  city: string;
  address?: string;
}

const ProductLocationMap = ({ 
  latitude, 
  longitude, 
  productName, 
  city, 
  address 
}: ProductLocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  useEffect(() => {
    // Try to get token from localStorage
    const savedToken = localStorage.getItem('mapbox_token');
    if (savedToken) {
      setMapboxToken(savedToken);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !latitude || !longitude) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker for product location
    marker.current = new mapboxgl.Marker({ color: '#2d8a5b' })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<strong>${productName}</strong><br/>${city}${address ? `, ${address}` : ''}`)
      )
      .addTo(map.current);

    return () => {
      marker.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken, latitude, longitude, productName, city, address]);

  const handleTokenSubmit = () => {
    if (mapboxToken) {
      localStorage.setItem('mapbox_token', mapboxToken);
      setShowTokenInput(false);
    }
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  if (!latitude || !longitude) {
    return null;
  }

  if (showTokenInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Entrez votre token public Mapbox pour afficher la carte
          </p>
          <input
            type="text"
            placeholder="pk.eyJ1Ijoi..."
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <Button onClick={handleTokenSubmit} size="sm" className="w-full">
            Activer la carte
          </Button>
          <p className="text-xs text-muted-foreground">
            Obtenez votre token sur{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localisation
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openInGoogleMaps}
            className="gap-1"
          >
            <Navigation className="h-3 w-3" />
            Itinéraire
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          className="w-full h-48 rounded-b-lg"
        />
      </CardContent>
    </Card>
  );
};

export default ProductLocationMap;
