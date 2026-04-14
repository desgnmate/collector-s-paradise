-- ============================================
-- Collector's Paradise — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  venue TEXT,
  venue_address TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  capacity INT DEFAULT 0,
  tickets_sold INT DEFAULT 0,
  ticket_price DECIMAL(10, 2) DEFAULT 0.00,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events are publicly readable
CREATE POLICY "Events are publicly readable"
  ON public.events FOR SELECT
  TO authenticated, anon
  USING (true);

-- Only authenticated admins can manage events (we'll use a simple role check)
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- ADMIN USERS (simple role table)
-- ============================================
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'event_manager', 'vendor_reviewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin_users"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  square_payment_id TEXT,
  confirmation_code TEXT NOT NULL,
  booked_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR user_email = current_setting('request.jwt.claims', true)::json->>'email');

-- Bookings can be created by anyone (guest checkout)
CREATE POLICY "Anyone can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VENDORS
-- ============================================
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  categories TEXT[] DEFAULT '{}',
  application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected', 'waitlisted')),
  booth_assignment TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Vendors are publicly readable (for the vendor map)
CREATE POLICY "Approved vendors are publicly readable"
  ON public.vendors FOR SELECT
  TO authenticated, anon
  USING (application_status = 'approved');

-- Anyone can submit a vendor application
CREATE POLICY "Anyone can apply as vendor"
  ON public.vendors FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Vendors can check their own application by email
CREATE POLICY "Vendors can view their own applications"
  ON public.vendors FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admins can manage all vendors
CREATE POLICY "Admins can manage vendors"
  ON public.vendors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- VENUE BOOTHS (for interactive map)
-- ============================================
CREATE TABLE public.venue_booths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  booth_number TEXT NOT NULL,
  zone TEXT,
  x_position FLOAT NOT NULL DEFAULT 0,
  y_position FLOAT NOT NULL DEFAULT 0,
  width FLOAT NOT NULL DEFAULT 60,
  height FLOAT NOT NULL DEFAULT 40,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied')),
  UNIQUE(event_id, booth_number)
);

ALTER TABLE public.venue_booths ENABLE ROW LEVEL SECURITY;

-- Booths are publicly readable (for the map)
CREATE POLICY "Booths are publicly readable"
  ON public.venue_booths FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admins can manage booths
CREATE POLICY "Admins can manage booths"
  ON public.venue_booths FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Generate a booking confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CP-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
END;
$$ LANGUAGE plpgsql;
