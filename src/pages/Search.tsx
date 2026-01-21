import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Product, CATEGORIES, CITIES } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { LocationFilter } from '@/components/filters/LocationFilter';
import { ProductMap } from '@/components/maps/ProductMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search as SearchIcon, Filter, X, SlidersHorizontal, ArrowUpDown, MapPin, Grid, Map } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { calculateDistance, formatDistance, getSavedLocation } from '@/hooks/useGeolocation';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaire' },
  { value: 'nearest', label: 'Plus proche' },
];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'recent');
  const [priceRange, setPriceRange] = useState<[number, number]>([
    Number(searchParams.get('minPrice')) || 0,
    Number(searchParams.get('maxPrice')) || 10000000
  ]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(Number(searchParams.get('radius')) || 0);

  // Load saved location on mount
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setUserLocation(saved);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    
    // Determine sort order (skip for 'nearest' as we sort client-side)
    let orderColumn = 'created_at';
    let ascending = false;
    
    switch (sortBy) {
      case 'oldest':
        orderColumn = 'created_at';
        ascending = true;
        break;
      case 'price_asc':
        orderColumn = 'price';
        ascending = true;
        break;
      case 'price_desc':
        orderColumn = 'price';
        ascending = false;
        break;
      case 'popular':
        orderColumn = 'views_count';
        ascending = false;
        break;
      case 'nearest':
        orderColumn = 'created_at';
        ascending = false;
        break;
      default:
        orderColumn = 'created_at';
        ascending = false;
    }

    let queryBuilder = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_approved', true)
      .gte('price', priceRange[0])
      .lte('price', priceRange[1])
      .order(orderColumn, { ascending });

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }
    if (city) {
      queryBuilder = queryBuilder.eq('city', city);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } else {
      setProducts((data as Product[]) || []);
    }
    setLoading(false);
  }, [query, category, city, sortBy, priceRange]);

  const fetchFavorites = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('favorites')
      .select('product_id')
      .eq('user_id', user.id);
    if (data) {
      setFavorites(new Set(data.map(f => f.product_id)));
    }
  };

  const handleFavorite = async (productId: string) => {
    if (!user) return;
    const isFav = favorites.has(productId);
    
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
        setFavorites(prev => { const next = new Set(prev); next.delete(productId); return next; });
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
        setFavorites(prev => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchProducts]);

  // Filter and sort products by distance
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by distance if location is set
    if (userLocation && searchRadius > 0) {
      result = result.filter(product => {
        if (!product.latitude || !product.longitude) return false;
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          product.latitude,
          product.longitude
        );
        return distance <= searchRadius;
      });
    }

    // Sort by distance if that option is selected
    if (sortBy === 'nearest' && userLocation) {
      result.sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return result;
  }, [products, userLocation, searchRadius, sortBy]);

  // Get distance for a product
  const getProductDistance = useCallback((product: Product): string | null => {
    if (!userLocation || !product.latitude || !product.longitude) return null;
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      product.latitude,
      product.longitude
    );
    return formatDistance(distance);
  }, [userLocation]);

  // Count active filters
  const activeFiltersCount = [
    category,
    city,
    priceRange[0] > 0 || priceRange[1] < 10000000,
    searchRadius > 0,
  ].filter(Boolean).length;

  // Handle location change from LocationFilter
  const handleLocationChange = useCallback((location: { latitude: number; longitude: number } | null, radius: number) => {
    setUserLocation(location);
    setSearchRadius(radius);
  }, []);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (city) params.set('city', city);
    if (sortBy !== 'recent') params.set('sort', sortBy);
    if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
    if (priceRange[1] < 10000000) params.set('maxPrice', priceRange[1].toString());
    if (searchRadius > 0) params.set('radius', searchRadius.toString());
    setSearchParams(params);
    fetchProducts();
  }, [query, category, city, sortBy, priceRange, searchRadius, setSearchParams, fetchProducts]);

  const removeFilter = useCallback((filterType: 'category' | 'city' | 'price' | 'location') => {
    switch (filterType) {
      case 'category':
        setCategory('');
        break;
      case 'city':
        setCity('');
        break;
      case 'price':
        setPriceRange([0, 10000000]);
        break;
      case 'location':
        setUserLocation(null);
        setSearchRadius(0);
        break;
    }
    setTimeout(() => handleSearch(), 0);
  }, [handleSearch]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('');
    setCity('');
    setSortBy('recent');
    setPriceRange([0, 10000000]);
    setUserLocation(null);
    setSearchRadius(0);
    setSearchParams({});
    setTimeout(() => fetchProducts(), 0);
  }, [setSearchParams, fetchProducts]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Recherche avancée</h1>
          
          {/* Search bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Rechercher un produit..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); }}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <LocationFilter 
              onLocationChange={handleLocationChange}
              currentRadius={searchRadius}
            />
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="relative">
              <SlidersHorizontal className="w-5 h-5 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
            <Button onClick={handleSearch}>
              Rechercher
            </Button>
          </div>

          {/* Active filters */}
          {(category || city || priceRange[0] > 0 || priceRange[1] < 10000000 || searchRadius > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {category}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('category')} />
                </Badge>
              )}
              {city && (
                <Badge variant="secondary" className="gap-1">
                  {city}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('city')} />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 10000000) && (
                <Badge variant="secondary" className="gap-1">
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('price')} />
                </Badge>
              )}
              {searchRadius > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <MapPin className="w-3 h-3" />
                  {searchRadius} km
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('location')} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                Tout effacer
              </Button>
            </div>
          )}

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-card border rounded-lg p-6 mb-6 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground">Filtres</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Effacer tout
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Catégorie
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les catégories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ville
                  </label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Toutes les villes</SelectItem>
                      {CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price range */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Prix: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={10000000}
                    step={10000}
                    className="mt-4"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-muted-foreground">
            {filteredProducts.length} résultat(s) trouvé(s)
            {searchRadius > 0 && ` dans un rayon de ${searchRadius} km`}
          </p>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'map')}>
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <Grid className="h-4 w-4" />
                <span className="hidden sm:inline">Grille</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="gap-2">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Carte</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg h-64" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <SearchIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Aucun résultat</h2>
            <p className="text-muted-foreground">Essayez de modifier vos critères de recherche</p>
          </div>
        ) : viewMode === 'map' ? (
          <ProductMap products={filteredProducts} className="mb-8" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const distance = getProductDistance(product);
              return (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onFavorite={user ? handleFavorite : undefined}
                  isFavorite={favorites.has(product.id)}
                  distance={distance}
                />
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Search;
