/*
# Create Missing Views and Tables for Frontend-DB Compatibility
# 57 frontend table references don't exist in DB. This creates compatibility views + missing tables.
*/

-- ============================================================
-- Foundation views
-- ============================================================

CREATE OR REPLACE VIEW foundation_statistics AS
SELECT
  COALESCE(SUM(amount_usd), 0) as total_raised,
  COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= date_trunc('month', now())), 0) as raised_this_month,
  COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= date_trunc('year', now())), 0) as raised_this_year,
  COUNT(*) as total_donations,
  COUNT(DISTINCT donor_user_id) as unique_donors
FROM foundation_donations;

CREATE OR REPLACE VIEW foundation_active_campaigns_view AS
SELECT id, slug, title, description, funding_goal_usd as goal_usd, current_raised_usd as raised_usd,
  image_url, status, start_date, end_date, campaign_type, donor_count, created_at, updated_at
FROM foundation_campaigns WHERE status = 'active' ORDER BY created_at DESC;

CREATE OR REPLACE VIEW foundation_partners_view AS
SELECT id, name, description, website_url, partner_type, is_verified as is_active, research_focus, created_at
FROM foundation_research_partners ORDER BY created_at;

CREATE OR REPLACE VIEW foundation_impact_summary AS
SELECT year, quarter, total_donations_usd, unique_donors_count, grants_awarded,
  grants_awarded_amount_usd, active_research_projects, families_supported, created_at
FROM foundation_impact_metrics;

CREATE OR REPLACE VIEW foundation_recent_donations AS
SELECT fd.id, fd.amount_usd, fd.currency, fd.created_at, fd.donor_user_id, fd.campaign_id,
  p.username as donor_name, fc.title as campaign_title, fd.message, fd.is_anonymous
FROM foundation_donations fd
LEFT JOIN profiles p ON fd.donor_user_id = p.id
LEFT JOIN foundation_campaigns fc ON fd.campaign_id = fc.id
ORDER BY fd.created_at DESC LIMIT 50;

CREATE OR REPLACE VIEW foundation_summary AS
SELECT COUNT(*) as total_donations, COALESCE(SUM(amount_usd), 0) as total_amount,
  COALESCE(AVG(amount_usd), 0) as avg_amount
FROM foundation_donations;

CREATE OR REPLACE VIEW foundation_summary_by_source AS
SELECT COALESCE(source, 'direct') as source, COUNT(*) as donation_count,
  COALESCE(SUM(amount_usd), 0) as total_amount
FROM foundation_donations GROUP BY source;

CREATE OR REPLACE VIEW foundation_summary_by_period AS
SELECT date_trunc('month', created_at) as period, COUNT(*) as donation_count,
  COALESCE(SUM(amount_usd), 0) as total_amount
FROM foundation_donations GROUP BY date_trunc('month', created_at) ORDER BY period DESC;

CREATE OR REPLACE VIEW foundation_transactions AS
SELECT fd.id, fd.amount_usd as amount, fd.currency, 'donation' as type, fd.created_at,
  fd.donor_user_id as user_id, fd.campaign_id, fd.tx_hash as transaction_hash
FROM foundation_donations fd ORDER BY fd.created_at DESC;

CREATE OR REPLACE VIEW foundation_allocations AS
SELECT fg.id, fg.title, fg.description, fg.total_amount_usd as amount, fg.status,
  fg.principal_investigator as institution, fg.research_area, fg.start_date, fg.end_date, fg.created_at
FROM foundation_grants fg ORDER BY fg.created_at DESC;

CREATE OR REPLACE VIEW foundation_impact_reports AS
SELECT id, title, fiscal_year, total_revenue_usd, total_grants_awarded_usd,
  total_family_support_usd, net_assets_usd, published_at as created_at
FROM foundation_transparency_reports ORDER BY published_at DESC;

CREATE OR REPLACE VIEW grant_allocation_summary AS
SELECT status, COUNT(*) as grant_count, COALESCE(SUM(total_amount_usd), 0) as total_allocated
FROM foundation_grants GROUP BY status;

-- ============================================================
-- KYC compatibility view (user_profiles has no id column, uses user_id)
-- ============================================================
CREATE OR REPLACE VIEW kyc_verifications AS
SELECT user_id as id, user_id, kyc_status::text as status, kyc_tier,
  kyc_submitted_at as submitted_at, NULL::timestamptz as approved_at, last_active, metadata
FROM user_profiles;

-- ============================================================
-- Transactions view (maps to wallet_transactions)
-- ============================================================
CREATE OR REPLACE VIEW transactions AS
SELECT id, wallet_id, user_id, type, amount, currency, status, tx_hash,
  from_address, to_address, fee, metadata, created_at, completed_at
FROM wallet_transactions;

