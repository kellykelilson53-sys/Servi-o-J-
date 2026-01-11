-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create verification_status enum
CREATE TYPE public.verification_status AS ENUM ('not_verified', 'pending', 'verified', 'rejected');

-- Create booking_status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled');

-- Create user_role enum for client/worker
CREATE TYPE public.user_type AS ENUM ('client', 'worker');

-- Create service_type enum
CREATE TYPE public.service_type AS ENUM ('barber', 'car_wash', 'laundry', 'electrician', 'plumber', 'mechanic', 'cleaning', 'tutor', 'handyman', 'painter', 'gardener', 'beauty');

-- Create city enum
CREATE TYPE public.city AS ENUM ('Luanda', 'Benguela', 'Huambo', 'Lobito', 'Cabinda', 'Lubango', 'Sumbe', 'Malanje', 'Namibe', 'Soyo');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city public.city NOT NULL DEFAULT 'Luanda',
  user_type public.user_type NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create workers table
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  service_type public.service_type NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT false,
  offers_home_service BOOLEAN NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'not_verified',
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified workers"
  ON public.workers FOR SELECT
  USING (verification_status = 'verified' OR auth.uid() = user_id);

CREATE POLICY "Workers can update own profile"
  ON public.workers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Workers can insert own profile"
  ON public.workers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all workers"
  ON public.workers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create verification_documents table
CREATE TABLE public.verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  bi_number TEXT NOT NULL,
  birth_date DATE NOT NULL,
  address TEXT NOT NULL,
  selfie_url TEXT,
  bi_front_url TEXT,
  bi_back_url TEXT,
  ai_verification_result JSONB,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage own documents"
  ON public.verification_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workers WHERE id = verification_documents.worker_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all documents"
  ON public.verification_documents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update documents"
  ON public.verification_documents FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create worker_portfolio table
CREATE TABLE public.worker_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio"
  ON public.worker_portfolio FOR SELECT
  USING (true);

CREATE POLICY "Workers can manage own portfolio"
  ON public.worker_portfolio FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workers WHERE id = worker_portfolio.worker_id AND user_id = auth.uid()
  ));

-- Create worker_schedule table
CREATE TABLE public.worker_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedules"
  ON public.worker_schedule FOR SELECT
  USING (true);

CREATE POLICY "Workers can manage own schedule"
  ON public.worker_schedule FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workers WHERE id = worker_schedule.worker_id AND user_id = auth.uid()
  ));

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  service_type public.service_type NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  distance_km DECIMAL(10,2),
  base_price DECIMAL(10,2) NOT NULL,
  distance_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  worker_rating INTEGER CHECK (worker_rating >= 1 AND worker_rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Workers can view their bookings"
  ON public.bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workers WHERE id = bookings.worker_id AND user_id = auth.uid()
  ));

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Workers can update their bookings"
  ON public.bookings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workers WHERE id = bookings.worker_id AND user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  on_time BOOLEAN,
  satisfactory BOOLEAN,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their bookings"
  ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = messages.booking_id 
    AND (client_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.workers WHERE id = bookings.worker_id AND user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can send messages to their bookings"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = messages.booking_id 
      AND (client_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.workers WHERE id = bookings.worker_id AND user_id = auth.uid()
      ))
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create worker_locations table for real-time tracking
CREATE TABLE public.worker_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE UNIQUE,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.worker_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage own location"
  ON public.worker_locations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workers WHERE id = worker_locations.worker_id AND user_id = auth.uid()
  ));

CREATE POLICY "Clients can view worker locations for active bookings"
  ON public.worker_locations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings b
    JOIN public.workers w ON w.id = b.worker_id
    WHERE w.id = worker_locations.worker_id
    AND b.client_id = auth.uid()
    AND b.status IN ('accepted', 'in_progress')
  ));

-- Enable realtime for worker_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_locations;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, city, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Usuário'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'city')::public.city, 'Luanda'),
    COALESCE((NEW.raw_user_meta_data ->> 'user_type')::public.user_type, 'client')
  );
  
  -- If user is a worker, create worker record
  IF (NEW.raw_user_meta_data ->> 'user_type') = 'worker' THEN
    INSERT INTO public.workers (user_id, service_type)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data ->> 'service_type')::public.service_type, 'handyman')
    );
  END IF;
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verification_documents_updated_at
  BEFORE UPDATE ON public.verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_locations_updated_at
  BEFORE UPDATE ON public.worker_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true);

-- Storage policies
CREATE POLICY "Anyone can view uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);