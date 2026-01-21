-- Add call_type column to calls table
ALTER TABLE public.calls 
ADD COLUMN call_type TEXT DEFAULT 'voice' CHECK (call_type IN ('voice', 'video'));