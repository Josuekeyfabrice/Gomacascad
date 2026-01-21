import { Link } from 'react-router-dom';
import { ArrowLeft, X, MapPin, Eye, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCompare } from '@/components/compare/CompareContext';
import { formatPrice } from '@/lib/utils';

const Compare = () => {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Aucun produit à comparer</h1>
            <p className="text-muted-foreground mb-6">
              Ajoutez des produits depuis les annonces pour les comparer.
            </p>
            <Button asChild>
              <Link to="/">Parcourir les annonces</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const compareFields = [
    { key: 'price', label: 'Prix', render: (p: any) => (
      <div>
        {p.original_price && p.discount_percentage ? (
          <>
            <span className="text-lg font-bold text-primary">{formatPrice(p.price)}</span>
            <span className="ml-2 text-sm line-through text-muted-foreground">{formatPrice(p.original_price)}</span>
            <Badge className="ml-2 bg-destructive text-destructive-foreground">-{p.discount_percentage}%</Badge>
          </>
        ) : (
          <span className="text-lg font-bold text-primary">{formatPrice(p.price)}</span>
        )}
      </div>
    )},
    { key: 'category', label: 'Catégorie', render: (p: any) => p.category || '-' },
    { key: 'city', label: 'Ville', render: (p: any) => p.city },
    { key: 'views_count', label: 'Vues', render: (p: any) => p.views_count || 0 },
    { key: 'description', label: 'Description', render: (p: any) => (
      <p className="text-sm text-muted-foreground line-clamp-3">{p.description || 'Aucune description'}</p>
    )},
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <h1 className="text-2xl font-bold font-display">
              Comparer les produits ({compareProducts.length})
            </h1>
          </div>
          <Button variant="outline" onClick={clearCompare} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Tout effacer
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="p-2 text-left w-32"></th>
                {compareProducts.map((product) => (
                  <th key={product.id} className="p-2 text-center">
                    <Card className="relative">
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Link to={`/product/${product.id}`}>
                        <div className="aspect-square overflow-hidden rounded-t-lg">
                          <img
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-semibold line-clamp-2 text-sm">{product.name}</h3>
                        </CardContent>
                      </Link>
                    </Card>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field, index) => (
                <tr key={field.key} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                  <td className="p-3 font-medium text-sm">{field.label}</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-3 text-center">
                      {field.render(product)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {compareProducts.map((product) => (
            <Button key={product.id} asChild className="w-full">
              <Link to={`/product/${product.id}`}>
                Voir l'annonce
              </Link>
            </Button>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Compare;
