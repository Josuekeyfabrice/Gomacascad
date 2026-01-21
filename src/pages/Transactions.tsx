import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { Shield, Package, CheckCircle2, Clock, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Transactions = () => {
  const { user } = useAuth();
  const { getTransactions, confirmDelivery, loading } = useTransactions();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    if (!user) return;
    const data = await getTransactions(user.id);
    setTransactions(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700">Terminé</Badge>;
      case 'paid': return <Badge className="bg-blue-100 text-blue-700">Payé (Séquestre)</Badge>;
      case 'pending': return <Badge variant="outline">En attente</Badge>;
      case 'disputed': return <Badge variant="destructive">En litige</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-700">Annulé</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const purchases = transactions.filter(t => t.buyer_id === user?.id);
  const sales = transactions.filter(t => t.seller_id === user?.id);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="font-display text-4xl font-black mb-2">Mes Transactions</h1>
            <p className="text-muted-foreground">Suivez vos achats et ventes sécurisés par GOMA CONNECT.</p>
          </div>

          <Tabs defaultValue="purchases" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="purchases" className="gap-2">
                <Package className="h-4 w-4" /> Mes Achats
              </TabsTrigger>
              <TabsTrigger value="sales" className="gap-2">
                <ArrowRightLeft className="h-4 w-4" /> Mes Ventes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchases">
              {purchases.length === 0 ? (
                <Card className="bg-muted/30 border-dashed py-12">
                  <CardContent className="flex flex-col items-center text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">Vous n'avez pas encore effectué d'achats sécurisés.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {purchases.map((t) => (
                    <Card key={t.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {t.product?.images?.[0] ? (
                                <img src={t.product.images[0]} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <Package className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-lg">{t.product?.name || "Produit inconnu"}</h3>
                              <p className="text-sm text-muted-foreground">
                                Commandé le {format(new Date(t.created_at), 'PPP', { locale: fr })}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(t.status)}
                                <span className="font-black text-primary">{t.amount}$</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center gap-2 min-w-[200px]">
                            {t.status === 'paid' && (
                              <Button
                                onClick={async () => {
                                  if (await confirmDelivery(t.id)) loadTransactions();
                                }}
                                disabled={loading}
                                className="w-full gradient-primary font-bold"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Confirmer Réception
                              </Button>
                            )}
                            {t.status === 'paid' && (
                              <p className="text-[10px] text-center text-muted-foreground px-4">
                                Ne confirmez que si vous avez le produit en main.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales">
              {sales.length === 0 ? (
                <Card className="bg-muted/30 border-dashed py-12">
                  <CardContent className="flex flex-col items-center text-center">
                    <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground">Aucune vente enregistrée pour le moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sales.map((t) => (
                    <Card key={t.id} className="overflow-hidden border-purple-100 bg-purple-50/5">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex gap-4">
                            <div className="h-20 w-20 rounded-xl bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {t.product?.images?.[0] ? (
                                <img src={t.product.images[0]} className="h-full w-full object-cover" alt="" />
                              ) : (
                                <Package className="h-8 w-8 text-gray-400" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-lg">{t.product?.name || "Produit inconnu"}</h3>
                              <p className="text-sm text-muted-foreground">
                                Client ID: {t.buyer_id.substring(0, 8)}...
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                {getStatusBadge(t.status)}
                                <span className="font-black font-display">{t.amount}$</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-center text-center space-y-2">
                            {t.escrow_status === 'held' && (
                              <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Fonds en Séquestre
                              </div>
                            )}
                            {t.escrow_status === 'released' && (
                              <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Argent Libéré
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-12 p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4 items-start">
            <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-blue-900">Comment fonctionne le séquestre ?</h4>
              <p className="text-sm text-blue-700 leading-relaxed">
                Lorsqu'un achat est effectué, l'argent est conservé par GOMA CONNECT.
                Le vendeur reçoit une notification pour préparer la commande.
                L'argent n'est versé au vendeur que lorsque l'acheteur confirme la réception correcte du produit.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Transactions;
