-- Create table to track user online status
CREATE TABLE public.user_presence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  is_online boolean NOT NULL DEFAULT false,
  last_seen timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone can view presence (needed for chat)
CREATE POLICY "Anyone can view user presence" 
ON public.user_presence 
FOR SELECT 
USING (true);

-- Users can manage their own presence
CREATE POLICY "Users can manage own presence" 
ON public.user_presence 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;