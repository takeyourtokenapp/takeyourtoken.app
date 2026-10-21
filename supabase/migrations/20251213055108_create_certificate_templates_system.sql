/*
  # Certificate Templates System for Soulbound NFTs

  1. New Tables
    - `certificate_templates` - Predefined certificate designs and metadata
    - Extends `academy_certificates` with template reference

  2. Changes
    - Add cert_template_id to academy_certificates
    - Create certificate templates for each track
    - Seed initial templates

  3. Security
    - RLS policies for templates (public read)
    - Certificate issuance remains user-specific
*/

-- ============================================================================
-- CERTIFICATE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  template_code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  
  -- Category and rarity
  category text NOT NULL DEFAULT 'blockchain',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  
  -- XP and skills
  skill_points integer DEFAULT 0,
  skills jsonb DEFAULT '[]'::jsonb,
  
  -- Visual design
  image_template_url text,
  background_color text DEFAULT '#1a1a2e',
  border_color text DEFAULT '#d2a44c',
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Status
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_certificate_templates_category ON certificate_templates(category);
CREATE INDEX idx_certificate_templates_rarity ON certificate_templates(rarity);

-- ============================================================================
-- UPDATE ACADEMY_CERTIFICATES TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'academy_certificates' AND column_name = 'cert_template_id'
  ) THEN
    ALTER TABLE academy_certificates 
    ADD COLUMN cert_template_id uuid REFERENCES certificate_templates(id);
    
    ALTER TABLE academy_certificates 
    ADD COLUMN certificate_number text;
    
    ALTER TABLE academy_certificates 
    ADD COLUMN verification_code text;
    
    ALTER TABLE academy_certificates 
    ADD COLUMN skills_earned jsonb DEFAULT '[]'::jsonb;
    
    ALTER TABLE academy_certificates 
    ADD COLUMN endorsements integer DEFAULT 0;
    
    ALTER TABLE academy_certificates 
    ADD COLUMN is_public boolean DEFAULT true;
    
    CREATE INDEX idx_academy_certificates_template ON academy_certificates(cert_template_id);
    CREATE INDEX idx_academy_certificates_verification ON academy_certificates(verification_code);
  END IF;
END $$;

-- ============================================================================
-- SEED CERTIFICATE TEMPLATES
-- ============================================================================

-- Bitcoin Basics Track
INSERT INTO certificate_templates (
  template_code,
  name,
  description,
  category,
  rarity,
  skill_points,
  skills
) VALUES (
  'BITCOIN_BASICS',
  'Bitcoin Fundamentals Certificate',
  'Completed comprehensive training in Bitcoin basics, blockchain technology, and cryptocurrency fundamentals.',
  'blockchain',
  'common',
  100,
  '["Bitcoin Fundamentals", "Blockchain Basics", "Wallet Security", "Transaction Understanding"]'::jsonb
) ON CONFLICT (template_code) DO NOTHING;

-- Mining Economics Track
INSERT INTO certificate_templates (
  template_code,
  name,
  description,
  category,
  rarity,
  skill_points,
  skills
) VALUES (
  'MINING_ECONOMICS',
  'Mining Economics Mastery',
  'Demonstrated expertise in mining profitability, ROI calculation, and hashrate optimization.',
  'mining',
  'uncommon',
  200,
  '["ROI Analysis", "Hashrate Optimization", "Mining Pool Strategy", "Cost Management"]'::jsonb
) ON CONFLICT (template_code) DO NOTHING;

-- Security Track
INSERT INTO certificate_templates (
  template_code,
  name,
  description,
  category,
  rarity,
  skill_points,
  skills
) VALUES (
  'SECURITY_EXPERT',
  'Crypto Security Expert Certificate',
  'Mastered cryptocurrency security practices, wallet protection, and risk management strategies.',
  'security',
  'rare',
  250,
  '["Wallet Security", "2FA Implementation", "Phishing Prevention", "Cold Storage", "Recovery Procedures"]'::jsonb
) ON CONFLICT (template_code) DO NOTHING;

-- DeFi Track
INSERT INTO certificate_templates (
  template_code,
  name,
  description,
  category,
  rarity,
  skill_points,
  skills
) VALUES (
  'DEFI_SPECIALIST',
  'DeFi Specialist Certificate',
  'Achieved proficiency in decentralized finance protocols, staking, liquidity provision, and yield farming.',
  'defi',
  'epic',
  300,
  '["DeFi Protocols", "Yield Farming", "Liquidity Pools", "Staking Strategies", "Risk Assessment"]'::jsonb
) ON CONFLICT (template_code) DO NOTHING;

-- TYT Ecosystem Track
INSERT INTO certificate_templates (
  template_code,
  name,
  description,
  category,
  rarity,
  skill_points,
  skills
) VALUES (
  'TYT_MASTER',
  'TYT Ecosystem Master',
  'Completed comprehensive training in the TYT ecosystem, governance, tokenomics, and platform features.',
  'platform',
  'legendary',
  500,
  '["TYT Tokenomics", "veTYT Governance", "NFT Mining", "Marketplace Trading", "Foundation Support", "Community Leadership"]'::jsonb
) ON CONFLICT (template_code) DO NOTHING;

