import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, Phone } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/database';
import { pawapayService } from '@/services/pawapay';

interface SecureBuyButtonProps {
  product: Product;
  onSuccess?: () => void;
}

export const SecureBuyButton = ({ product, onSuccess }: SecureBuyButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createTransaction, confirmPayment, loading } = useTransactions();
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'confirm' | 'payment' | 'success'>('confirm');

  const handleBuyClick = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour acheter",
        variant: "destructive",
      });
      return;
    }

    if (user.id === product.seller_id) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas acheter votre propre produit",
        variant: "destructive",
      });
      return;
    }

    setIsOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !phoneNumber) {
      toast({
        title: "Numéro requis",
        description: "Veuillez entrer votre numéro Mobile Money",
        variant: "destructive"
      });
      return;
    }

    const transaction = await createTransaction(
      user.id,
      product.seller_id,
      product.id,
      product.price,
      'Mobile Money'
    );

    if (transaction) {
      setStep('payment');

      try {
        // Initiation réelle du paiement PawaPay
        const pawaResponse = await pawapayService.initiatePayment(
          product.price,
          phoneNumber,
          `Achat: ${product.name}`
        );

        if (pawaResponse.status === 'ACCEPTED') {
          // Dans une prod réelle, on attendrait le webhook. 
          // Ici on simule une attente de 3s avant de vérifier le statut
          setTimeout(async () => {
            const paymentConfirmed = await confirmPayment(transaction.id);
            if (paymentConfirmed) {
              setStep('success');
              toast({
                title: "Paiement réussi",
                description: "Vos fonds sont maintenant sécurisés en séquestre.",
              });

              setTimeout(() => {
                setIsOpen(false);
                setStep('confirm');
                onSuccess?.();
              }, 3000);
            }
          }, 5000);
        }
      } catch (err) {
        setStep('confirm');
        toast({
          title: "Erreur de paiement",
          description: "Le paiement n'a pas pu être initié. Vérifiez votre numéro.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de créer la transaction",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button
        onClick={handleBuyClick}
        className="w-full gradient-primary text-white text-lg h-12 font-bold"
      >
        <ShieldCheck className="mr-2 h-5 w-5" />
        Acheter de manière sécurisée
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Achat Sécurisé</DialogTitle>
            <DialogDescription>
              Votre paiement est protégé par notre système de séquestre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {step === 'confirm' && (
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h3 className="font-bold mb-2">{product.name}</h3>
                  <p className="text-2xl font-bold text-primary mb-4">{product.price}$</p>

                  <div className="space-y-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Numéro Mobile Money (M-Pesa, Airtel...)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="081XXXXXXX"
                          className="pl-10"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Après le paiement, vos fonds seront sécurisés et vous aurez 48h pour confirmer la réception.
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmPurchase}
                  disabled={loading}
                  className="w-full gradient-primary text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    "Confirmer l'achat"
                  )}
                </Button>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-4 text-center py-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                <h3 className="font-bold">Traitement du paiement...</h3>
                <p className="text-sm text-muted-foreground">
                  Veuillez patienter pendant que nous sécurisons votre transaction.
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-green-600">Achat Confirmé !</h3>
                <p className="text-sm text-muted-foreground">
                  Votre paiement de {product.price}$ est maintenant sécurisé en séquestre.
                </p>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Fonds protégés
                </Badge>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
