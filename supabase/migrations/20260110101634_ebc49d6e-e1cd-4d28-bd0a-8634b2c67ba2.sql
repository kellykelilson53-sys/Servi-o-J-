-- Add location columns to workers table for storing worker's base GPS location
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_workers_location ON public.workers (location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.workers.location_lat IS 'Worker base location latitude captured during registration';
COMMENT ON COLUMN public.workers.location_lng IS 'Worker base location longitude captured during registration';
COMMENT ON COLUMN public.workers.location_address IS 'Worker base location address (optional)';