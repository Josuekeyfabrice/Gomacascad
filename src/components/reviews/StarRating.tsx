import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
}: StarRatingProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const handleClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex gap-0.5">
      {[...Array(maxRating)].map((_, index) => (
        <Star
          key={index}
          className={cn(
            sizeClasses[size],
            index < rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-muted text-muted-foreground',
            interactive && 'cursor-pointer hover:scale-110 transition-transform'
          )}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
};
