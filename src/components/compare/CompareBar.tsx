import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompare } from './CompareContext';

export const CompareBar = () => {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();

  if (compareProducts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50 p-4">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          <span className="text-sm font-medium whitespace-nowrap">
            Comparer ({compareProducts.length}/4)
          </span>
          <div className="flex gap-2">
            {compareProducts.map((product) => (
              <div key={product.id} className="relative flex-shrink-0">
                <img
                  src={product.images?.[0] || '/placeholder.svg'}
                  alt={product.name}
                  className="w-12 h-12 rounded-md object-cover border"
                />
                <button
                  onClick={() => removeFromCompare(product.id)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearCompare}>
            Effacer
          </Button>
          <Button asChild size="sm" disabled={compareProducts.length < 2}>
            <Link to="/compare" className="gap-2">
              <GitCompare className="h-4 w-4" />
              Comparer
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
