import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from './StarRating';
import { ReviewCard } from './ReviewCard';
import { ReviewForm } from './ReviewForm';
import { Loader2 } from 'lucide-react';

interface SellerReviewsProps {
  sellerId: string;
  productId?: string;
}

export const SellerReviews = ({ sellerId, productId }: SellerReviewsProps) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else if (data) {
      // Fetch reviewer profiles separately
      const reviewerIds = [...new Set(data.map(r => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', reviewerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const reviewsWithProfiles = data.map(review => ({
        ...review,
        reviewer: profileMap.get(review.reviewer_id),
      }));

      setReviews(reviewsWithProfiles);
      
      if (data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4 bg-card border rounded-lg p-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{averageRating || '-'}</div>
          <StarRating rating={Math.round(averageRating)} size="sm" />
        </div>
        <div className="text-muted-foreground">
          {reviews.length} avis
        </div>
      </div>

      {/* Review form */}
      <ReviewForm 
        sellerId={sellerId} 
        productId={productId}
        onReviewSubmitted={fetchReviews} 
      />

      {/* Reviews list */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Avis des acheteurs</h3>
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Aucun avis pour le moment
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};
