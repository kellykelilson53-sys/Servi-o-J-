-- Drop and recreate RLS policies for workers to ensure admin access works correctly
DROP POLICY IF EXISTS "Admins can manage all workers" ON public.workers;
DROP POLICY IF EXISTS "Anyone can view verified workers" ON public.workers;

-- Recreate with PERMISSIVE (default)
CREATE POLICY "Admins can manage all workers" 
ON public.workers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view verified workers" 
ON public.workers 
FOR SELECT 
USING ((verification_status = 'verified') OR (auth.uid() = user_id));

-- Fix verification_documents policies for admin access
DROP POLICY IF EXISTS "Admins can view all documents" ON public.verification_documents;
DROP POLICY IF EXISTS "Admins can update documents" ON public.verification_documents;

CREATE POLICY "Admins can view all documents" 
ON public.verification_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update documents" 
ON public.verification_documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));