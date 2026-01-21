import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

export const FeaturedProducts = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      // Fetch featured products first
      const { data: featured, error: featuredError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (featuredError) throw featuredError;
      setFeaturedProducts(featured || []);

      // Fetch recent products
      const { data: recent, error: recentError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(8);

      if (recentError) throw recentError;
      setRecentProducts(recent || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', user.id);

      if (data) {
        setFavorites(new Set(data.map((f) => f.product_id)));
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleFavorite = async (productId: string) => {
    if (!user) return;

    const isFav = favorites.has(productId);
    
    try {
      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
        
        setFavorites((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: productId });
        
        setFavorites((prev) => new Set(prev).add(productId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12">
        <section className="container mx-auto px-4 py-12 bg-muted/30 rounded-2xl my-8">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4 p-4 bg-background rounded-xl border">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl my-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-primary fill-primary" />
            <h2 className="font-display text-2xl font-bold md:text-3xl">Produits en vedette</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <div key={product.id} className="relative">
                <Badge className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  En vedette
                </Badge>
                <ProductCard
                  product={product}
                  onFavorite={user ? handleFavorite : undefined}
                  isFavorite={favorites.has(product.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Products Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Annonces récentes</h2>
          <Button variant="ghost" className="gap-2" asChild>
            <Link to="/search">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {recentProducts.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed p-12 text-center">
            <p className="text-muted-foreground">Aucune annonce pour le moment.</p>
            <Button className="mt-4 gradient-primary text-primary-foreground" asChild>
              <Link to="/sell">Publier la première annonce</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onFavorite={user ? handleFavorite : undefined}
                isFavorite={favorites.has(product.id)}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
