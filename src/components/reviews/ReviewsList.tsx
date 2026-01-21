import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquare, ThumbsUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reviewer_name: string;
  reviewer_avatar?: string;
  created_at: string;
}

interface ReviewsListProps {
  productId?: string;
  sellerId?: string;
  limit?: number;
}

export const ReviewsList = ({ productId, sellerId, limit = 10 }: ReviewsListProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        let query = supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (productId) {
          query = query.eq('product_id', productId);
        } else if (sellerId) {
          query = query.eq('seller_id', sellerId);
        }

        const { data, error } = await query.limit(limit);

        if (error) throw error;

        // Fetch reviewer information
        if (data && data.length > 0) {
          const reviewerIds = [...new Set(data.map(r => r.reviewer_id))];
          const { data: reviewersData } = await supabase
            .from('profiles')
            .select('user_id, full_name, avatar_url')
            .in('user_id', reviewerIds);

          const reviewsWithInfo = data.map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
            reviewer_name: reviewersData?.find(r => r.user_id === review.reviewer_id)?.full_name || 'Utilisateur anonyme',
            reviewer_avatar: reviewersData?.find(r => r.user_id === review.reviewer_id)?.avatar_url || undefined,
          }));

          setReviews(reviewsWithInfo);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les avis",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, sellerId, limit, toast]);

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground mb-2">Aucun avis pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Soyez le premier à laisser un avis !
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgRating = getAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">{avgRating}</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(parseFloat(avgRating.toString()))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Basé sur {reviews.length} avis
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-8">{rating}★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400"
                      style={{
                        width: `${reviews.length > 0 ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {distribution[rating as keyof typeof distribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review.reviewer_avatar && (
                    <img
                      src={review.reviewer_avatar}
                      alt={review.reviewer_name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold">{review.reviewer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= review.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-muted-foreground mb-4">{review.comment}</p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 pt-4 border-t">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Utile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
