import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Product } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, X, Loader2, Settings } from 'lucide-react';
import { useGeolocation, getSavedLocation, saveLocation, formatDistance, calculateDistance } from '@/hooks/useGeolocation';
import { useNavigate } from 'react-router-dom';

interface ProductMapProps {
  products: Product[];
  className?: string;
}

const DEFAULT_CENTER: [number, number] = [29.2285, -1.6777]; // Goma, DRC
const DEFAULT_ZOOM = 12;

// Mapbox public token - users should add their own
const MAPBOX_TOKEN_KEY = 'mapbox_token';

export const ProductMap = ({ products, className = '' }: ProductMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const navigate = useNavigate();
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(() => 
    localStorage.getItem(MAPBOX_TOKEN_KEY) || ''
  );
  const [tempToken, setTempToken] = useState(mapboxToken);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { 
    latitude: userLat, 
    longitude: userLng, 
    loading: geoLoading,
    getCurrentPosition 
  } = useGeolocation();

  // Get user location
  const userLocation = useMemo(() => {
    if (userLat && userLng) return { lat: userLat, lng: userLng };
    const saved = getSavedLocation();
    return saved ? { lat: saved.latitude, lng: saved.longitude } : null;
  }, [userLat, userLng]);

  // Filter products with valid coordinates
  const geoProducts = useMemo(() => 
    products.filter(p => p.latitude && p.longitude),
    [products]
  );

  // Calculate distance for each product
  const productsWithDistance = useMemo(() => {
    if (!userLocation) return geoProducts.map(p => ({ ...p, distance: null }));
    return geoProducts.map(p => ({
      ...p,
      distance: calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        p.latitude!, 
        p.longitude!
      )
    })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [geoProducts, userLocation]);

  const saveToken = useCallback(() => {
    localStorage.setItem(MAPBOX_TOKEN_KEY, tempToken);
    setMapboxToken(tempToken);
    setShowSettings(false);
    // Reload to apply token
    window.location.reload();
  }, [tempToken]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      const center: [number, number] = userLocation 
        ? [userLocation.lng, userLocation.lat]
        : DEFAULT_CENTER;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: DEFAULT_ZOOM,
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({ visualizePitch: true }),
        'top-right'
      );

      map.current.on('load', () => {
        setMapLoaded(true);
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, userLocation]);

  // Add markers for products
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add user location marker
    if (userLocation) {
      const userMarker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="p-2 font-semibold">Votre position</div>'))
        .addTo(map.current);
      markersRef.current.push(userMarker);
    }

    // Add product markers
    productsWithDistance.forEach(product => {
      if (!product.latitude || !product.longitude) return;

      const el = document.createElement('div');
      el.className = 'product-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #f97316, #ea580c);
        border-radius: 50%;
        border: 3px solid white;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([product.longitude, product.latitude])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedProduct(product);
        map.current?.flyTo({
          center: [product.longitude!, product.latitude!],
          zoom: 15,
        });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (productsWithDistance.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat]);
      }
      
      productsWithDistance.forEach(p => {
        if (p.latitude && p.longitude) {
          bounds.extend([p.longitude, p.latitude]);
        }
      });

      map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  }, [productsWithDistance, mapLoaded, userLocation]);

  // Center on user location
  const centerOnUser = useCallback(() => {
    if (!userLocation || !map.current) {
      getCurrentPosition();
      return;
    }
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 14,
    });
    if (userLat && userLng) {
      saveLocation(userLat, userLng);
    }
  }, [userLocation, getCurrentPosition, userLat, userLng]);

  if (!mapboxToken) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Configuration de la carte</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pour afficher la carte, entrez votre token Mapbox public
            </p>
          </div>
          <div className="max-w-md mx-auto space-y-3">
            <Input
              placeholder="pk.eyJ1IjoiLi4uIiwiYSI6Ii4uLiJ9..."
              value={tempToken}
              onChange={(e) => setTempToken(e.target.value)}
            />
            <Button onClick={saveToken} disabled={!tempToken}>
              Enregistrer
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
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden"
      />

      {/* Controls overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={centerOnUser}
          disabled={geoLoading}
          className="shadow-lg"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="ml-2 hidden sm:inline">Ma position</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowSettings(!showSettings)}
          className="shadow-lg"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <Card className="absolute top-3 left-24 p-3 shadow-lg z-10 w-64">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Token Mapbox</span>
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              size={10}
              value={tempToken}
              onChange={(e) => setTempToken(e.target.value)}
              placeholder="pk.eyJ1..."
              className="text-xs"
            />
            <Button size="sm" onClick={saveToken} className="w-full">
              Mettre à jour
            </Button>
          </div>
        </Card>
      )}

      {/* Product count badge */}
      <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-3 py-1.5 rounded-full shadow text-sm">
        <span className="font-semibold">{geoProducts.length}</span> produits sur la carte
      </div>

      {/* Selected product card */}
      {selectedProduct && (
        <Card className="absolute bottom-3 right-3 left-3 md:left-auto md:w-80 p-3 shadow-lg">
          <button 
            onClick={() => setSelectedProduct(null)}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3">
            {selectedProduct.images?.[0] && (
              <img 
                src={selectedProduct.images[0]} 
                alt="" 
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{selectedProduct.name}</h4>
              <p className="text-primary font-bold">${selectedProduct.price}</p>
              {(selectedProduct as any).distance && (
                <p className="text-xs text-muted-foreground">
                  À {formatDistance((selectedProduct as any).distance)}
                </p>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full mt-2"
            onClick={() => navigate(`/product/${selectedProduct.id}`)}
          >
            Voir le produit
          </Button>
        </Card>
      )}
    </div>
  );
};
