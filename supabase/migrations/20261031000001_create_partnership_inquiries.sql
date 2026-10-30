-- ============================================================================
-- Migration: 20261031000001_create_partnership_inquiries.sql
-- Description: Creates the partnership_inquiries table to capture, manage,
-- and track partner and stakeholder collaboration requests for Turashoboye Feeds.
-- Accessible to public for insertions, accessible to Owners & Super Admins for management.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partnership_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  partnership_type TEXT NOT NULL, -- 'grain_supply', 'distribution', 'ngo_livelihood', 'investment', 'veterinary_tech', 'other'
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'in_review', 'contacted', 'partnered', 'archived'
  handled_by TEXT, -- Name or ID of Owner/Admin handling it
  handled_by_role TEXT, -- 'owner' or 'super_admin'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.partnership_inquiries ENABLE ROW LEVEL SECURITY;

-- 1. Public / Anonymous / Authenticated users can submit inquiries
CREATE POLICY "Public can submit partnership inquiries"
  ON public.partnership_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Only Owners and Super Admins can view inquiries
CREATE POLICY "Owners and Super Admins can view partnership inquiries"
  ON public.partnership_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.role IN ('owner', 'super_admin')
    )
  );

-- 3. Only Owners and Super Admins can update/manage inquiries
CREATE POLICY "Owners and Super Admins can update partnership inquiries"
  ON public.partnership_inquiries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.role IN ('owner', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.auth_user_id = auth.uid()
        AND profiles.role IN ('owner', 'super_admin')
    )
  );

-- 4. Create index for fast status and date querying
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_status ON public.partnership_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_partnership_inquiries_created_at ON public.partnership_inquiries (created_at DESC);
