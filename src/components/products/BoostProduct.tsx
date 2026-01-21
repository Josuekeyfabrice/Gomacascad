import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface BoostProductProps {
  productId: string;
  onSuccess?: () => void;
}

interface BoostPackage {
  id: string;
  name: string;
  duration: number; // in days
  price: number;
  features: string[];
  popular?: boolean;
}

const BOOST_PACKAGES: BoostPackage[] = [
  {
    id: '24h',
    name: 'Boost 24h',
    duration: 1,
    price: 2,
    features: [
      'Annonce en haut de la liste',
      'Badge "En vedette" visible',
      '24 heures de visibilité maximale',
    ],
  },
  {
    id: '7d',
    name: 'Boost 7 jours',
    duration: 7,
    price: 10,
    features: [
      'Annonce en haut de la liste',
      'Badge "En vedette" visible',
      '7 jours de visibilité maximale',
      'Priorité dans les recherches',
    ],
    popular: true,
  },
  {
    id: '30d',
    name: 'Boost 30 jours',
    duration: 30,
    price: 30,
    features: [
      'Annonce en haut de la liste',
      'Badge "En vedette" visible',
      '30 jours de visibilité maximale',
      'Priorité dans les recherches',
      'Statistiques détaillées',
    ],
  },
];

export const BoostProduct = ({ productId, onSuccess }: BoostProductProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<BoostPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'payment' | 'success'>('select');

  const handleBoostClick = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour booster votre annonce",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(true);
  };

  const handleSelectPackage = (pkg: BoostPackage) => {
    setSelectedPackage(pkg);
    setStep('payment');
  };

  const handleConfirmPayment = async () => {
    if (!selectedPackage || !user) return;

    setLoading(true);

    try {
      // Simulate boost activation (in production, this would create a database record)
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Product boost activated:', {
        productId,
        userId: user.id,
        packageId: selectedPackage.id,
        amount: selectedPackage.price,
        durationDays: selectedPackage.duration,
        expiresAt: new Date(Date.now() + selectedPackage.duration * 24 * 60 * 60 * 1000).toISOString(),
      });

      setStep('success');
      toast({
        title: "Annonce boostée !",
        description: `Votre annonce sera en vedette pendant ${selectedPackage.duration} jour(s).`,
      });

      setTimeout(() => {
        setIsOpen(false);
        setStep('select');
        setSelectedPackage(null);
        onSuccess?.();
      }, 3000);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de booster l'annonce",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={handleBoostClick}
        variant="outline"
        className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
      >
        <Zap className="mr-2 h-4 w-4" />
        Booster cette annonce
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booster votre annonce</DialogTitle>
            <DialogDescription>
              Augmentez la visibilité de votre produit et attirez plus d'acheteurs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {step === 'select' && (
              <div className="grid md:grid-cols-3 gap-4">
                {BOOST_PACKAGES.map((pkg) => (
                  <Card 
                    key={pkg.id}
                    className={`cursor-pointer transition-all relative ${
                      pkg.popular ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    {pkg.popular && (
                      <Badge className="absolute top-2 right-2 bg-primary">
                        Populaire
                      </Badge>
                    )}
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                      <p className="text-3xl font-bold text-primary mb-4">
                        {pkg.price}$
                      </p>
                      <ul className="space-y-2 mb-4">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full gradient-primary text-white">
                        Choisir
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {step === 'payment' && selectedPackage && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-bold mb-2">{selectedPackage.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-4">{selectedPackage.price}$</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    {selectedPackage.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Le paiement sera traité via Mobile Money. Vous recevrez une confirmation par SMS.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep('select');
                      setSelectedPackage(null);
                    }}
                    disabled={loading}
                  >
                    Retour
                  </Button>
                  <Button 
                    onClick={handleConfirmPayment}
                    disabled={loading}
                    className="flex-1 gradient-primary text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      `Payer ${selectedPackage.price}$`
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-green-600">Annonce boostée !</h3>
                <p className="text-sm text-muted-foreground">
                  Votre annonce est maintenant en vedette et attirera plus d'acheteurs.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
