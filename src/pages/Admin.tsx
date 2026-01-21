import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Users, Package, Flag, Search, 
  CheckCircle, XCircle, Eye, Trash2, Shield, Star, Percent, BadgeCheck, BarChart3
} from 'lucide-react';
import { DashboardAnalytics } from '@/components/admin/DashboardAnalytics';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    pendingReports: 0,
  });

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!data) {
        toast({
          title: 'Accès refusé',
          description: 'Vous n\'avez pas les droits d\'administration',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchData();
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading, navigate, toast]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // Fetch reports
    const { data: reportsData } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    setProducts(productsData || []);
    setUsers(usersData || []);
    setReports(reportsData || []);

    setStats({
      totalProducts: productsData?.length || 0,
      totalUsers: usersData?.length || 0,
      pendingReports: reportsData?.filter(r => r.status === 'pending').length || 0,
    });

    setLoading(false);
  };

  const toggleProductApproval = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_approved: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Statut du produit mis à jour' });
      fetchData();
    }
  };

  const toggleProductActive = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Statut du produit mis à jour' });
      fetchData();
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!confirm('Supprimer ce produit définitivement?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Produit supprimé' });
      fetchData();
    }
  };

  const toggleProductFeatured = async (productId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_featured: !currentStatus })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ 
        title: 'Succès', 
        description: currentStatus ? 'Produit retiré des vedettes' : 'Produit mis en vedette' 
      });
      fetchData();
    }
  };

  const setProductDiscount = async (productId: string, originalPrice: number | null, discountPercentage: number | null) => {
    const { error } = await supabase
      .from('products')
      .update({ 
        original_price: originalPrice,
        discount_percentage: discountPercentage 
      })
      .eq('id', productId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Promotion mise à jour' });
      fetchData();
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId);

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Succès', description: 'Rapport mis à jour' });
      fetchData();
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone?.includes(searchQuery)
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Admin</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Package className="w-10 h-10 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
                <div className="text-muted-foreground">Produits</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
                <div className="text-muted-foreground">Utilisateurs</div>
              </div>
            </div>
          </div>
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-4">
              <Flag className="w-10 h-10 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.pendingReports}</div>
                <div className="text-muted-foreground">Signalements en attente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics">
          <TabsList className="mb-6">
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              Produits ({products.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs ({users.length})
            </TabsTrigger>
            <TabsTrigger value="reports">
              <Flag className="w-4 h-4 mr-2" />
              Signalements ({reports.length})
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <DashboardAnalytics />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Produit</th>
                      <th className="text-left p-4 font-medium">Prix</th>
                      <th className="text-left p-4 font-medium">Ville</th>
                      <th className="text-left p-4 font-medium">Statut</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-t">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <span className="font-medium">{product.name}</span>
                              {product.is_featured && (
                                <Badge className="ml-2 bg-primary text-primary-foreground">
                                  <Star className="w-3 h-3 mr-1 fill-current" />
                                  Vedette
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{product.price.toLocaleString()} CDF</td>
                        <td className="p-4">{product.city}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Badge variant={product.is_approved ? 'default' : 'secondary'}>
                              {product.is_approved ? 'Approuvé' : 'En attente'}
                            </Badge>
                            <Badge variant={product.is_active ? 'outline' : 'destructive'}>
                              {product.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/product/${product.id}`)}
                              title="Voir le produit"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleProductFeatured(product.id, product.is_featured)}
                              title={product.is_featured ? "Retirer des vedettes" : "Mettre en vedette"}
                            >
                              <Star className={`w-4 h-4 ${product.is_featured ? 'fill-primary text-primary' : ''}`} />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  title="Gérer la promotion"
                                >
                                  <Percent className={`w-4 h-4 ${product.discount_percentage ? 'text-destructive' : ''}`} />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Gérer la promotion</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Prix actuel: {product.price.toLocaleString()} CDF</Label>
                                  </div>
                                  <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const origPrice = formData.get('original_price') as string;
                                    const discPercent = formData.get('discount_percentage') as string;
                                    setProductDiscount(
                                      product.id, 
                                      origPrice ? parseFloat(origPrice) : null,
                                      discPercent ? parseInt(discPercent) : null
                                    );
                                  }} className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="original_price">Prix original (avant réduction)</Label>
                                      <Input 
                                        id="original_price" 
                                        name="original_price"
                                        type="number" 
                                        defaultValue={product.original_price || ''} 
                                        placeholder="Prix original"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="discount_percentage">Pourcentage de réduction (%)</Label>
                                      <Input 
                                        id="discount_percentage" 
                                        name="discount_percentage"
                                        type="number" 
                                        min="0"
                                        max="100"
                                        defaultValue={product.discount_percentage || ''} 
                                        placeholder="Ex: 20"
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button type="submit" className="flex-1">Appliquer</Button>
                                      <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => setProductDiscount(product.id, null, null)}
                                      >
                                        Retirer
                                      </Button>
                                    </div>
                                  </form>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleProductApproval(product.id, product.is_approved)}
                              title={product.is_approved ? "Désapprouver" : "Approuver"}
                            >
                              {product.is_approved ? (
                                <XCircle className="w-4 h-4 text-destructive" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-primary" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteProduct(product.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Utilisateur</th>
                      <th className="text-left p-4 font-medium">Téléphone</th>
                      <th className="text-left p-4 font-medium">Ville</th>
                      <th className="text-left p-4 font-medium">Vérifié</th>
                      <th className="text-left p-4 font-medium">Statut</th>
                      <th className="text-left p-4 font-medium">Inscrit le</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((profile) => (
                      <tr key={profile.id} className="border-t">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt=""
                                className="w-10 h-10 object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">
                              {profile.full_name || 'Sans nom'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">{profile.phone || '-'}</td>
                        <td className="p-4">{profile.city || '-'}</td>
                        <td className="p-4">
                          {profile.is_verified ? (
                            <VerifiedBadge size="md" />
                          ) : (
                            <span className="text-muted-foreground">Non</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant={profile.is_online ? 'default' : 'secondary'}>
                            {profile.is_online ? 'En ligne' : 'Hors ligne'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {new Date(profile.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant={profile.is_verified ? 'destructive' : 'default'}
                            onClick={async () => {
                              const { error } = await supabase
                                .from('profiles')
                                .update({ is_verified: !profile.is_verified })
                                .eq('id', profile.id);
                              if (error) {
                                toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
                              } else {
                                toast({ 
                                  title: 'Succès', 
                                  description: profile.is_verified ? 'Vérification retirée' : 'Vendeur vérifié' 
                                });
                                fetchData();
                              }
                            }}
                          >
                            <BadgeCheck className="w-4 h-4 mr-1" />
                            {profile.is_verified ? 'Retirer' : 'Vérifier'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium">Raison</th>
                      <th className="text-left p-4 font-medium">Description</th>
                      <th className="text-left p-4 font-medium">Statut</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id} className="border-t">
                        <td className="p-4 font-medium">{report.reason}</td>
                        <td className="p-4 max-w-xs truncate">
                          {report.description || '-'}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              report.status === 'pending'
                                ? 'secondary'
                                : report.status === 'resolved'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {report.status === 'pending'
                              ? 'En attente'
                              : report.status === 'resolved'
                              ? 'Résolu'
                              : 'Rejeté'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateReportStatus(report.id, 'resolved')}
                            >
                              <CheckCircle className="w-4 h-4 text-primary" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => updateReportStatus(report.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
