import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Star, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifiedSellersList = () => {
  const [sellers, setSellers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerifiedSellers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_verified', true)
          .order('full_name', { ascending: true });

        if (error) throw error;
        setSellers(data || []);
      } catch (error) {
        console.error('Error fetching verified sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedSellers();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-primary/5 border-b">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto space-y-4"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Nos Vendeurs <span className="text-primary">Vérifiés</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Achetez en toute confiance auprès de nos vendeurs certifiés à Goma.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12 container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : sellers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellers.map((seller, index) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-none bg-card group overflow-hidden">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-primary/10 group-hover:border-primary/30 transition-colors">
                          <AvatarImage src={seller.avatar_url || ''} />
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                            {seller.full_name?.charAt(0).toUpperCase() || <User className="h-10 w-10" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-lg">
                          <VerifiedBadge size="md" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-xl line-clamp-1">{seller.full_name || 'Vendeur Goma'}</h3>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{seller.city || 'Goma, RDC'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 py-2">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-primary">4.8</span>
                          <div className="flex text-yellow-500">
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                          </div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-foreground">120+</span>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ventes</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full pt-2">
                        <Button variant="outline" size="sm" className="rounded-xl gap-2" asChild>
                          <Link to={`/seller-public/${seller.id}`}>
                            Profil
                          </Link>
                        </Button>
                        <Button size="sm" className="rounded-xl gap-2 gradient-primary" asChild>
                          <Link to={`/messages?with=${seller.id}`}>
                            <MessageCircle className="h-4 w-4" />
                            Contact
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <User className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Aucun vendeur vérifié pour le moment</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Devenez le premier vendeur vérifié de Goma et profitez d'une visibilité accrue !
              </p>
              <Button className="gradient-primary rounded-xl" asChild>
                <Link to="/verify-seller" onClick={() => window.scrollTo(0, 0)}>Devenir un vendeur vérifié</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default VerifiedSellersList;
