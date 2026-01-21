-- Add is_featured column to products table
ALTER TABLE public.products ADD COLUMN is_featured boolean DEFAULT false;

-- Create index for featured products
CREATE INDEX idx_products_is_featured ON public.products (is_featured) WHERE is_featured = true;