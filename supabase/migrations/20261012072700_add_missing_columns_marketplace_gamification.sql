/*
# Add missing columns for marketplace and gamification

1. Modified Tables
- `marketplace_listings`: adds `final_sale_price` (numeric) to track the final sale amount
- `profiles`: adds `rank` (text default 'worker'), `rank_score` (numeric default 0),
  `rank_updated_at` (timestamptz default now()) for the gamification system

2. Security
- No new RLS policies needed; existing table policies cover these columns

3. Notes
- `final_sale_price` on marketplace_listings stores the sale price when a listing is sold
- `rank`/`rank_score`/`rank_updated_at` on profiles support the gamification leaderboard system
- `maintenance_payments` is a VIEW (not a table) so columns cannot be added to it;
  the frontend service has been updated to use `maintenance_invoices` for payment recording instead
*/

ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS final_sale_price numeric;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank text DEFAULT 'worker';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_score numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rank_updated_at timestamptz DEFAULT now();
