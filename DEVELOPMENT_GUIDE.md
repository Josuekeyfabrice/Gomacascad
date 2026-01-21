# Guide de Développement - goma-connect

## Vue d'ensemble

**goma-connect** est une plateforme de commerce électronique mobile-first construite avec React, Vite, TypeScript et Supabase. Cette application est conçue pour les utilisateurs de Goma et offre des fonctionnalités avancées de vente, d'achat et d'interaction sociale.

## Architecture

### Structure du Projet

```
src/
├── components/        # Composants réutilisables
│   ├── common/       # Composants génériques (LoadingState, ImageOptimizer)
│   ├── layout/       # Composants de mise en page (Header, Footer)
│   ├── profile/      # Composants de profil (SellerProofCard, EscrowStatus)
│   ├── products/     # Composants de produits (SecureBuyButton, BoostProduct)
│   ├── payments/     # Composants de paiement (MobileMoneyPayment)
│   ├── reviews/      # Composants d'avis (ReviewsList, ReviewForm)
│   └── calls/        # Composants d'appels (IncomingCallDialog)
├── pages/            # Pages principales
├── hooks/            # Hooks personnalisés
├── styles/           # Configuration du thème
├── integrations/     # Intégrations externes (Supabase, Mapbox)
└── types/            # Définitions TypeScript
```

### Stack Technologique

- **Frontend** : React 18, Vite, TypeScript
- **Styling** : Tailwind CSS, shadcn/ui
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Cartes** : Mapbox GL
- **Paiements** : PawaPay (Mobile Money)
- **Déploiement** : Vercel

## Fonctionnalités Principales

### 1. Authentification & Profils
- Inscription/Connexion avec email
- Récupération de mot de passe oublié
- Profils vendeurs et acheteurs
- Vérification d'identité par IA

### 2. Système de Transactions Sécurisées
- **Séquestre (Escrow)** : Les fonds sont bloqués jusqu'à confirmation de réception
- Historique des transactions
- Gestion des litiges

### 3. Monétisation
- **Annonces Boostées** : Vendeurs peuvent promouvoir leurs produits
- **Mobile Money** : Intégration directe des paiements mobiles
- Tableau de bord vendeur avec statistiques

### 4. Fonctionnalités Sociales
- **Système d'Avis** : Notes, commentaires et photos
- **Live Shopping** : Présentations vidéo en direct
- **Profils Publics** : Badges de confiance et preuves sociales

### 5. Optimisations Locales
- **Mode Hors-Ligne** : Cache local pour connexions instables
- **Cartographie de Proximité** : Trouver des vendeurs à proximité
- **Indicateur de Connexion** : Affiche l'état du réseau

## Conventions de Code

### Nommage

- **Composants** : PascalCase (ex: `ReviewForm.tsx`)
- **Fichiers** : kebab-case pour les pages, PascalCase pour les composants
- **Variables** : camelCase
- **Constantes** : UPPER_SNAKE_CASE

### Structure des Composants

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export const MyComponent = ({ title, onAction }: ComponentProps) => {
  const [state, setState] = useState(false);

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={onAction}>Action</Button>
    </div>
  );
};
```

### Hooks Personnalisés

Tous les hooks doivent :
- Commencer par `use`
- Être placés dans `src/hooks/`
- Inclure la gestion des erreurs
- Nettoyer les ressources dans `useEffect`

Exemple :
```typescript
export const useMyHook = (dependency: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch logic
  }, [dependency]);

  return { data, loading, error };
};
```

## Optimisations de Performance

### 1. Lazy Loading

Tous les composants de page doivent être chargés dynamiquement :

```typescript
const MyPage = lazy(() => import('./pages/MyPage'));
```

### 2. Caching

Utiliser le hook `useOptimizedCache` pour les requêtes Supabase :

```typescript
const { data, loading, error } = useOptimizedCache(
  'products-list',
  () => supabase.from('products').select('*'),
  { ttl: 5 * 60 * 1000 } // 5 minutes
);
```

### 3. Images

Utiliser le composant `ImageOptimizer` pour charger les images :

```typescript
<ImageOptimizer
  src={imageUrl}
  alt="Product"
  quality="medium"
  width={300}
  height={300}
/>
```

## Gestion d'État

### Supabase Queries

Toujours utiliser le pattern suivant :

```typescript
const { data, error } = await supabase
  .from('table')
  .select('*')
  .eq('column', value);

if (error) {
  console.error('Error:', error);
  toast({ title: 'Erreur', variant: 'destructive' });
}
```

### React Query (si nécessaire)

Pour les requêtes complexes, considérer l'utilisation de React Query :

```typescript
const { data, isLoading, error } = useQuery(
  ['products'],
  () => supabase.from('products').select('*')
);
```

## Styles & Thème

### Utilisation de Tailwind CSS

- Utiliser les classes Tailwind pour le styling
- Respecter la configuration du thème dans `src/styles/theme.ts`
- Éviter les styles inline sauf pour les valeurs dynamiques

### Couleurs Principales

- **Primaire** : `bg-primary` ou `gradient-primary`
- **Secondaire** : `bg-secondary`
- **Succès** : `bg-green-500`
- **Erreur** : `bg-red-500`
- **Avertissement** : `bg-amber-500`

## Gestion des Erreurs

### Toast Notifications

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: 'Succès',
  description: 'L\'action a été complétée',
});

toast({
  title: 'Erreur',
  description: 'Une erreur est survenue',
  variant: 'destructive',
});
```

### Gestion des Erreurs Supabase

```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  // Process data
} catch (error: any) {
  console.error('Error:', error);
  toast({
    title: 'Erreur',
    description: error.message || 'Une erreur est survenue',
    variant: 'destructive',
  });
}
```

## Déploiement

### Vercel

1. Connecter le dépôt GitHub à Vercel
2. Configurer les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MAPBOX_TOKEN`

3. Déployer avec `git push`

### Build

```bash
npm run build
npm run preview
```

## Testing

### Checklist de Test

- [ ] Authentification (inscription, connexion, mot de passe oublié)
- [ ] Création et édition de produits
- [ ] Système de transactions
- [ ] Paiements Mobile Money
- [ ] Avis et notations
- [ ] Live Shopping
- [ ] Mode hors-ligne
- [ ] Cartographie de proximité
- [ ] Performance sur réseau lent

## Maintenance

### Mises à Jour des Dépendances

```bash
npm outdated
npm update
npm audit fix
```

### Monitoring

- Surveiller les erreurs Supabase
- Vérifier les performances avec Lighthouse
- Analyser l'utilisation des données

## Support & Contribution

Pour les questions ou les contributions :
1. Créer une issue sur GitHub
2. Forker le dépôt
3. Créer une branche feature
4. Soumettre une pull request

## Ressources

- [Documentation React](https://react.dev)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Vite](https://vitejs.dev)
