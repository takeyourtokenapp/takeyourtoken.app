/*
# Add missing columns to profiles for rewards engine

1. Modified Tables
- `profiles`: adds `vip_tier` (text), `reinvest_percent` (numeric, default 0),
  `maintenance_balance` (numeric, default 0), `total_reinvested_btc` (numeric, default 0),
  `maintenance_payment_method` (text, default 'USDT')
- These columns are required by RealRewardsEngine which reads/writes them via the frontend

2. Security
- No new RLS policies needed; existing profiles policies cover these columns

3. Notes
- `vip_tier` is a text representation ('bronze', 'silver', 'gold', 'platinum', 'diamond')
  that complements the existing integer `vip_level` column
- `reinvest_percent` stores the user's auto-reinvest percentage (0-100)
- `maintenance_balance` tracks prepaid maintenance credit
- `total_reinvested_btc` accumulates lifetime reinvested BTC
- `maintenance_payment_method` tracks preferred payment method ('TYT', 'USDT', 'BTC')
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_tier text DEFAULT 'bronze';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reinvest_percent numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS maintenance_balance numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reinvested_btc numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS maintenance_payment_method text DEFAULT 'USDT';
