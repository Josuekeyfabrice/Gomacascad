-- Création de la table des stories pour les ventes flash
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    product_name TEXT,
    price TEXT,
    is_live BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité
-- 1. Tout le monde peut voir les stories non expirées
CREATE POLICY "Anyone can view active stories" ON public.stories
    FOR SELECT USING (expires_at > now());

-- 2. Les utilisateurs peuvent créer leurs propres stories
CREATE POLICY "Users can create their own stories" ON public.stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Les utilisateurs peuvent supprimer leurs propres stories
CREATE POLICY "Users can delete their own stories" ON public.stories
    FOR DELETE USING (auth.uid() = user_id);

-- Index pour la performance
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories (expires_at);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories (user_id);
