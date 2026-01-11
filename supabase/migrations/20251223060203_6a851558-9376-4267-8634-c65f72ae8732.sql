-- Drop existing city enum and recreate with all Angola provinces
ALTER TYPE public.city RENAME TO city_old;

CREATE TYPE public.city AS ENUM (
  'Bengo',
  'Benguela',
  'Bié',
  'Cabinda',
  'Cuando Cubango',
  'Cuanza Norte',
  'Cuanza Sul',
  'Cunene',
  'Huambo',
  'Huíla',
  'Luanda',
  'Lunda Norte',
  'Lunda Sul',
  'Malanje',
  'Moxico',
  'Namibe',
  'Uíge',
  'Zaire'
);

-- Update profiles table to use new enum
ALTER TABLE public.profiles 
  ALTER COLUMN city DROP DEFAULT,
  ALTER COLUMN city TYPE public.city USING city::text::public.city,
  ALTER COLUMN city SET DEFAULT 'Luanda'::public.city;

-- Drop old enum
DROP TYPE public.city_old;