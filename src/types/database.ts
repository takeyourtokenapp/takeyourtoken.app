export interface Profile {
  id: string;
  email: string;
  username?: string;
  kyc_status: 'pending' | 'approved' | 'rejected';
  kyc_level: number;
  vip_level: number;
  total_hashrate: number;
  rank_score: number;
  owl_rank: 'worker' | 'academic' | 'diplomat' | 'peacekeeper' | 'warrior';
  avatar_id?: string;
  referred_by?: string;
  referral_code: string;
  created_at: string;
  updated_at: string;
}

export interface CustodialWallet {
  id: string;
  user_id: string;
  asset: 'BTC' | 'USDT' | 'TYT' | 'ETH' | 'SOL' | 'TRX' | 'XRP';
  balance: string;
  locked_balance: string;
  created_at: string;
  updated_at: string;
}

export type WalletAccountType =
  | 'user_main'
  | 'user_locked'
  | 'user_staking'
  | 'protocol_fees'
  | 'charity_fund'
  | 'academy_fund'
  | 'burn_pool'
  | 'treasury'
  | 'escrow';

export type LedgerEntryType =
  | 'deposit'
  | 'withdrawal'
  | 'reward'
  | 'maintenance_fee'
  | 'marketplace_fee'
  | 'miner_purchase'
  | 'miner_upgrade'
  | 'charity_donation'
  | 'academy_payment'
  | 'burn'
  | 'staking_lock'
  | 'staking_unlock'
  | 'referral_commission'
  | 'internal_transfer'
  | 'adjustment';

