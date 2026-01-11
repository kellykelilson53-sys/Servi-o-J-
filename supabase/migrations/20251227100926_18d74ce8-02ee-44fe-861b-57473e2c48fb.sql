-- Enable realtime payloads for admin verification flow
ALTER TABLE public.verification_documents REPLICA IDENTITY FULL;
ALTER TABLE public.workers REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_documents;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
