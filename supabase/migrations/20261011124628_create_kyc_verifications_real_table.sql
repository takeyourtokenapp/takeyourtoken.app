/*
# Create real kyc_verifications table

Replaces the compatibility view that mapped to user_profiles.
The frontend (KYCVerification.tsx, kycService.ts, KYC.tsx) expects columns:
user_id, tier, status, personal_info, document_urls, provider, provider_id,
documents_verified, selfie_verified, address_verified, submitted_at,
approved_at, rejected_at, rejection_reason, metadata.

1. New Tables
- kyc_verifications: full KYC submission tracking with document URLs, personal info, provider integration
2. Security
- RLS enabled, owner-scoped CRUD for authenticated users
- Admin SELECT policy via profiles.is_admin check
3. Triggers
- sync_kyc_to_profile: syncs status back to user_profiles and profiles tables
*/

DROP VIEW IF EXISTS kyc_verifications CASCADE;
DROP TABLE IF EXISTS kyc_verifications CASCADE;

CREATE TABLE kyc_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  status text NOT NULL DEFAULT 'not_started',
  tier text DEFAULT NULL,
  provider text DEFAULT NULL,
  provider_id text DEFAULT NULL,
  personal_info jsonb DEFAULT '{}'::jsonb,
  document_urls jsonb DEFAULT '[]'::jsonb,
  documents_verified boolean DEFAULT false,
  selfie_verified boolean DEFAULT false,
  address_verified boolean DEFAULT false,
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kyc_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_kyc" ON kyc_verifications;
CREATE POLICY "select_own_kyc" ON kyc_verifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_kyc" ON kyc_verifications;
CREATE POLICY "insert_own_kyc" ON kyc_verifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_kyc" ON kyc_verifications;
CREATE POLICY "update_own_kyc" ON kyc_verifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_kyc" ON kyc_verifications;
CREATE POLICY "delete_own_kyc" ON kyc_verifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_kyc" ON kyc_verifications;
CREATE POLICY "admin_select_all_kyc" ON kyc_verifications FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications(status);

DROP TRIGGER IF EXISTS trg_sync_kyc_to_profile ON kyc_verifications;
DROP FUNCTION IF EXISTS sync_kyc_to_profile();

CREATE FUNCTION sync_kyc_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE user_profiles SET kyc_status = 'not_submitted', kyc_submitted_at = NULL WHERE user_id = OLD.user_id;
    UPDATE profiles SET kyc_status = 'not_submitted', kyc_submitted_at = NULL WHERE id = OLD.user_id;
    RETURN OLD;
  ELSE
    UPDATE user_profiles SET kyc_submitted_at = NEW.submitted_at WHERE user_id = NEW.user_id;
    UPDATE profiles SET kyc_submitted_at = NEW.submitted_at WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_sync_kyc_to_profile
  AFTER INSERT OR UPDATE OR DELETE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_kyc_to_profile();
