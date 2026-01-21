-- Add rating columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;

-- Function to update seller rating
CREATE OR REPLACE FUNCTION public.update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        UPDATE public.profiles
        SET 
            rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.reviews
                WHERE seller_id = NEW.seller_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM public.reviews
                WHERE seller_id = NEW.seller_id
            ),
            updated_at = now()
        WHERE user_id = NEW.seller_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles
        SET 
            rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.reviews
                WHERE seller_id = OLD.seller_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM public.reviews
                WHERE seller_id = OLD.seller_id
            ),
            updated_at = now()
        WHERE user_id = OLD.seller_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sync rating
CREATE OR REPLACE TRIGGER tr_on_review_sync_rating
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_seller_rating();
