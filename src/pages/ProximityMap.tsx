import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/types/database';
import { MapPin, Navigation, Filter, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/types/database';

const ProximityMap = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState(5); // km
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: "Localisation",
            description: "Impossible d'accéder à votre position. Affichage de tous les produits.",
            variant: "destructive",
          });
        }
      );
    }
  }, [toast]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_approved', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter products based on category and distance
  useEffect(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Filter by distance
    if (userLocation && filtered.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          p.latitude,
          p.longitude
        );
        return distance <= maxDistance;
      });
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, maxDistance, userLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              Produits à proximité
            </h1>
            <p className="text-muted-foreground">
              Découvrez les meilleures offres près de chez vous à Goma
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rayon de recherche</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="range"
                      min="1"
                      max="50"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-bold min-w-fit">{maxDistance} km</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Localisation</label>
                  <Button variant="outline" className="w-full" disabled={!userLocation}>
                    <Navigation className="mr-2 h-4 w-4" />
                    {userLocation ? 'Localisation active' : 'Activation...'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {filteredProducts.length === 0 ? (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground mb-2">Aucun produit trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Essayez d'élargir votre rayon de recherche ou de changer de catégorie.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const distance = userLocation && product.latitude && product.longitude
                  ? calculateDistance(
                      userLocation.lat,
                      userLocation.lng,
                      product.latitude,
                      product.longitude
                    ).toFixed(1)
                  : null;

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold line-clamp-2">{product.name}</h3>
                        {distance && (
                          <Badge variant="secondary" className="ml-2 flex-shrink-0">
                            <MapPin className="h-3 w-3 mr-1" />
                            {distance} km
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-2xl font-bold text-primary">{product.price}$</p>
                          {product.original_price && (
                            <p className="text-xs text-muted-foreground line-through">
                              {product.original_price}$
                            </p>
                          )}
                        </div>
                        {product.discount_percentage && (
                          <Badge className="bg-red-500">
                            -{product.discount_percentage}%
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                        <Badge variant="outline">{product.category}</Badge>
                        <Badge variant="outline">{product.city}</Badge>
                      </div>

                      <Button className="w-full gradient-primary text-white" size="sm">
                        Voir les détails
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Conseil :</strong> Activez la localisation pour voir les produits les plus proches de vous. Vous pouvez ajuster le rayon de recherche pour trouver exactement ce que vous cherchez.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProximityMap;