export interface WalletAccount {
  id: string;
  user_id: string | null;
  account_type: WalletAccountType;
  currency: string;
  network: string | null;
  balance: string;
  locked_balance: string;
  pending_balance: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_batch_id: string;
  account_id: string;
  entry_type: LedgerEntryType;
  debit: string;
  credit: string;
  balance_after: string;
  currency: string;
  ref_type: string | null;
  ref_id: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface FeeConfiguration {
  id: string;
  fee_key: string;
  fee_name: string;
  fee_bps_total: number;
  protocol_pct: number;
  charity_pct: number;
  academy_pct: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AggregatedBalance {
  currency: string;
  total_balance: number;
  available_balance: number;
  locked_balance: number;
  pending_balance: number;
  usd_value: number;
}

export interface NFTMiner {
  id: string;
  owner_id: string;
  token_id: string;
  collection_id: string;
  name: string;
  hashrate: number;
  efficiency: number;
  power_level: number;
  maintenance_rate: number;
  farm_id?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'listed_for_sale';
  reinvest_percentage?: number;
  purchase_price?: number;
  purchase_currency?: string;
  is_listed: boolean;
  listed_price?: number;
  total_rewards_btc: number;
  last_reward_at?: string;
  last_maintenance_paid_at?: string;
  metadata_uri?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyReward {
  id: string;
  miner_id: string;
  reward_date: string;
  gross_btc: string;
  maintenance_cost_btc: string;
  net_btc: string;
  hashrate_snapshot_th: number;
  global_difficulty?: string;
  pool_hashrate_th?: string;
  merkle_leaf?: string;
  created_at: string;
}

export interface MaintenanceInvoice {
  id: string;
  miner_id: string;
  invoice_date: string;
  electricity_cost_usd: string;
  service_fee_usd: string;
  total_usd: string;
  discount_applied_pct: number;
  final_amount_usd: string;
  paid_in_asset?: string;
  paid_amount?: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface MarketplaceListing {
  id: string;
  miner_id: string;
  seller_id: string;
  list_price_asset: string;
  list_price_amount: string;
  listing_type: 'fixed_price' | 'auction';
  min_bid_amount?: string;
  auction_end_time?: string;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface VIPTier {
  level: number;
  name: string;
  min_hashrate?: number;
  min_voting_power?: number;
  requirement_type: 'hashrate' | 'voting_power' | 'either';
  maintenance_discount_percent: number;
  marketplace_fee_discount_percent: number;
  priority_support: boolean;
  early_access: boolean;
  exclusive_avatars: boolean;
  custom_badge?: string;
  description?: string;
}

export interface OwlRank {
  rank: 'worker' | 'academic' | 'diplomat' | 'peacekeeper' | 'warrior';
  min_xp: number;
  max_xp: number;
  benefits: string[];
}

export interface AcademyTrack {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty_level: number;
  estimated_hours: number;
  icon_name?: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademyLesson {
  id: string;
  track_id: string;
  slug: string;
  title: string;
  content_mdx: string;
  difficulty_level: number;
  estimated_minutes: number;
  lesson_type: 'theory' | 'interactive' | 'quiz' | 'quest';
  xp_reward: number;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FoundationCampaign {
  id: string;
  slug: string;
  title: string;
  description: string;
  goal_usd: string;
  raised_usd: string;
  campaign_type: 'research' | 'family_support' | 'equipment' | 'general';
  start_date: string;
  end_date?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  featured_image_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// GAME WARS (Miner Wars)
// ============================================================================

export interface GameClan {
  id: string;
  name: string;
  tag: string;
  leader_id: string;
  description?: string;
  image_url?: string;
  total_members: number;
  total_hashrate: number;
  total_btc_won: number;
  total_tyt_won: number;
  global_rank?: number;
  win_count: number;
  loss_count: number;
  is_recruiting: boolean;
  min_hashrate_requirement: number;
  created_at: string;
  updated_at: string;
}

export interface GameClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  rank: 'private' | 'corporal' | 'sergeant' | 'lieutenant' | 'captain' | 'leader';
  hashrate_contribution: number;
  battles_participated: number;
  points_earned: number;
  joined_at: string;
  last_active_at: string;
}

export interface GameTournament {
  id: string;
  name: string;
  description?: string;
  tournament_type: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  prize_pool_btc: number;
  prize_pool_tyt: number;
  winning_clan_id?: string;
  winning_user_id?: string;
  starts_at: string;
  ends_at: string;
  min_hashrate: number;
  entry_fee_tyt: number;
  participants_count: number;
  created_at: string;
  completed_at?: string;
}

export interface GameBoost {
  id: string;
  user_id: string;
  boost_type: 'hashrate_multiplier' | 'efficiency_boost' | 'maintenance_discount' | 'reward_multiplier';
  boost_name: string;
  boost_value: number;
  duration_hours: number;
  cost_tyt: number;
  activated_at: string;
  expires_at: string;
  is_active: boolean;
  transaction_id?: string;
  created_at: string;
}

// ============================================================================
// SERVICE BUTTON
// ============================================================================

export interface ServiceButtonActivation {
  id: string;
  user_id: string;
  activation_date: string;
  discount_percent: number;
  activated_at: string;
  expires_at: string;
  maintenance_saved: number;
}

// ============================================================================
// MINER UPGRADES
// ============================================================================

export interface MinerUpgradeTier {
  level: number;
  max_hashrate: number;
  upgrade_cost_tyt: number;
  upgrade_cost_btc?: number;
  efficiency_improvement_percent: number;
  efficiency_upgrade_cost_tyt?: number;
  description?: string;
  created_at: string;
}

export interface MinerUpgrade {
  id: string;
  miner_id: string;
  user_id: string;
  upgrade_type: 'hashrate' | 'efficiency' | 'power_level';
  from_value: number;
  to_value: number;
  cost: number;
  cost_currency: string;
  transaction_id?: string;
  created_at: string;
}

// ============================================================================
// AVATARS & GOBOXES
// ============================================================================

export interface Avatar {
  id: string;
  token_id: string;
  owner_id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  image_url?: string;
  boost_type?: 'hashrate' | 'efficiency' | 'maintenance_discount' | 'reward_multiplier';
  boost_value: number;
  is_equipped: boolean;
  is_tradeable: boolean;
  acquired_at: string;
  created_at: string;
}

export interface GoBox {
  id: string;
  user_id: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  vip_level_achieved: number;
  tyt_reward: number;
  btc_reward: number;
  avatar_id?: string;
  boost_duration_hours: number;
  is_opened: boolean;
  opened_at?: string;
  created_at: string;
}

// ============================================================================
// REFERRAL SYSTEM (5-5-5)
// ============================================================================

export interface ReferralEarning {
  id: string;
  referrer_id: string;
  referred_user_id: string;
  event_type: 'miner_purchase' | 'miner_upgrade' | 'game_boost_purchase' | 'marketplace_sale';
  event_id?: string;
  base_amount: number;
  commission_percent: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  created_at: string;
}

export interface Ambassador {
  id: string;
  user_id: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  status: 'active' | 'inactive' | 'suspended';
  purchase_commission_percent: number;
  upgrade_commission_percent: number;
  marketplace_commission_percent: number;
  total_referrals: number;
  active_referrals: number;
  total_earnings_tyt: number;
  custom_code?: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TOKEN BURN & MINT
// ============================================================================

export interface TokenBurnEvent {
  id: string;
  scheduled_at: string;
  collected_amount: number;
  burned_amount: number;
  charity_mint_amount: number;
  burn_tx_hash?: string;
  mint_tx_hash?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  report_url?: string;
  executed_at?: string;
  created_at: string;
}

export interface BurnMintDistribution {
  id: string;
  burn_event_id: string;
  hashrate_providers_amount: number;
  ve_lockers_amount: number;
  community_treasury_amount: number;
  charity_foundation_amount: number;
  hashrate_providers_percent: number;
  ve_lockers_percent: number;
  community_treasury_percent: number;
  charity_foundation_percent: number;
  created_at: string;
}

// ============================================================================
// DATA CENTERS & LIVE STREAMS
// ============================================================================

export interface DataCenter {
  id: string;
  name: string;
  location: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  kwh_rate: number;
  total_capacity_th: number;
  used_capacity_th: number;
  live_stream_url?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NFTCollection {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  contract_address?: string;
  total_supply: number;
  minted_supply: number;
  base_hashrate: number;
  base_efficiency: number;
  base_maintenance_rate: number;
  floor_price?: number;
  floor_price_currency: string;
  is_active: boolean;
  image_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// MARKETPLACE
// ============================================================================

export interface MarketplaceOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  offer_currency: 'TYT' | 'BTC' | 'USDT' | 'TRX';
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  expires_at?: string;
  created_at: string;
  updated_at: string;
  responded_at?: string;
}

export interface MarketplaceSale {
  id: string;
  listing_id: string;
  miner_id: string;
  seller_id: string;
  buyer_id: string;
  sale_amount: number;
  sale_currency: 'TYT' | 'BTC' | 'USDT' | 'TRX';
  platform_fee_amount: number;
  seller_net_amount: number;
  referrer_id?: string;
  referrer_commission_amount: number;
  completed_at: string;
  blockchain_tx_hash?: string;
  created_at: string;
}
