import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Star, Eye, Calendar, MapPin, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { ProductCard } from '@/components/products/ProductCard';
import { SellerReviews } from '@/components/reviews/SellerReviews';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useAuth } from '@/hooks/useAuth';
import { Product, Profile } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SellerProfile = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { user } = useAuth();
  const [seller, setSeller] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalViews: 0,
    averageRating: 0,
    totalReviews: 0,
    followersCount: 0,
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (sellerId) {
      fetchSellerData();
    }
  }, [sellerId]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchSellerData = async () => {
    try {
      // Fetch seller profile
      const { data: sellerData, error: sellerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', sellerId)
        .single();

      if (sellerError) throw sellerError;
      setSeller(sellerData);

      // Fetch seller's products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Calculate stats
      const totalViews = productsData?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;

      // Fetch reviews for rating
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('rating')
        .eq('seller_id', sellerId);

      const totalReviews = reviewsData?.length || 0;
      const averageRating = totalReviews > 0
        ? Math.round((reviewsData?.reduce((sum, r) => sum + r.rating, 0) || 0) / totalReviews * 10) / 10
        : 0;

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId);

      // Check if current user is following
      if (user) {
        const { data: followData } = await supabase
          .from('followers')
          .select('id')
          .eq('user_id', user.id)
          .eq('seller_id', sellerId)
          .single();
        setIsFollowing(!!followData);
      }

      setStats({
        totalProducts: productsData?.length || 0,
        totalViews,
        averageRating,
        totalReviews,
        followersCount: followersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      setFavorites(prev => new Set(prev).add(productId));
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    try {
      if (isFollowing) {
        await supabase
          .from('followers')
          .delete()
          .eq('user_id', user.id)
          .eq('seller_id', sellerId);
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else {
        await supabase
          .from('followers')
          .insert({ user_id: user.id, seller_id: sellerId });
        setIsFollowing(true);
        setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Vendeur non trouvé</h1>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Seller Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {seller.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={seller.full_name || 'Vendeur'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {seller.full_name?.charAt(0) || 'V'}
                    </span>
                  )}
                </div>
                <OnlineIndicator 
                  isOnline={seller.is_online} 
                  className="absolute bottom-0 right-0 w-5 h-5"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-display">{seller.full_name || 'Vendeur'}</h1>
                  {seller.is_verified && <VerifiedBadge size="lg" />}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-muted-foreground">
                  {seller.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{seller.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Membre depuis {formatDistanceToNow(new Date(seller.created_at), { locale: fr })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={seller.is_online ? 'default' : 'secondary'}>
                    {seller.is_online ? 'En ligne' : 'Hors ligne'}
                  </Badge>
                  {stats.averageRating > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {stats.averageRating} ({stats.totalReviews} avis)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Contact & Follow Buttons */}
              {user?.id !== sellerId && (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="gap-2"
                  >
                    <Star className={`h-4 w-4 ${isFollowing ? 'fill-primary text-primary' : ''}`} />
                    {isFollowing ? 'Suivi' : 'Suivre'}
                  </Button>
                  <Button asChild variant="secondary">
                    <Link to={`/messages?to=${sellerId}`} className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/call/${sellerId}`} className="gap-2">
                      <Phone className="h-4 w-4" />
                      Appeler
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <div className="text-sm text-muted-foreground">Annonces</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{stats.totalViews}</div>
              <div className="text-sm text-muted-foreground">Vues totales</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{stats.averageRating || '-'}</div>
              <div className="text-sm text-muted-foreground">Note moyenne</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 mx-auto text-primary mb-2" />
              <div className="text-2xl font-bold">{stats.followersCount}</div>
              <div className="text-sm text-muted-foreground">Abonnés</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="mb-6">
            <TabsTrigger value="products">Annonces ({stats.totalProducts})</TabsTrigger>
            <TabsTrigger value="reviews">Avis ({stats.totalReviews})</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {products.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune annonce pour le moment</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite={favorites.has(product.id)}
                    onFavorite={user ? () => handleFavorite(product.id) : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <SellerReviews sellerId={sellerId!} />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default SellerProfile;
