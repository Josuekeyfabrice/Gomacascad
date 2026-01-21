import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/types/database';

interface CompareContextType {
  compareProducts: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [compareProducts, setCompareProducts] = useState<Product[]>([]);

  const addToCompare = (product: Product) => {
    if (compareProducts.length < 4 && !compareProducts.find(p => p.id === product.id)) {
      setCompareProducts(prev => [...prev, product]);
    }
  };

  const removeFromCompare = (productId: string) => {
    setCompareProducts(prev => prev.filter(p => p.id !== productId));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  const isInCompare = (productId: string) => {
    return compareProducts.some(p => p.id === productId);
  };

  return (
    <CompareContext.Provider value={{ compareProducts, addToCompare, removeFromCompare, clearCompare, isInCompare }}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
