-- Script de correction pour la vérification d'identité
-- Ce script gère les cas où la colonne s'appelle 'id' ou 'user_id'

DO $$ 
BEGIN 
    -- 1. S'assurer que la colonne is_verified existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    -- 2. Supprimer les anciennes politiques pour éviter les conflits
    DROP POLICY IF EXISTS "Users can update their own verification status" ON public.profiles;
    DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;

    -- 3. Créer une politique robuste basée sur la colonne 'user_id' (qui semble être la clé de liaison dans votre types.ts)
    -- Si votre erreur persiste, c'est que la table utilise 'id' comme identifiant utilisateur.
    
    CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

EXCEPTION
    WHEN undefined_column THEN
        -- Si 'user_id' n'existe pas, on essaie avec 'id'
        CREATE POLICY "Users can update their own profile" ON public.profiles
            FOR UPDATE USING (auth.uid() = id)
            WITH CHECK (auth.uid() = id);
END $$;

-- Donner les accès au rôle authentifié
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
