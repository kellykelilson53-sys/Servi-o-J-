-- Trigger function to auto-update worker earnings and completed_jobs when booking is completed
CREATE OR REPLACE FUNCTION public.update_worker_earnings_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run when status changes to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.workers
    SET 
      total_earnings = total_earnings + COALESCE(NEW.total_price, 0),
      completed_jobs = completed_jobs + 1
    WHERE id = NEW.worker_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on bookings table
DROP TRIGGER IF EXISTS trigger_update_worker_earnings ON public.bookings;
CREATE TRIGGER trigger_update_worker_earnings
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_worker_earnings_on_completion();

-- Also handle direct INSERT with completed status (edge case)
DROP TRIGGER IF EXISTS trigger_update_worker_earnings_insert ON public.bookings;
CREATE TRIGGER trigger_update_worker_earnings_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.update_worker_earnings_on_completion();

-- Fix existing data: recalculate earnings for workers with completed bookings
UPDATE public.workers w
SET 
  total_earnings = COALESCE(sub.total, 0),
  completed_jobs = COALESCE(sub.count, 0)
FROM (
  SELECT 
    worker_id,
    SUM(total_price) as total,
    COUNT(*) as count
  FROM public.bookings
  WHERE status = 'completed'
  GROUP BY worker_id
) sub
WHERE w.id = sub.worker_id;