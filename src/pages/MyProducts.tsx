import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const MyProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos annonces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleProductActive = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);

      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, is_active: !isActive } : p
        )
      );

      toast({
        title: isActive ? 'Annonce désactivée' : 'Annonce activée',
      });
    } catch (error) {
      console.error('Error toggling product:', error);
    }
  };

  const deleteProduct = async () => {
    if (!deleteProductId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteProductId);

      if (error) throw error;

      setProducts((prev) => prev.filter((p) => p.id !== deleteProductId));
      toast({ title: 'Annonce supprimée' });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'annonce',
        variant: 'destructive',
      });
    } finally {
      setDeleteProductId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display">Mes annonces</h1>
          <Button asChild>
            <Link to="/sell">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle annonce
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              Vous n'avez pas encore d'annonces
            </div>
            <Button asChild>
              <Link to="/sell">
                <Plus className="mr-2 h-4 w-4" />
                Publier une annonce
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <Link to={`/product/${product.id}`} className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-muted">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Pas d'image
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link 
                            to={`/product/${product.id}`}
                            className="font-semibold hover:text-primary line-clamp-1"
                          >
                            {product.name}
                          </Link>
                          <p className="text-lg font-bold text-primary">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/edit-product/${product.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleProductActive(product.id, product.is_active)}
                            >
                              {product.is_active ? (
                                <>
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteProductId(product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary">{product.category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {product.city}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          • {product.views_count} vues
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {!product.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Désactivée
                          </Badge>
                        )}
                        {!product.is_approved && (
                          <Badge variant="outline" className="text-yellow-600">
                            En attente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'annonce sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyProducts;
