-- S'assurer que la colonne is_verified existe dans la table profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Mettre à jour les politiques RLS pour permettre la mise à jour de is_verified par l'utilisateur lui-même 
-- (Dans un système réel, cela serait restreint, mais ici on permet la simulation de l'IA côté client)
CREATE POLICY "Users can update their own verification status" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Note: Si la politique existe déjà, cette commande peut échouer, ce qui est normal.
-- L'important est que la colonne existe.
