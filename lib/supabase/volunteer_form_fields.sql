-- ============================================
-- Volunteer Applications Table Migration
-- Collector's Paradise - Volunteer Management
-- ============================================

-- Create volunteers table
CREATE TABLE IF NOT EXISTS public.volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Volunteer Preferences
  preferred_roles TEXT[] NOT NULL, -- Array of role names
  availability TEXT NOT NULL, -- Text description of availability
  previous_experience TEXT, -- Previous volunteer experience
  
  -- Event Preferences
  events_interested TEXT[], -- Array of event names/IDs
  t_shirt_size TEXT, -- For volunteer shirts
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  
  -- Additional Information
  additional_notes TEXT,
  how_heard_about TEXT, -- How they heard about volunteering
  
  -- Application Status
  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected', 'waitlisted')),
  rejection_reason TEXT,
  assigned_event_id UUID, -- Reference to events table if assigned
  
  -- Timestamps
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_volunteer_email UNIQUE (email)
);

-- Create index on application_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON public.volunteers(application_status);

-- Create index on applied_at for sorting
CREATE INDEX IF NOT EXISTS idx_volunteers_applied_at ON public.volunteers(applied_at DESC);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON public.volunteers(email);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_volunteers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER volunteers_updated_at_trigger
  BEFORE UPDATE ON public.volunteers
  FOR EACH ROW
  EXECUTE FUNCTION update_volunteers_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public volunteer form)
CREATE POLICY "Allow public to submit volunteer applications"
  ON public.volunteers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated admins to read all volunteers
CREATE POLICY "Allow admins to read all volunteers"
  ON public.volunteers
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update volunteer status
CREATE POLICY "Allow admins to update volunteers"
  ON public.volunteers
  FOR UPDATE
  TO authenticated
  WITH CHECK (true);

-- Allow admins to delete volunteers
CREATE POLICY "Allow admins to delete volunteers"
  ON public.volunteers
  FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket for volunteer-related files (if needed)
-- Note: Using existing bucket or create new one as needed
-- CREATE STORAGE BUCKET IF NOT EXISTS 'volunteer_documents' (public: true);

COMMENT ON TABLE public.volunteers IS 'Volunteer applications for Collector''s Paradise events';
COMMENT ON COLUMN public.volunteers.preferred_roles IS 'Array of preferred volunteer roles: Event Setup Crew, Registration Desk, Floor Guides, Breakdown Crew';
COMMENT ON COLUMN public.volunteers.availability IS 'Text description of when the volunteer is available';
COMMENT ON COLUMN public.volunteers.application_status IS 'Application status: pending, approved, rejected, waitlisted';
