import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { CATEGORIES } from '@/types/database';
import {
  Smartphone,
  Car,
  Home,
  Shirt,
  Sofa,
  Dumbbell,
  Wrench,
  Briefcase,
  UtensilsCrossed,
  Package,
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'Électronique': <Smartphone className="h-5 w-5" />,
  'Véhicules': <Car className="h-5 w-5" />,
  'Immobilier': <Home className="h-5 w-5" />,
  'Mode & Vêtements': <Shirt className="h-5 w-5" />,
  'Maison & Jardin': <Sofa className="h-5 w-5" />,
  'Sports & Loisirs': <Dumbbell className="h-5 w-5" />,
  'Services': <Wrench className="h-5 w-5" />,
  'Emploi': <Briefcase className="h-5 w-5" />,
  'Alimentation': <UtensilsCrossed className="h-5 w-5" />,
  'Autres': <Package className="h-5 w-5" />,
};

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-4">
        <Button
          variant={selectedCategory === null ? 'default' : 'outline'}
          className={selectedCategory === null ? 'gradient-primary text-primary-foreground' : ''}
          onClick={() => onCategoryChange(null)}
        >
          Tout
        </Button>
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className={`gap-2 ${selectedCategory === category ? 'gradient-primary text-primary-foreground' : ''}`}
            onClick={() => onCategoryChange(category)}
          >
            {categoryIcons[category]}
            {category}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