-- ============================================================
-- Token burns view (maps to burn_events)
-- ============================================================
CREATE OR REPLACE VIEW token_burns AS
SELECT id, burn_type, amount_tyt as amount, tx_hash as transaction_hash,
  burn_address, source_ref_type, source_ref_id, burned_at, status, metadata, created_at
FROM burn_events;

-- ============================================================
-- Mining rewards view (maps to daily_rewards)
-- ============================================================
CREATE OR REPLACE VIEW mining_rewards AS
SELECT id, user_id, miner_id, reward_date, btc_amount as gross_reward,
  btc_amount as net_reward, hashrate_snapshot as hashrate, efficiency_snapshot,
  uptime_percent, network_difficulty, btc_price_usd, status, processed_at, created_at
FROM daily_rewards;

-- ============================================================
-- Digital miners / user_miners view (nft_miners uses owner_id not user_id)
-- ============================================================
CREATE OR REPLACE VIEW digital_miners AS
SELECT id, token_id, owner_id as user_id, collection_id, name, hashrate, efficiency,
  power_level, maintenance_rate, farm_id, purchase_price, purchase_currency,
  purchased_at, last_reward_at, last_maintenance_paid_at, total_rewards_btc,
  total_maintenance_paid, status, is_listed, listed_price, metadata_uri, metadata,
  created_at, updated_at
FROM nft_miners;

CREATE OR REPLACE VIEW user_miners AS
SELECT id, token_id, owner_id as user_id, collection_id, name, hashrate, efficiency,
  power_level, maintenance_rate, farm_id, purchase_price, purchase_currency,
  purchased_at, last_reward_at, last_maintenance_paid_at, total_rewards_btc,
  total_maintenance_paid, status, is_listed, listed_price, metadata_uri, metadata,
  created_at, updated_at
FROM nft_miners;

-- ============================================================
-- Academy quest progress (maps to academy_quest_completions)
-- ============================================================
CREATE OR REPLACE VIEW academy_quest_progress AS
SELECT id, user_id, quest_id, status, completed_at, verified_at, xp_claimed, tyt_claimed,
  verification_data, created_at, updated_at
FROM academy_quest_completions;

-- ============================================================
-- User lesson progress (maps to academy_progress)
-- ============================================================
CREATE OR REPLACE VIEW user_lesson_progress AS
SELECT id, user_id, lesson_id, is_completed, completed_at, time_spent_seconds,
  quiz_score, quiz_passed, xp_earned, created_at, updated_at
FROM academy_progress;

-- ============================================================
-- Miner upgrade history (maps to miner_upgrades)
-- ============================================================
CREATE OR REPLACE VIEW miner_upgrade_history AS
SELECT id, miner_id, user_id, upgrade_type, from_value, to_value, cost, cost_currency,
  transaction_id, created_at
FROM miner_upgrades;

-- ============================================================
-- Game service button clicks (maps to service_button_claims)
-- ============================================================
CREATE OR REPLACE VIEW game_service_button_clicks AS
SELECT id, user_id, tyt_amount, vip_level, claim_date, claimed_at
FROM service_button_claims;

-- ============================================================
-- Maintenance fee config (maps to fee_configurations)
-- ============================================================
CREATE OR REPLACE VIEW maintenance_fee_config AS
SELECT id, fee_key, fee_name, fee_bps_total, protocol_pct, charity_pct, academy_pct,
  is_active, created_at, updated_at
FROM fee_configurations;

-- ============================================================
-- Maintenance payments (maps to maintenance_invoices)
-- ============================================================
CREATE OR REPLACE VIEW maintenance_payments AS
SELECT id, user_id, miner_id, invoice_date, due_date, base_cost_usd, final_cost_usd as amount,
  payment_currency, payment_amount, status, paid_at, created_at
FROM maintenance_invoices;

-- ============================================================
-- Referral views (map to referral_earnings)
-- ============================================================
CREATE OR REPLACE VIEW referrals AS
SELECT id, referrer_id, referred_user_id, event_type, base_amount, commission_percent,
  commission_amount, status, paid_at, created_at
FROM referral_earnings;

CREATE OR REPLACE VIEW referral_codes AS
SELECT p.id as user_id, p.referral_code as code, p.username, p.created_at
FROM profiles p WHERE p.referral_code IS NOT NULL;

CREATE OR REPLACE VIEW referral_commissions AS
SELECT id, referrer_id, referred_user_id, event_type, base_amount, commission_percent,
  commission_amount, status, paid_at, created_at
FROM referral_earnings;

CREATE OR REPLACE VIEW referral_clicks AS
SELECT id, referrer_id, referred_user_id, created_at FROM referral_earnings;

CREATE OR REPLACE VIEW referral_rewards AS
SELECT id, referrer_id, referred_user_id, commission_amount as reward_amount,
  status, paid_at, created_at
