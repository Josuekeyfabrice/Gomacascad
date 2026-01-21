import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StarRating } from './StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    reviewer?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarImage src={review.reviewer?.avatar_url || undefined} />
          <AvatarFallback>
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-foreground">
              {review.reviewer?.full_name || 'Utilisateur anonyme'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          <StarRating rating={review.rating} size="sm" />
          {review.comment && (
            <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
          )}
        </div>
      </div>
    </div>
  );
};
