import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet as WalletIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CreditCard, 
  Smartphone,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Wallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("5");
  const [isLoading, setIsLoading] = useState(false);
  
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'recharge', amount: 10, date: '2026-01-15', status: 'completed', method: 'M-Pesa' },
    { id: 2, type: 'payment', amount: -2, date: '2026-01-14', status: 'completed', description: 'Boost Annonce' },
    { id: 3, type: 'payment', amount: -1, date: '2026-01-14', status: 'completed', description: 'Pass TV Journalier' },
  ]);

  const handleRecharge = async () => {
    setIsLoading(true);
    // Simulation de l'appel PawaPay avec le jeton fourni
    setTimeout(() => {
      setIsLoading(false);
      setIsRechargeOpen(false);
      toast({
        title: "Demande de paiement envoyée",
        description: `Veuillez confirmer le paiement de ${rechargeAmount}$ sur votre téléphone.`,
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black font-display flex items-center gap-3">
                <WalletIcon className="h-8 w-8 text-primary" />
                Mon Portefeuille
              </h1>
              <p className="text-muted-foreground mt-1">Gérez votre solde et vos transactions GOMACASCADE.</p>
            </div>
            
            <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary rounded-xl gap-2 font-bold shadow-lg hover:scale-105 transition-transform">
                  <Plus className="h-5 w-5" /> Recharge
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black font-display">Recharger mon compte</DialogTitle>
                  <DialogDescription>
                    Choisissez le montant à ajouter à votre portefeuille GOMACASCADE.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="amount" className="font-bold">Montant (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                      <Input
                        id="amount"
                        type="number"
                        value={rechargeAmount}
                        onChange={(e) => setRechargeAmount(e.target.value)}
                        className="pl-8 rounded-xl border-2 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["5", "10", "20"].map((amt) => (
                      <Button 
                        key={amt}
                        variant={rechargeAmount === amt ? "default" : "outline"}
                        onClick={() => setRechargeAmount(amt)}
                        className="rounded-xl font-bold"
                      >
                        ${amt}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-muted-foreground">Méthode de paiement sécurisée</p>
                    <div className="flex items-center gap-3 p-3 border-2 border-primary/20 rounded-2xl bg-primary/5">
                      <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <Smartphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">PawaPay (Mobile Money)</p>
                        <p className="text-[10px] text-muted-foreground">M-Pesa, Airtel, Orange</p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleRecharge} 
                  disabled={isLoading}
                  className="w-full gradient-primary h-12 rounded-xl font-bold text-lg"
                >
                  {isLoading ? "Traitement..." : `Payer ${rechargeAmount}$ maintenant`}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Paiement sécurisé par PawaPay
                </p>
              </DialogContent>
            </Dialog>
          </div>

          {/* Balance Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-primary text-primary-foreground overflow-hidden relative rounded-[2.5rem] border-none shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <WalletIcon size={120} />
              </div>
              <CardContent className="p-10 space-y-6 relative z-10">
                <p className="text-primary-foreground/80 font-medium uppercase tracking-wider">Solde Actuel</p>
                <h2 className="text-6xl font-black font-display">$ {balance.toFixed(2)}</h2>
                <div className="flex gap-4 pt-4">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-2 rounded-full backdrop-blur-md">
                    Compte Vérifié
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none px-4 py-2 rounded-full backdrop-blur-md">
                    Goma, RDC
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-3xl border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-2xl">
                  <ArrowDownLeft className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entrées</p>
                  <p className="text-xl font-bold text-green-600">+$10.00</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sorties</p>
                  <p className="text-xl font-bold text-red-600">-$3.00</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-xl font-bold text-primary">3</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions History */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Historique Récent
            </h3>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card key={tx.id} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${tx.type === 'recharge' ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                        {tx.type === 'recharge' ? <Smartphone className="h-5 w-5 text-green-600" /> : <CreditCard className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-bold">{tx.type === 'recharge' ? `Recharge via ${tx.method}` : tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black ${tx.type === 'recharge' ? 'text-green-600' : 'text-foreground'}`}>
                        {tx.type === 'recharge' ? '+' : ''}{tx.amount.toFixed(2)}$
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-1">
                        {tx.status === 'completed' ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-green-200 text-green-600 bg-green-50">
                            <CheckCircle2 className="h-2 w-2 mr-1" /> Succès
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-200 text-amber-600 bg-amber-50">
                            <Clock className="h-2 w-2 mr-1" /> En attente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wallet;
