import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, GitCompare, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/database';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { formatPrice } from '@/lib/utils';
import { useCompare } from '@/components/compare/CompareContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  onFavorite?: (productId: string) => void;
  isFavorite?: boolean;
  distance?: string | null;
}

export const ProductCard = ({ product, onFavorite, isFavorite, distance }: ProductCardProps) => {
  const imageUrl = product.images?.[0] || '/placeholder.svg';
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { toast } = useToast();
  const inCompare = isInCompare(product.id);

  const hasDiscount = product.original_price && product.discount_percentage && product.discount_percentage > 0;

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCompare) {
      removeFromCompare(product.id);
      toast({ title: 'Retiré de la comparaison' });
    } else {
      addToCompare(product);
      toast({ title: 'Ajouté à la comparaison' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden border-none bg-card hover:shadow-2xl transition-all duration-500 h-full flex flex-col">
        <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Badges Overlay */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {product.category && (
              <Badge className="bg-black/50 backdrop-blur-md text-white border-none text-[10px] font-bold uppercase tracking-wider">
                {product.category}
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="bg-primary text-primary-foreground border-none font-black">
                -{product.discount_percentage}%
              </Badge>
            )}
          </div>

          {/* Actions Overlay */}
          <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {onFavorite && (
              <Button
                variant="secondary"
                size="icon"
                className="h-9 w-9 rounded-full shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  onFavorite(product.id);
                }}
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                />
              </Button>
            )}
            <Button
              variant="secondary"
              size="icon"
              className={`h-9 w-9 rounded-full shadow-lg ${inCompare ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={handleCompare}
            >
              <GitCompare className="h-5 w-5" />
            </Button>
          </div>

          {/* Price Tag Overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg">
              <span className="text-lg font-black text-primary">
                {formatPrice(product.price)}
              </span>
            </div>
          </div>
        </Link>

        <CardContent className="p-4 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/product/${product.id}`} className="flex-1">
                <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                  {product.name}
                </h3>
              </Link>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                <span>{product.city || 'Goma'}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Récemment</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold line-clamp-1">
                  {product.profiles?.full_name || 'Vendeur Goma'}
                </span>
                {product.profiles?.is_verified && (
                  <div className="flex items-center gap-1">
                    <VerifiedBadge size="xs" />
                    <span className="text-[10px] text-primary font-bold">Vérifié</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