-- ============================================================================
-- UPDATE CERTIFICATE ISSUANCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION issue_track_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_id uuid;
  v_track_title text;
  v_total_lessons integer;
  v_completed_lessons integer;
  v_template_id uuid;
  v_template_code text;
  v_cert_number text;
  v_verification_code text;
  v_skills jsonb;
BEGIN
  IF NEW.completed_at IS NOT NULL THEN
    SELECT l.track_id, t.title
    INTO v_track_id, v_track_title
    FROM academy_lessons l
    JOIN academy_tracks t ON t.id = l.track_id
    WHERE l.id = NEW.lesson_id;
    
    SELECT COUNT(*) INTO v_total_lessons
    FROM academy_lessons
    WHERE track_id = v_track_id AND is_published = true;
    
    SELECT COUNT(*) INTO v_completed_lessons
    FROM academy_progress
    WHERE user_id = NEW.user_id 
      AND lesson_id IN (
        SELECT id FROM academy_lessons 
        WHERE track_id = v_track_id AND is_published = true
      )
      AND completed_at IS NOT NULL;
    
    IF v_completed_lessons >= v_total_lessons THEN
      SELECT 
        CASE 
          WHEN v_track_title ILIKE '%bitcoin%basic%' THEN 'BITCOIN_BASICS'
          WHEN v_track_title ILIKE '%mining%econom%' THEN 'MINING_ECONOMICS'
          WHEN v_track_title ILIKE '%security%' THEN 'SECURITY_EXPERT'
          WHEN v_track_title ILIKE '%defi%' THEN 'DEFI_SPECIALIST'
          WHEN v_track_title ILIKE '%tyt%' OR v_track_title ILIKE '%ecosystem%' THEN 'TYT_MASTER'
          ELSE 'BITCOIN_BASICS'
        END
      INTO v_template_code;
      
      SELECT id, skills INTO v_template_id, v_skills
      FROM certificate_templates
      WHERE template_code = v_template_code
      LIMIT 1;
      
      v_cert_number := 'TYT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
      v_verification_code := UPPER(SUBSTRING(MD5(RANDOM()::text || NOW()::text) FROM 1 FOR 12));
      
      INSERT INTO academy_certificates (
        token_id,
        user_id,
        track_id,
        cert_template_id,
        certificate_type,
        certificate_number,
        verification_code,
        skills_earned,
        title,
        description,
        issued_at
      )
      SELECT
        'CERT-' || gen_random_uuid()::text,
        NEW.user_id,
        v_track_id,
        v_template_id,
        'track_completion',
        v_cert_number,
        v_verification_code,
        v_skills,
        'Certificate: ' || v_track_title,
        'Successfully completed all lessons in track: ' || v_track_title,
        now()
      ON CONFLICT DO NOTHING;
      
      UPDATE user_academy_stats
      SET 
        tracks_completed = tracks_completed + 1,
        certificates_earned = certificates_earned + 1,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active certificate templates"
  ON certificate_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- HELPER FUNCTION: Generate certificate for user manually
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_certificate_for_user(
  p_user_id uuid,
  p_track_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_track_title text;
  v_template_code text;
  v_template_id uuid;
  v_cert_number text;
  v_verification_code text;
  v_skills jsonb;
  v_cert_id uuid;
BEGIN
  SELECT title INTO v_track_title
  FROM academy_tracks
  WHERE id = p_track_id;
  
  SELECT 
    CASE 
      WHEN v_track_title ILIKE '%bitcoin%basic%' THEN 'BITCOIN_BASICS'
      WHEN v_track_title ILIKE '%mining%econom%' THEN 'MINING_ECONOMICS'
      WHEN v_track_title ILIKE '%security%' THEN 'SECURITY_EXPERT'
      WHEN v_track_title ILIKE '%defi%' THEN 'DEFI_SPECIALIST'
      WHEN v_track_title ILIKE '%tyt%' OR v_track_title ILIKE '%ecosystem%' THEN 'TYT_MASTER'
      ELSE 'BITCOIN_BASICS'
    END
  INTO v_template_code;
  
  SELECT id, skills INTO v_template_id, v_skills
  FROM certificate_templates
  WHERE template_code = v_template_code
  LIMIT 1;
  
  v_cert_number := 'TYT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0');
  v_verification_code := UPPER(SUBSTRING(MD5(RANDOM()::text || NOW()::text) FROM 1 FOR 12));
  
  INSERT INTO academy_certificates (
    token_id,
    user_id,
    track_id,
    cert_template_id,
    certificate_type,
    certificate_number,
    verification_code,
    skills_earned,
    title,
    description,
    issued_at
  )
  VALUES (
    'CERT-' || gen_random_uuid()::text,
    p_user_id,
    p_track_id,
    v_template_id,
    'track_completion',
    v_cert_number,
    v_verification_code,
    v_skills,
    'Certificate: ' || v_track_title,
    'Successfully completed all lessons in track: ' || v_track_title,
    now()
  )
  RETURNING id INTO v_cert_id;
  
  UPDATE user_academy_stats
  SET 
    certificates_earned = certificates_earned + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN v_cert_id;
END;
$$;