-- Create live_sessions table
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    stream_key TEXT,
    thumbnail_url TEXT,
    viewers_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    featured_products UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view live sessions" 
ON public.live_sessions FOR SELECT 
USING (true);

CREATE POLICY "Sellers can create sessions" 
ON public.live_sessions FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own sessions" 
ON public.live_sessions FOR UPDATE 
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own sessions" 
ON public.live_sessions FOR DELETE 
USING (auth.uid() = seller_id);

-- Function to increment likes (optional but better for concurrency)
CREATE OR REPLACE FUNCTION increment_likes(session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.live_sessions
    SET likes_count = likes_count + 1
    WHERE id = session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
