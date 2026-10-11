/*
# Fix Frontend-DB Mismatches: Create Missing Tables, RPC, Fix Views

## Purpose
The frontend code references several tables and functions that don't exist yet in the database.
This migration creates them and fixes SECURITY DEFINER views that bypass RLS.

## Changes

### 1. New Table: academy_streaks
Tracks daily learning streaks for academy students.
- user_id (uuid, PK + FK to auth.users)
- current_streak (int, default 0)
- longest_streak (int, default 0)
- last_activity (date)
- created_at, updated_at (timestamptz)

### 2. New Table: user_reinvest_settings
Stores auto-reinvest configuration per user.
- user_id (uuid, PK + FK to auth.users)
- auto_reinvest_enabled (bool, default false)
- reinvest_percentage (int, default 50)
- min_balance_to_reinvest (numeric, default 0.001)
- reinvest_frequency_days (int, default 7)
- created_at, updated_at (timestamptz)

### 3. New Function: press_service_button
SECURITY DEFINER function that atomically:
- Updates profiles.service_button_last_pressed
- Inserts a service_button_activations row
- Returns the updated profile row
Called from the frontend useServiceButton hook.

### 4. Fix SECURITY DEFINER Views
Sets security_invoker = true on three views that currently run as their owner,
bypassing RLS:
- account_balance_verification
- burn_statistics
- system_balance_summary

## Security
- RLS enabled on both new tables with authenticated-only owner-scoped CRUD.
- press_service_button is SECURITY DEFINER with search_path = public,
  EXECUTE revoked from anon, granted to authenticated.
- Views set to security_invoker = true so they respect the caller's RLS.
*/

-- ============================================================
-- 1. academy_streaks
-- ============================================================
CREATE TABLE IF NOT EXISTS academy_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_activity date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE academy_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_streak" ON academy_streaks;
CREATE POLICY "select_own_streak" ON academy_streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streak" ON academy_streaks;
CREATE POLICY "insert_own_streak" ON academy_streaks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_streak" ON academy_streaks;
CREATE POLICY "update_own_streak" ON academy_streaks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_streak" ON academy_streaks;
CREATE POLICY "delete_own_streak" ON academy_streaks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 2. user_reinvest_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_reinvest_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auto_reinvest_enabled boolean NOT NULL DEFAULT false,
  reinvest_percentage int NOT NULL DEFAULT 50 CHECK (reinvest_percentage >= 0 AND reinvest_percentage <= 100),
  min_balance_to_reinvest numeric NOT NULL DEFAULT 0.001,
  reinvest_frequency_days int NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_reinvest_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reinvest" ON user_reinvest_settings;
CREATE POLICY "select_own_reinvest" ON user_reinvest_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reinvest" ON user_reinvest_settings;
CREATE POLICY "insert_own_reinvest" ON user_reinvest_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reinvest" ON user_reinvest_settings;
CREATE POLICY "update_own_reinvest" ON user_reinvest_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reinvest" ON user_reinvest_settings;
CREATE POLICY "delete_own_reinvest" ON user_reinvest_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 3. press_service_button function
-- ============================================================
CREATE OR REPLACE FUNCTION press_service_button(p_user_id uuid, p_reward_amount numeric DEFAULT 0)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_profile profiles;
  v_today date := CURRENT_DATE;
  v_already_pressed boolean;
BEGIN
  -- Verify caller matches the requested user
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check if already pressed today
  SELECT EXISTS (
    SELECT 1 FROM service_button_activations
    WHERE user_id = p_user_id
      AND activation_date = v_today
  ) INTO v_already_pressed;

  -- Update profile timestamp
  UPDATE profiles
    SET updated_at = now()
    WHERE id = p_user_id
    RETURNING * INTO v_profile;

  -- Insert activation record if not already pressed today
  IF NOT v_already_pressed THEN
    INSERT INTO service_button_activations (user_id, activation_date, discount_percent, activated_at, expires_at)
    VALUES (p_user_id, v_today, 3, now(), (now() + interval '24 hours'));
  END IF;

  RETURN v_profile;
END;
$$;

REVOKE EXECUTE ON FUNCTION press_service_button FROM anon;
GRANT EXECUTE ON FUNCTION press_service_button TO authenticated;

-- ============================================================
-- 4. Fix SECURITY DEFINER views — set security_invoker = true
-- ============================================================
ALTER VIEW account_balance_verification SET (security_invoker = true);
ALTER VIEW burn_statistics SET (security_invoker = true);
ALTER VIEW system_balance_summary SET (security_invoker = true);
