-- Allow marking messages as read (UPDATE) while preventing content edits

-- 1) Messages: allow recipients (participants) to mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON public.messages
FOR UPDATE
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = messages.booking_id
      AND (
        b.client_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.workers w
          WHERE w.id = b.worker_id
            AND w.user_id = auth.uid()
        )
      )
  )
)
WITH CHECK (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = messages.booking_id
      AND (
        b.client_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.workers w
          WHERE w.id = b.worker_id
            AND w.user_id = auth.uid()
        )
      )
  )
);

-- 2) Safety: prevent users from editing immutable message fields (only allow is_read changes)
CREATE OR REPLACE FUNCTION public.prevent_message_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins can edit (future-proof)
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Allow only is_read to change
  IF NEW.booking_id <> OLD.booking_id
     OR NEW.sender_id <> OLD.sender_id
     OR NEW.content <> OLD.content
     OR NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Only is_read can be updated for messages';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_message_mutation ON public.messages;
CREATE TRIGGER trg_prevent_message_mutation
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.prevent_message_mutation();

-- 3) Workers: allow clients to read the worker row only when they have a booking with that worker
-- (Needed to reliably resolve conversation participants even for non-verified workers)
CREATE POLICY "Clients can view workers for their bookings"
ON public.workers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.worker_id = workers.id
      AND b.client_id = auth.uid()
  )
);
