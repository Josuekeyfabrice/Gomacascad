import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  Smartphone, 
  MessageSquare,
  Copy,
  Check,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

const VerifySeller = () => {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const plans = [
    {
      id: 'monthly',
      name: "Mensuel",
      price: "5",
      duration: "mois",
      description: "Idéal pour tester l'impact sur vos ventes.",
      features: ["Badge Vendeur Vérifié", "Priorité dans les recherches", "Support WhatsApp 24/7"],
      recommended: false
    },
    {
      id: 'quarterly',
      name: "Trimestriel",
      price: "12",
      duration: "3 mois",
      description: "Le meilleur rapport qualité-prix pour les pros.",
      features: ["Badge Vendeur Vérifié", "Priorité dans les recherches", "Support WhatsApp 24/7", "Statistiques de vues avancées"],
      recommended: true
    },
    {
      id: 'yearly',
      name: "Annuel",
      price: "40",
      duration: "an",
      description: "Pour les entreprises établies à Goma.",
      features: ["Badge Vendeur Vérifié", "Priorité maximale", "Support dédié", "Publicité sur la page d'accueil"],
      recommended: false
    }
  ];

  const paymentMethods = [
    { name: 'M-Pesa', color: 'bg-[#E61C24]', textColor: 'text-white', number: '+243 816 487 531' },
    { name: 'Airtel Money', color: 'bg-[#FF0000]', textColor: 'text-white', number: '+243 991 291 980' },
    { name: 'Orange Money', color: 'bg-[#FF7900]', textColor: 'text-white', number: '+243 893 645 600' },
  ];

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(text);
    toast({
      title: "Copié !",
      description: "Le numéro a été copié dans votre presse-papier.",
    });
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleWhatsAppConfirm = () => {
    const message = `Bonjour GOMACASCADE, je souhaite activer le forfait ${selectedPlan.name} (${selectedPlan.price}$) pour mon compte vendeur.`;
    window.open(`https://wa.me/243893645600?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePawaPay = () => {
    toast({
      title: "PawaPay en cours d'activation",
      description: "L'intégration sécurisée PawaPay est en cours de configuration finale.",
    });
  };

  return (
    <TooltipProvider>
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
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">Programme de Confiance</Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Devenez un Vendeur <span className="text-primary">Vérifié</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Augmentez vos ventes et gagnez la confiance de milliers d'acheteurs à Goma.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Confiance Instantanée</h3>
              <p className="text-muted-foreground">Le badge rassure les clients sur votre sérieux et réduit les hésitations à l'achat.</p>
            </div>
            <div className="space-y-4 text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                <TrendingUp className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Plus de Visibilité</h3>
              <p className="text-muted-foreground">Vos annonces apparaissent avant celles des vendeurs non vérifiés dans les résultats.</p>
            </div>
            <div className="space-y-4 text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">Ventes Accélérées</h3>
              <p className="text-muted-foreground">Les vendeurs vérifiés vendent en moyenne 3x plus vite que les autres sur GOMACASCADE.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Choisissez votre forfait</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -10 }}
                  className="relative"
                >
                  {plan.recommended && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1 shadow-lg">Recommandé</Badge>
                    </div>
                  )}
                  <Card className={`h-full flex flex-col transition-all ${plan.recommended ? 'border-primary shadow-xl ring-1 ring-primary' : 'hover:shadow-lg'}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{plan.price}$</span>
                        <span className="text-muted-foreground">/{plan.duration}</span>
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handleSelectPlan(plan)}
                        className={`w-full h-12 text-lg font-bold ${plan.recommended ? 'gradient-primary' : ''}`} 
                        variant={plan.recommended ? 'default' : 'outline'}
                      >
                        Choisir ce forfait
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Finaliser votre paiement</DialogTitle>
              <DialogDescription>
                Forfait sélectionné : <span className="font-bold text-primary">{selectedPlan?.name} ({selectedPlan?.price}$)</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <p className="text-sm text-muted-foreground">
                Veuillez effectuer le transfert du montant exact vers l'un des numéros ci-dessous :
              </p>
              
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.name} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${method.color} flex items-center justify-center text-[10px] font-bold ${method.textColor} leading-tight text-center px-1`}>
                        {method.name}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{method.name}</p>
                        <p className="font-mono font-bold">{method.number}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(method.number)}
                    >
                      {copiedNumber === method.number ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou payer en ligne</span>
                  </div>
                </div>

                <Button 
                  onClick={handlePawaPay}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white gap-2 font-bold shadow-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  Payer par Carte ou Mobile (PawaPay)
                </Button>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                  <p className="text-xs font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Confirmation manuelle :
                  </p>
                  <Button 
                    onClick={handleWhatsAppConfirm}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Confirmer sur WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Payment Methods Footer */}
        <section className="py-16 container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-8">Modes de paiement acceptés à Goma</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {paymentMethods.map((method) => (
              <div key={method.name} className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 rounded-2xl ${method.color} flex items-center justify-center text-xs font-bold ${method.textColor} shadow-lg`}>
                  {method.name}
                </div>
                <span className="text-sm font-medium">{method.name}</span>
              </div>
            ))}
          </div>
        </section>
        </main>
        <Footer />
      </div>
    </TooltipProvider>
  );
};

export default VerifySeller;
