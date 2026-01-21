import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Eye, 
  ShoppingBag, 
  Users, 
  Star, 
  Clock,
  MapPin,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  totalViews: number;
  totalProducts: number;
  totalUsers: number;
  activeProducts: number;
  featuredProducts: number;
  avgRating: number;
  productsByCity: { city: string; count: number }[];
  productsByCategory: { category: string; count: number }[];
  recentSignups: number;
  pendingApprovals: number;
}

export const DashboardAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('*');

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*');

    // Fetch reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating');

    const productsList = products || [];
    const profilesList = profiles || [];
    const reviewsList = reviews || [];

    // Calculate analytics
    const totalViews = productsList.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const activeProducts = productsList.filter(p => p.is_active && p.is_approved).length;
    const featuredProducts = productsList.filter(p => p.is_featured).length;
    const pendingApprovals = productsList.filter(p => !p.is_approved).length;
    
    // Average rating
    const avgRating = reviewsList.length > 0 
      ? reviewsList.reduce((sum, r) => sum + r.rating, 0) / reviewsList.length 
      : 0;

    // Products by city
    const cityCount: Record<string, number> = {};
    productsList.forEach(p => {
      cityCount[p.city] = (cityCount[p.city] || 0) + 1;
    });
    const productsByCity = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Products by category
    const categoryCount: Record<string, number> = {};
    productsList.forEach(p => {
      const cat = p.category || 'Autres';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const productsByCategory = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignups = profilesList.filter(p => 
      new Date(p.created_at) > weekAgo
    ).length;

    setAnalytics({
      totalViews,
      totalProducts: productsList.length,
      totalUsers: profilesList.length,
      activeProducts,
      featuredProducts,
      avgRating,
      productsByCity,
      productsByCategory,
      recentSignups,
      pendingApprovals,
    });

    setLoading(false);
  };

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Vues totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <ShoppingBag className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.activeProducts}</p>
                <p className="text-sm text-muted-foreground">Produits actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Star className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.avgRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.recentSignups}</p>
                <p className="text-sm text-muted-foreground">Nouveaux (7 jours)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.pendingApprovals}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Star className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.featuredProducts}</p>
                <p className="text-sm text-muted-foreground">En vedette</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Produits par ville
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.productsByCity.map(({ city, count }) => (
                <div key={city} className="flex items-center justify-between">
                  <span className="font-medium">{city}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 rounded-full bg-primary"
                      style={{ 
                        width: `${(count / analytics.totalProducts) * 100}px`,
                        minWidth: '10px'
                      }}
                    />
                    <span className="text-muted-foreground text-sm w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Produits par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.productsByCategory.map(({ category, count }) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="font-medium truncate max-w-[150px]">{category}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 rounded-full bg-accent"
                      style={{ 
                        width: `${(count / analytics.totalProducts) * 100}px`,
                        minWidth: '10px'
                      }}
                    />
                    <span className="text-muted-foreground text-sm w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
