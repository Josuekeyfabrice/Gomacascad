import { useState } from 'react';
import { Zap, Check, ShieldCheck, TrendingUp, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface BoostOption {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  icon: React.ReactNode;
  color: string;
}

const boostOptions: BoostOption[] = [
  {
    id: 'basic',
    name: 'Boost Visibilité',
    price: 2,
    duration: '3 jours',
    features: ['+500 vues garanties', 'Badge "Populaire"', 'Priorité basse'],
    icon: <Eye className="h-5 w-5" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
  },
  {
    id: 'premium',
    name: 'Boost Premium',
    price: 5,
    duration: '7 jours',
    features: ['+1500 vues garanties', 'Badge "Top Vente"', 'Priorité haute', 'Apparaît en Tendances'],
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    id: 'ultra',
    name: 'Boost Ultra',
    price: 10,
    duration: '15 jours',
    features: ['Vues illimitées', 'Badge "Vendeur Star"', 'Notification aux abonnés', 'Support 24/7'],
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-amber-500/10 text-amber-600 border-amber-200',
  },
];

export const BoostDialog = ({ productId, productName }: { productId: string, productName: string }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const { toast } = useToast();

  const handleBoost = () => {
    if (!selectedOption) return;
    
    const option = boostOptions.find(o => o.id === selectedOption);
    
    // Redirection vers WhatsApp pour le paiement manuel (en attendant PawaPay)
    const message = `Bonjour GOMACASCADE, je souhaite booster mon annonce "${productName}" (ID: ${productId}) avec le forfait ${option?.name} (${option?.price}$).`;
    const whatsappUrl = `https://wa.me/243893645600?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast({
      title: "Demande envoyée",
      description: "Veuillez confirmer le paiement sur WhatsApp.",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 gradient-primary shadow-lg font-bold">
          <Zap className="h-4 w-4 fill-current" />
          Booster cette annonce
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary fill-current" />
            Booster votre visibilité
          </DialogTitle>
          <DialogDescription>
            Choisissez un forfait pour vendre votre article plus rapidement à Goma.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {boostOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedOption === option.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg ${option.color}`}>
                  {option.icon}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">{option.price}$</span>
                  <p className="text-xs text-muted-foreground">{option.duration}</p>
                </div>
              </div>
              
              <h3 className="font-bold text-lg">{option.name}</h3>
              
              <ul className="mt-3 space-y-2">
                {option.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3 w-3 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {selectedOption === option.id && (
                <div className="absolute top-2 right-2">
                  <div className="bg-primary rounded-full p-1">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Button 
          className="w-full h-12 rounded-xl font-bold text-lg" 
          disabled={!selectedOption}
          onClick={handleBoost}
        >
          Confirmer et Payer
        </Button>
      </DialogContent>
    </Dialog>
  );
};
