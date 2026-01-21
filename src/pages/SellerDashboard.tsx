import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, ShoppingCart, DollarSign, Zap, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalProducts: number;
  activeListings: number;
  totalViews: number;
  totalSales: number;
  totalRevenue: number;
  boostedProducts: number;
}

const SellerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeListings: 0,
    totalViews: 0,
    totalSales: 0,
    totalRevenue: 0,
    boostedProducts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch products stats
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, is_active, views_count, price')
          .eq('seller_id', user.id);

        if (productsError) throw productsError;

        const activeProducts = products?.filter(p => p.is_active) || [];
        const totalViews = products?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

        setStats({
          totalProducts: products?.length || 0,
          activeListings: activeProducts.length,
          totalViews,
          totalSales: 0, // Will be populated when transactions table exists
          totalRevenue: 0, // Will be populated when transactions table exists
          boostedProducts: 0, // Will be populated when product_boosts table exists
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos statistiques",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, navigate, toast]);

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
            <h1 className="font-display text-3xl font-bold mb-2">Tableau de Bord Vendeur</h1>
            <p className="text-muted-foreground">Gérez vos annonces et suivez vos performances</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Annonces actives</p>
                    <p className="text-3xl font-bold">{stats.activeListings}</p>
                    <p className="text-xs text-muted-foreground mt-1">sur {stats.totalProducts} total</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Vues totales</p>
                    <p className="text-3xl font-bold">{stats.totalViews}</p>
                    <p className="text-xs text-muted-foreground mt-1">cette semaine</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Revenu total</p>
                    <p className="text-3xl font-bold">{stats.totalRevenue}$</p>
                    <p className="text-xs text-muted-foreground mt-1">{stats.totalSales} ventes</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Boost Stats */}
          <Card className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                Annonces Boostées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Annonces actuellement boostées</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.boostedProducts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Taux de conversion moyen</p>
                  <p className="text-3xl font-bold text-amber-600">+45%</p>
                </div>
                <div className="flex items-end">
                  <Button className="w-full gradient-primary text-white">
                    <Zap className="mr-2 h-4 w-4" />
                    Booster une annonce
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommandations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.activeListings < 5 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Augmentez vos annonces</p>
                    <p className="text-sm text-blue-700">Vous avez peu d'annonces actives. Ajoutez plus de produits pour augmenter vos ventes.</p>
                  </div>
                </div>
              )}

              {stats.boostedProducts === 0 && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
                  <Zap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Boostez vos meilleures annonces</p>
                    <p className="text-sm text-amber-700">Les annonces boostées reçoivent 45% plus de vues. Essayez pour augmenter vos ventes.</p>
                  </div>
                </div>
              )}

              {stats.totalProducts > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Bon début !</p>
                    <p className="text-sm text-green-700">Continuez à ajouter des produits et maintenir une bonne qualité de service.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
