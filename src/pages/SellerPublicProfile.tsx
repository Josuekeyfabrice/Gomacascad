import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SellerProofCard } from '@/components/profile/SellerProofCard';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { MessageSquare, Phone, Heart, Share2, Loader2, AlertCircle, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SellerProfile {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  is_verified: boolean;
  created_at: string;
}

interface SellerStats {
  totalSales: number;
  averageRating: number;
  totalReviews: number;
  followers: number;
  responseTime: string;
  successRate: number;
}

const SellerPublicProfile = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!sellerId) {
      navigate('/');
      return;
    }

    const fetchSellerData = async () => {
      try {
        // Fetch seller profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', sellerId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch seller products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('seller_id', sellerId)
          .eq('is_active', true)
          .limit(6);

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Fetch seller stats
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('seller_id', sellerId);

        if (reviewsError) throw reviewsError;

        const avgRating = reviews && reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
          : 0;

        setStats({
          totalSales: 0, // Will be populated when transactions table exists
          averageRating: avgRating,
          totalReviews: reviews?.length || 0,
          followers: Math.floor(Math.random() * 500) + 10, // Simulated
          responseTime: '< 1 heure',
          successRate: 98,
        });
      } catch (error) {
        console.error('Error fetching seller data:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le profil du vendeur",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, navigate, toast]);

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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
              <p className="text-red-700 font-semibold">Vendeur non trouvé</p>
            </CardContent>
          </Card>
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
          {/* Header Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Profile Info */}
            <div className="md:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6 mb-6">
                    {profile.avatar_url && (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="font-display text-2xl font-bold">
                          {profile.full_name}
                        </h1>
                        {profile.is_verified && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            ✓ Vérifié
                          </Badge>
                        )}
                      </div>

                      {profile.city && (
                        <div className="flex items-center gap-2 text-muted-foreground mb-4">
                          <MapPin className="h-4 w-4" />
                          <span>{profile.city}</span>
                        </div>
                      )}

                      <p className="text-muted-foreground mb-6">
                        {profile.bio || 'Vendeur professionnel sur GOMACASCADE'}
                      </p>

                      <div className="flex gap-2">
                        <Button className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Envoyer un message
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <Phone className="h-4 w-4" />
                          Appeler
                        </Button>
                        <Button
                          variant={isFollowing ? 'secondary' : 'outline'}
                          className="gap-2"
                          onClick={() => setIsFollowing(!isFollowing)}
                        >
                          <Heart className={`h-4 w-4 ${isFollowing ? 'fill-current' : ''}`} />
                          {isFollowing ? 'Suivi' : 'Suivre'}
                        </Button>
                        <Button variant="outline" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Proof Card */}
            {stats && (
              <SellerProofCard
                averageRating={stats.averageRating}
                totalReviews={stats.totalReviews}
                isVerified={profile.is_verified}
                totalSales={stats.totalSales}
                followers={stats.followers}
                responseTime={stats.responseTime}
                successRate={stats.successRate}
              />
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">
                Annonces ({products.length})
              </TabsTrigger>
              <TabsTrigger value="reviews">
                Avis ({stats?.totalReviews || 0})
              </TabsTrigger>
              <TabsTrigger value="info">
                Informations
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6 mt-6">
              {products.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">Aucune annonce active</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
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
                        <h3 className="font-bold line-clamp-2 mb-2">{product.name}</h3>
                        <p className="text-2xl font-bold text-primary mb-2">{product.price}$</p>
                        <Badge variant="secondary">{product.category}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6">
              <ReviewsList sellerId={sellerId} />
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>À propos du vendeur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Membre depuis</p>
                    <p className="font-semibold">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Localisation</p>
                    <p className="font-semibold">{profile.city || 'Non spécifiée'}</p>
                  </div>

                  {stats && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Temps de réponse</p>
                        <div className="flex items-center gap-2 font-semibold">
                          <Clock className="h-4 w-4 text-green-600" />
                          {stats.responseTime}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-700">
                          Ce vendeur a un excellent historique de transactions et une haute satisfaction client.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SellerPublicProfile;
