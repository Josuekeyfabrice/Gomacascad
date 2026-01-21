-- Add discount fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS original_price numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT NULL;

-- Add index for discounted products
CREATE INDEX IF NOT EXISTS idx_products_discount ON public.products (discount_percentage) WHERE discount_percentage IS NOT NULL AND discount_percentage > 0;