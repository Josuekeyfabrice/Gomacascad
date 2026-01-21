import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Card } from '@/components/ui/card';

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id, products(*)')
        .eq('user_id', user?.id);

      if (error) throw error;

      const products = data
        ?.map((f) => f.products)
        .filter((p): p is Product => p !== null) || [];
      
      setFavorites(products);
      setFavoriteIds(new Set(products.map((p) => p.id)));
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos favoris',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (productId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      setFavorites((prev) => prev.filter((p) => p.id !== productId));
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });

      toast({ title: 'Retiré des favoris' });
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold font-display mb-6">Mes favoris</h1>

        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Vous n'avez pas encore de favoris
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favoriteIds.has(product.id)}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;
