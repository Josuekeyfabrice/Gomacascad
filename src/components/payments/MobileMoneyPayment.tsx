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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MobileMoneyPaymentProps {
  amount: number;
  description: string;
  onSuccess: (transactionId: string) => void;
  onCancel?: () => void;
}

type Provider = 'airtel' | 'vodacom' | 'orange';

export const MobileMoneyPayment = ({
  amount,
  description,
  onSuccess,
  onCancel,
}: MobileMoneyPaymentProps) => {
  const { toast } = useToast();
  const [provider, setProvider] = useState<Provider>('vodacom');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [transactionId, setTransactionId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('processing');

    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.length < 9) {
        throw new Error('Numéro de téléphone invalide');
      }

      // Simulate API call to Mobile Money provider
      // In production, this would call PawaPay or similar API
      const response = await simulateMobileMoneyPayment({
        provider,
        phoneNumber,
        amount,
        description,
      });

      if (response.success) {
        setTransactionId(response.transactionId);
        setStep('success');
        toast({
          title: "Paiement réussi",
          description: `Transaction ${response.transactionId} confirmée`,
        });

        setTimeout(() => {
          onSuccess(response.transactionId);
        }, 2000);
      } else {
        setStep('error');
        toast({
          title: "Erreur de paiement",
          description: response.error || "Le paiement a échoué",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setStep('error');
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep('input');
    setPhoneNumber('');
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paiement Mobile Money</DialogTitle>
          <DialogDescription>
            Montant à payer : <span className="font-bold text-primary">{amount}$</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Opérateur</Label>
                <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vodacom">Vodacom</SelectItem>
                    <SelectItem value="airtel">Airtel</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+243 XXX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez le numéro associé à votre compte {provider.toUpperCase()}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Vous recevrez une demande de confirmation sur votre téléphone. Entrez le code PIN pour valider.
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit"
                  disabled={loading || !phoneNumber}
                  className="flex-1 gradient-primary text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    `Payer ${amount}$`
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'processing' && (
            <div className="space-y-4 text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <h3 className="font-bold">Traitement du paiement...</h3>
              <p className="text-sm text-muted-foreground">
                Veuillez vérifier votre téléphone pour la demande de confirmation.
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-green-600">Paiement réussi !</h3>
              <p className="text-sm text-muted-foreground">
                Transaction : {transactionId}
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="space-y-4 text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-bold text-red-600">Erreur de paiement</h3>
              <p className="text-sm text-muted-foreground">
                Veuillez vérifier vos informations et réessayer.
              </p>
              <Button 
                onClick={handleRetry}
                className="w-full gradient-primary text-white"
              >
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simulate Mobile Money payment API call
async function simulateMobileMoneyPayment({
  provider,
  phoneNumber,
  amount,
  description,
}: {
  provider: Provider;
  phoneNumber: string;
  amount: number;
  description: string;
}): Promise<{ success: boolean; transactionId: string; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // In production, this would call the actual API
  // For now, we simulate a successful payment 95% of the time
  const success = Math.random() > 0.05;

  if (success) {
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Log transaction locally (in production, this would be saved to the database)
    console.log('Mobile Money Transaction:', {
      transactionId,
      provider,
      phoneNumber,
      amount,
      description,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    return { success: true, transactionId };
  } else {
    return {
      success: false,
      transactionId: '',
      error: 'La transaction a été refusée. Veuillez vérifier vos informations.',
    };
  }
}
