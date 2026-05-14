-- ============================================
-- Sponsor Applications Table Migration
-- Collector's Paradise - Sponsor Management
-- ============================================

-- Create sponsors table
CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Company Information
  company_name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  company_size TEXT,
  
  -- Contact Information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_position TEXT,
  
  -- Sponsorship Details
  sponsorship_tier TEXT, -- Gold, Silver, Bronze, Custom
  sponsorship_interest TEXT[], -- Array of interests
  previous_sponsor BOOLEAN DEFAULT FALSE,
  sponsorship_history TEXT,
  
  -- Marketing & Branding
  logo_url TEXT,
  brand_description TEXT,
  social_media_links TEXT,
  marketing_goals TEXT,
  
  -- Event Preferences
  events_interested TEXT[], -- Array of event names/IDs
  preferred_booth_size TEXT,
  additional_services TEXT[], -- e.g., Workshop, Panel, Prize Donation
  
  -- Budget & Investment
  budget_range TEXT,
  custom_proposal TEXT,
  
  -- Additional Information
  additional_notes TEXT,
  how_heard_about TEXT, -- How they heard about sponsorship
  
  -- Application Status
  application_status TEXT NOT NULL DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected', 'waitlisted', 'negotiating')),
  rejection_reason TEXT,
  assigned_account_manager TEXT,
  contract_sent BOOLEAN DEFAULT FALSE,
  contract_signed BOOLEAN DEFAULT FALSE,
  payment_received BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_sponsor_email UNIQUE (contact_email)
);

-- Create index on application_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_sponsors_status ON public.sponsors(application_status);

-- Create index on applied_at for sorting
CREATE INDEX IF NOT EXISTS idx_sponsors_applied_at ON public.sponsors(applied_at DESC);

-- Create index on contact_email for lookups
CREATE INDEX IF NOT EXISTS idx_sponsors_contact_email ON public.sponsors(contact_email);

-- Create index on sponsorship_tier
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON public.sponsors(sponsorship_tier);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_sponsors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sponsors_updated_at_trigger
  BEFORE UPDATE ON public.sponsors
  FOR EACH ROW
  EXECUTE FUNCTION update_sponsors_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public sponsor form)
CREATE POLICY "Allow public to submit sponsor applications"
  ON public.sponsors
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow authenticated admins to read all sponsors
CREATE POLICY "Allow admins to read all sponsors"
  ON public.sponsors
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update sponsor status
CREATE POLICY "Allow admins to update sponsors"
  ON public.sponsors
  FOR UPDATE
  TO authenticated
  WITH CHECK (true);

-- Allow admins to delete sponsors
CREATE POLICY "Allow admins to delete sponsors"
  ON public.sponsors
  FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket for sponsor logos and materials
-- CREATE STORAGE BUCKET IF NOT EXISTS 'sponsor_materials' (public: true);

COMMENT ON TABLE public.sponsors IS 'Sponsor applications for Collector''s Paradise events';
COMMENT ON COLUMN public.sponsors.sponsorship_tier IS 'Sponsorship tier: Gold, Silver, Bronze, Custom';
COMMENT ON COLUMN public.sponsors.sponsorship_interest IS 'Array of sponsorship interests: Event Sponsorship, Prize Donation, Workshop Hosting, Panel Speaking, Brand Activation';
COMMENT ON COLUMN public.sponsors.application_status IS 'Application status: pending, approved, rejected, waitlisted, negotiating';
COMMENT ON COLUMN public.sponsors.budget_range IS 'Budget range: $1-5k, $5-10k, $10-25k, $25k+';
