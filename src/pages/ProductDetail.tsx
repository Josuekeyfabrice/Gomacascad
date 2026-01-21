import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Heart, Phone, MessageCircle, MapPin, Eye, ArrowLeft, ChevronLeft, ChevronRight, Share2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Product, Profile } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OnlineIndicator } from '@/components/ui/OnlineIndicator';
import { SellerReviews } from '@/components/reviews/SellerReviews';
import { ReportDialog } from '@/components/reports/ReportDialog';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import ProductLocationMap from '@/components/maps/ProductLocationMap';
import { BoostDialog } from '@/components/products/BoostDialog';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
      incrementViews();
    }
  }, [id]);

  useEffect(() => {
    if (user && product) {
      checkFavorite();
    }
  }, [user, product]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setProduct(data);
      
      // Fetch seller info
      if (data?.seller_id) {
        const { data: sellerData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.seller_id)
          .single();
        
        setSeller(sellerData);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le produit',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async () => {
    if (!id) return;
    try {
      // Increment views count in Supabase
      const { error } = await supabase.rpc('increment_product_views', { product_id: id });
      
      if (error) {
        // Fallback if RPC is not available
        const { data: currentProduct } = await supabase
          .from('products')
          .select('views_count')
          .eq('id', id)
          .single();
        
        if (currentProduct) {
          await supabase
            .from('products')
            .update({ views_count: (currentProduct.views_count || 0) + 1 })
            .eq('id', id);
        }
      }
    } catch (err) {
      console.error('Error incrementing views:', err);
    }
  };

  const checkFavorite = async () => {
    if (!user || !product) return;
    
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .single();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour ajouter aux favoris',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!product) return;

    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        
        setIsFavorite(false);
        toast({ title: 'Retiré des favoris' });
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: product.id });
        
        setIsFavorite(true);
        toast({ title: 'Ajouté aux favoris' });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCall = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour appeler le vendeur',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (product?.seller_id) {
      navigate(`/call/${product.seller_id}`);
    }
  };

  const handleMessage = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Connectez-vous pour envoyer un message',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    navigate(`/messages?to=${product?.seller_id}&product=${product?.id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description || '',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Lien copié !' });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const nextImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
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
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {product.images.length > 1 && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === currentImageIndex 
                                ? 'bg-primary' 
                                : 'bg-background/60'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Pas d'image
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex 
                        ? 'border-primary' 
                        : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className="mb-2">{product.category}</Badge>
                  <h1 className="text-2xl md:text-3xl font-bold font-display">
                    {product.name}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant={isFavorite ? 'default' : 'outline'}
                    size="icon"
                    onClick={toggleFavorite}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.discount_percentage && product.discount_percentage > 0 && (
                  <>
                    <span className="text-lg line-through text-muted-foreground">
                      {formatPrice(product.original_price)}
                    </span>
                    <Badge className="bg-destructive text-destructive-foreground">
                      -{product.discount_percentage}%
                    </Badge>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{product.city}</span>
                {product.avenue && <span>, {product.avenue}</span>}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{product.views_count} vues</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Seller Info */}
            <Card>
              <CardContent className="p-4">
                <Link to={`/seller/${product.seller_id}`} className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {seller?.avatar_url ? (
                        <img
                          src={seller.avatar_url}
                          alt={seller.full_name || 'Vendeur'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary">
                          {seller?.full_name?.charAt(0) || 'V'}
                        </span>
                      )}
                    </div>
                    {seller && (
                      <OnlineIndicator 
                        isOnline={seller.is_online} 
                        className="absolute -bottom-0.5 -right-0.5"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{seller?.full_name || 'Vendeur'}</h3>
                      {seller?.is_verified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {seller?.is_online ? 'En ligne' : 'Hors ligne'}
                    </p>
                    <p className="text-xs text-primary mt-1">Voir le profil →</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              {user?.id === product.seller_id ? (
                <BoostDialog productId={product.id} productName={product.name} />
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 gap-2"
                    size="lg"
                    onClick={handleCall}
                  >
                    <Phone className="h-4 w-4" />
                    Appeler
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    variant="secondary"
                    size="lg"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                </div>
              )}
            </div>

            {/* Phone number */}
            {product.phone && (
              <div className="text-center">
                <a 
                  href={`tel:${product.phone}`}
                  className="text-primary hover:underline"
                >
                  📞 {product.phone}
                </a>
              </div>
            )}

            {/* Report button */}
            {user?.id !== product.seller_id && (
              <div className="flex justify-end">
                <ReportDialog productId={product.id} />
              </div>
            )}

            {/* Product Location Map */}
            {product.latitude && product.longitude && (
              <>
                <Separator />
                <ProductLocationMap
                  latitude={product.latitude}
                  longitude={product.longitude}
                  productName={product.name}
                  city={product.city}
                  address={product.address || product.avenue}
                />
              </>
            )}

            {/* Seller Reviews */}
            <Separator />
            <div>
              <h2 className="text-lg font-semibold mb-4">Avis sur le vendeur</h2>
              <SellerReviews sellerId={product.seller_id} productId={product.id} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
