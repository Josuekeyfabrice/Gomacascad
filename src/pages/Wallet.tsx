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
import { pawapayService } from '@/services/pawapay';

const Wallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("5");
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [walletId, setWalletId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    try {
      // Get or create wallet
      let { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (walletError) throw walletError;

      if (!wallet && user) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();

        if (createError) throw createError;
        wallet = newWallet;
      }

      if (wallet) {
        setBalance(Number(wallet.balance));
        setWalletId(wallet.id);

        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false });

        if (txError) throw txError;
        setTransactions(txData || []);
      }
    } catch (error: any) {
      console.error('Error fetching wallet:', error);
      let errorMessage = "Impossible de charger votre portefeuille";
      
      if (error.message?.includes('relation "wallets" does not exist') || error.message?.includes('relation "wallet_transactions" does not exist') || error.message?.includes('Could not find the table')) {
        errorMessage = "Les tables de base de données (wallets) sont manquantes. Veuillez exécuter le script SQL de migration dans votre interface Supabase.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erreur de base de données",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleRecharge = async () => {
    if (!walletId || !user) return;

    if (!phoneNumber || phoneNumber.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call real PawaPay API
      const pawaRes = await pawapayService.initiatePayment(
        parseFloat(rechargeAmount),
        phoneNumber,
        `Recharge GOMACASCADE - ${user.id}`
      );

      // 2. Insert transaction into our DB
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: walletId,
          type: 'recharge',
          amount: parseFloat(rechargeAmount),
          status: 'pending',
          method: 'PawaPay',
          description: `PawaPay: ${pawaRes.depositId || 'Recharge'}`
        });

      if (error) throw error;

      setIsRechargeOpen(false);
      toast({
        title: "Paiement initié !",
        description: `Une demande de ${rechargeAmount}$ a été envoyée au ${phoneNumber}. Validez avec votre code PIN.`,
      });

      // Refresh transactions
      fetchWalletData();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="font-bold">Numéro Mobile Money (Airtel, Vodacom, Orange)</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="081XXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10 rounded-xl border-2 focus:border-primary"
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
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
