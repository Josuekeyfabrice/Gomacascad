import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ReviewFormProps {
  sellerId: string;
  productId?: string;
  onReviewSubmitted: () => void;
}

export const ReviewForm = ({ sellerId, productId, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour laisser un avis',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Note requise',
        description: 'Veuillez sélectionner une note',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        reviewer_id: user.id,
        seller_id: sellerId,
        product_id: productId || null,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Avis envoyé',
        description: 'Merci pour votre avis!',
      });

      setRating(0);
      setComment('');
      onReviewSubmitted();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Erreur',
        description: error.message.includes('unique') 
          ? 'Vous avez déjà laissé un avis pour ce vendeur'
          : 'Impossible d\'envoyer l\'avis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (user.id === sellerId) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-foreground">Laisser un avis</h3>
      
      <div>
        <label className="block text-sm text-muted-foreground mb-2">Votre note</label>
        <StarRating rating={rating} interactive onRatingChange={setRating} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-2">
          Commentaire (optionnel)
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Décrivez votre expérience avec ce vendeur..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading || rating === 0}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Envoi...
          </>
        ) : (
          'Envoyer l\'avis'
        )}
      </Button>
    </form>
  );
};