FROM referral_earnings;

-- ============================================================
-- Reward views (map to daily_rewards)
-- ============================================================
CREATE OR REPLACE VIEW rewards AS
SELECT id, user_id, miner_id, reward_date, btc_amount, hashrate_snapshot, status, created_at
FROM daily_rewards;

CREATE OR REPLACE VIEW reward_pools AS
SELECT id, user_id, miner_id, reward_date, btc_amount as pool_amount,
  btc_amount as distributed_amount, status, created_at
FROM daily_rewards;

CREATE OR REPLACE VIEW reward_claims AS
SELECT id, user_id, miner_id, reward_date, btc_amount as amount, status, created_at
FROM daily_rewards;

CREATE OR REPLACE VIEW reward_distributions AS
SELECT id, user_id, miner_id, btc_amount as amount, 'BTC' as currency, status, created_at
FROM daily_rewards;

CREATE OR REPLACE VIEW v_user_rewards_summary_v2 AS
SELECT user_id, COUNT(*) as total_rewards, SUM(btc_amount) as total_gross,
  SUM(btc_amount) as total_net, MAX(reward_date) as last_reward_date
FROM daily_rewards GROUP BY user_id;

CREATE OR REPLACE VIEW v_miner_rewards_summary_v2 AS
SELECT m.id as miner_id, m.owner_id as user_id, m.name as miner_name, m.hashrate,
  COUNT(r.id) as total_rewards, COALESCE(SUM(r.btc_amount), 0) as total_earned
FROM nft_miners m LEFT JOIN daily_rewards r ON r.user_id = m.owner_id
GROUP BY m.id, m.owner_id, m.name, m.hashrate;

CREATE OR REPLACE VIEW v_user_maintenance_stats AS
SELECT user_id, COUNT(*) as total_invoices,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invoices,
  COALESCE(SUM(final_cost_usd), 0) as total_amount,
  COALESCE(SUM(final_cost_usd) FILTER (WHERE status = 'paid'), 0) as total_paid
FROM maintenance_invoices GROUP BY user_id;

-- ============================================================
-- Charity stakes view (user_stakes has no stake_type column)
-- ============================================================
CREATE OR REPLACE VIEW charity_stakes AS
SELECT id, user_id, pool_id, amount, wallet_address, start_date, unlock_date,
  rewards_earned, status, tx_hash, withdrawn_at, created_at
FROM user_stakes;

-- ============================================================
-- Blockchain deposit addresses view
-- ============================================================
CREATE OR REPLACE VIEW blockchain_deposit_addresses AS
SELECT id, user_id, network_code, address, derivation_path, is_verified,
  last_checked_at, created_at
FROM user_deposit_addresses;

CREATE OR REPLACE VIEW user_blockchain_addresses AS
SELECT id, user_id, network_code, address, derivation_path, is_verified,
  last_checked_at, created_at
FROM user_deposit_addresses;

-- ============================================================
-- User clan memberships view
-- ============================================================
CREATE OR REPLACE VIEW user_clan_memberships AS
SELECT id, clan_id, user_id, rank, hashrate_contribution, battles_participated,
  points_earned, joined_at, last_active_at
FROM game_clan_members;

-- ============================================================
-- User vetyt cache view
-- ============================================================
CREATE OR REPLACE VIEW user_vetyt_cache AS
SELECT id, user_id, tyt_amount as locked_amount, voting_power,
  lock_duration_weeks, locked_at, unlock_at as lock_end, status, created_at, updated_at
FROM ve_tyt_locks;

