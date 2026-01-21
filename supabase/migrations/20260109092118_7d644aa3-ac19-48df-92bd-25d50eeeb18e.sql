-- Add verified status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Create index for verified sellers
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON public.profiles(is_verified) WHERE is_verified = true;