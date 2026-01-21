-- Création de la table des portefeuilles (wallets)
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Création de la table des transactions (wallet_transactions)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('recharge', 'payment', 'withdrawal', 'refund')),
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    method TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de Row Level Security (RLS)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Politiques pour la table wallets
CREATE POLICY "Les utilisateurs peuvent voir leur propre portefeuille" 
ON public.wallets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Le système peut créer un portefeuille pour l'utilisateur" 
ON public.wallets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Politiques pour la table wallet_transactions
CREATE POLICY "Les utilisateurs peuvent voir leurs propres transactions" 
ON public.wallet_transactions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.wallets 
        WHERE wallets.id = wallet_transactions.wallet_id 
        AND wallets.user_id = auth.uid()
    )
);

CREATE POLICY "Les utilisateurs peuvent insérer leurs propres transactions" 
ON public.wallet_transactions FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.wallets 
        WHERE wallets.id = wallet_transactions.wallet_id 
        AND wallets.user_id = auth.uid()
    )
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at
    BEFORE UPDATE ON public.wallets
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
