/*
# Fix Signup and Profile Creation

## Root Cause
The trigger `on_auth_user_created` on `auth.users` calls `create_user_profile_on_signup()`,
which inserts ONLY into `user_profiles` — but the frontend reads from `profiles`.
So new users get an auth.users row but no `profiles` row, and the app shows empty data.

Additionally, the frontend references columns that don't exist on `profiles`:
- `is_admin` (used by useAdminCheck hook)
- `service_button_last_pressed` (used by Dashboard)
- `service_button_presses` (used by Dashboard)

## Fix
1. Add missing columns to `profiles`
2. Recreate the trigger function to insert into `profiles` (not `user_profiles`)
3. Also insert into `user_profiles` for backward compat
4. Create default custodial wallets (BTC, TYT, USDT) for new users
5. Keep existing academy stats + donation settings triggers
*/

-- ============================================================
-- 1. Add missing columns to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_button_last_pressed timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS service_button_presses integer NOT NULL DEFAULT 0;

-- ============================================================
-- 2. Recreate the signup trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_user_profile_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 0;
BEGIN
  RAISE LOG 'TYT signup: creating profile for % (email: %)', NEW.id, NEW.email;

  -- Derive username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  base_username := lower(regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g'));
  IF base_username = '' OR base_username IS NULL THEN
    base_username := 'user';
  END IF;

  final_username := base_username;

  -- Find unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;

  -- Insert into profiles (the table the frontend reads)
  INSERT INTO profiles (id, email, username, created_at, updated_at)
  VALUES (NEW.id, NEW.email, final_username, now(), now())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        username = EXCLUDED.username,
        updated_at = now();

  -- Insert into user_profiles (legacy compat table)
  INSERT INTO user_profiles (user_id, registration_date)
  VALUES (NEW.id, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Create default custodial wallets
  INSERT INTO custodial_wallets (user_id, currency, balance, blockchain)
  VALUES
    (NEW.id, 'BTC', 0, 'bitcoin'),
    (NEW.id, 'TYT', 0, 'internal'),
    (NEW.id, 'USDT', 0, 'internal')
  ON CONFLICT DO NOTHING;

  RAISE LOG 'TYT signup: profile created for % with username %', NEW.id, final_username;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'TYT signup error for %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Rebind trigger to the recreated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_profile_on_signup();

-- ============================================================
-- 3. Ensure RLS allows the trigger (SECURITY DEFINER) to insert
-- ============================================================
-- The function runs as owner with SECURITY DEFINER, so it bypasses RLS.
-- But we also need a service_role policy for admin operations.
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;
CREATE POLICY "Service role full access profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to insert their own profile (fallback)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
