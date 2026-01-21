-- Add geolocation columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create index for faster geolocation queries
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products (latitude, longitude);

-- Add extension for distance calculations (if not exists)
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION,
  lon1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lon2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT earth_distance(
    ll_to_earth(lat1, lon1),
    ll_to_earth(lat2, lon2)
  ) / 1000 -- Convert to kilometers
$$;