import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { ProductCard } from '@/components/products/ProductCard';
import { TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const TrendingProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles(*)')
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('views_count', { ascending: false })
        .limit(4);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching trending products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-black">Tendances à Goma</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 bg-primary/5 rounded-[3rem] my-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-black">Tendances à Goma</h2>
            <p className="text-muted-foreground text-sm">Les articles les plus consultés en ce moment</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
