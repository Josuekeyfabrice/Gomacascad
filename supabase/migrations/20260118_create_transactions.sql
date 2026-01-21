-- Création de la table des transactions pour le système de séquestre
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'completed', 'cancelled', 'disputed')),
    payment_method TEXT,
    escrow_status TEXT NOT NULL DEFAULT 'waiting' CHECK (escrow_status IN ('waiting', 'held', 'released', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
-- 1. Les utilisateurs peuvent voir les transactions où ils sont acheteurs ou vendeurs
CREATE POLICY "Users can view their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 2. Seuls les acheteurs peuvent créer une transaction
CREATE POLICY "Buyers can create transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- 3. Les acheteurs et vendeurs peuvent mettre à jour le statut selon le flux logique
CREATE POLICY "Users can update their own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