-- ============================================================
-- New tables: notifications, notification_preferences, price_alerts,
-- contact_messages, payment_sessions, orbital_events, achievement_definitions,
-- token_price_cache, aoi tables
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  data jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean NOT NULL DEFAULT true,
  push_notifications boolean NOT NULL DEFAULT true,
  mining_alerts boolean NOT NULL DEFAULT true,
  reward_notifications boolean NOT NULL DEFAULT true,
  foundation_updates boolean NOT NULL DEFAULT true,
  marketplace_notifications boolean NOT NULL DEFAULT true,
  governance_notifications boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_notif_prefs" ON notification_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_notif_prefs" ON notification_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_notif_prefs" ON notification_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_notif_prefs" ON notification_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  target_price numeric NOT NULL,
  condition text NOT NULL DEFAULT 'above',
  is_active boolean NOT NULL DEFAULT true,
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_alerts" ON price_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_alerts" ON price_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_alerts" ON price_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_alerts" ON price_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_insert_contact" ON contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "authenticated_can_read_contact" ON contact_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_can_update_contact" ON contact_messages FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS payment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USDT',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  reference_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_payments" ON payment_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_payments" ON payment_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_payments" ON payment_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS orbital_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  token_amount numeric,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orbital_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_orbital" ON orbital_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_orbital" ON orbital_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  category text,
  xp_reward integer NOT NULL DEFAULT 0,
  tyt_reward numeric NOT NULL DEFAULT 0,
  requirement_type text,
  requirement_value integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_view_achievements" ON achievement_definitions FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS token_price_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol text NOT NULL,
  price_usd numeric NOT NULL,
  volume_24h numeric,
  change_24h numeric,
  market_cap numeric,
  source text NOT NULL DEFAULT 'internal',
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE token_price_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone_can_read_prices" ON token_price_cache FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "authenticated_can_write_prices" ON token_price_cache FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_can_update_prices" ON token_price_cache FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- AOI tables
CREATE TABLE IF NOT EXISTS aoi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  severity text DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aoi_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_aoi_events" ON aoi_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_aoi_events" ON aoi_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS aoi_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  interaction_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aoi_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_aoi_interactions" ON aoi_interactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_aoi_interactions" ON aoi_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS aoi_user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text,
  progress_percent numeric DEFAULT 0,
  lessons_completed integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  current_level text DEFAULT 'beginner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);
ALTER TABLE aoi_user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_aoi_progress" ON aoi_user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_aoi_progress" ON aoi_user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_aoi_progress" ON aoi_user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_aoi_progress" ON aoi_user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS aoi_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_code text NOT NULL,
  title text NOT NULL,
  description text,
  icon text,
  xp_reward integer DEFAULT 0,
  earned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aoi_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_aoi_achievements" ON aoi_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_aoi_achievements" ON aoi_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS aoi_explanations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  topic text NOT NULL,
  explanation text NOT NULL,
  context_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE aoi_explanations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_aoi_explanations" ON aoi_explanations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_aoi_explanations" ON aoi_explanations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Set security_invoker on all views
-- ============================================================
ALTER VIEW foundation_statistics SET (security_invoker = true);
ALTER VIEW foundation_active_campaigns_view SET (security_invoker = true);
ALTER VIEW foundation_partners_view SET (security_invoker = true);
ALTER VIEW foundation_impact_summary SET (security_invoker = true);
ALTER VIEW foundation_recent_donations SET (security_invoker = true);
ALTER VIEW foundation_summary SET (security_invoker = true);
ALTER VIEW foundation_summary_by_source SET (security_invoker = true);
ALTER VIEW foundation_summary_by_period SET (security_invoker = true);
ALTER VIEW foundation_transactions SET (security_invoker = true);
ALTER VIEW foundation_allocations SET (security_invoker = true);
ALTER VIEW foundation_impact_reports SET (security_invoker = true);
ALTER VIEW grant_allocation_summary SET (security_invoker = true);
ALTER VIEW kyc_verifications SET (security_invoker = true);
ALTER VIEW transactions SET (security_invoker = true);
ALTER VIEW token_burns SET (security_invoker = true);
ALTER VIEW mining_rewards SET (security_invoker = true);
ALTER VIEW digital_miners SET (security_invoker = true);
ALTER VIEW user_miners SET (security_invoker = true);
ALTER VIEW academy_quest_progress SET (security_invoker = true);
ALTER VIEW user_lesson_progress SET (security_invoker = true);
ALTER VIEW miner_upgrade_history SET (security_invoker = true);
ALTER VIEW game_service_button_clicks SET (security_invoker = true);
ALTER VIEW maintenance_fee_config SET (security_invoker = true);
ALTER VIEW maintenance_payments SET (security_invoker = true);
ALTER VIEW referrals SET (security_invoker = true);
ALTER VIEW referral_codes SET (security_invoker = true);
ALTER VIEW referral_commissions SET (security_invoker = true);
ALTER VIEW referral_clicks SET (security_invoker = true);
ALTER VIEW referral_rewards SET (security_invoker = true);
ALTER VIEW rewards SET (security_invoker = true);
ALTER VIEW reward_pools SET (security_invoker = true);
ALTER VIEW reward_claims SET (security_invoker = true);
ALTER VIEW reward_distributions SET (security_invoker = true);
ALTER VIEW v_user_rewards_summary_v2 SET (security_invoker = true);
ALTER VIEW v_miner_rewards_summary_v2 SET (security_invoker = true);
ALTER VIEW v_user_maintenance_stats SET (security_invoker = true);
ALTER VIEW charity_stakes SET (security_invoker = true);
ALTER VIEW blockchain_deposit_addresses SET (security_invoker = true);
ALTER VIEW user_blockchain_addresses SET (security_invoker = true);
ALTER VIEW user_clan_memberships SET (security_invoker = true);
ALTER VIEW user_vetyt_cache SET (security_invoker = true);
