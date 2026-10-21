import { supabase } from '../lib/supabase';

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  monthlyEarnings: number;
  conversionRate: number;
  referralCode: string;
  referralLink: string;
}

export interface ReferralTier {
  tier: number;
  name: string;
  bonusPercentage: number;
  requirement: number;
}

export interface Referral {
  id: string;
  referredUserId: string;
  referredEmail: string;
  referredName: string;
  status: 'pending' | 'active' | 'inactive';
  totalSpent: number;
  commissionEarned: number;
  joinedAt: string;
  tier: number;
}

export interface CommissionHistory {
  id: string;
  referralId: string;
  referredUserEmail: string;
  amount: number;
  type: 'purchase' | 'maintenance' | 'upgrade' | 'marketplace';
  status: 'pending' | 'paid' | 'rejected';
  createdAt: string;
  paidAt: string | null;
}

const REFERRAL_TIERS: ReferralTier[] = [
  { tier: 1, name: 'Direct', bonusPercentage: 5, requirement: 0 },
  { tier: 2, name: 'Second Level', bonusPercentage: 2, requirement: 5 },
  { tier: 3, name: 'Third Level', bonusPercentage: 1, requirement: 10 },
  { tier: 4, name: 'Fourth Level', bonusPercentage: 0.5, requirement: 25 }
];

export function getReferralTiers(): ReferralTier[] {
  return REFERRAL_TIERS;
}

export function getTierBonus(tier: number, vipBonusPercent: number = 0): number {
  const tierConfig = REFERRAL_TIERS.find(t => t.tier === tier);
  if (!tierConfig) return 0;
  return tierConfig.bonusPercentage + vipBonusPercent;
}

export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('referral_code, referral_count')
    .eq('user_id', userId)
    .maybeSingle();

  const referralCode = profile?.referral_code || generateReferralCode(userId);

  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId);

  const activeReferrals = (referrals || []).filter(r => r.status === 'active').length;
  const pendingReferrals = (referrals || []).filter(r => r.status === 'pending').length;

  const { data: commissions } = await supabase
    .from('referral_commissions')
    .select('amount, status, created_at')
    .eq('referrer_id', userId);

  const totalEarnings = (commissions || [])
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingEarnings = (commissions || [])
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const monthlyEarnings = (commissions || [])
    .filter(c => c.status === 'paid' && new Date(c.created_at) >= monthAgo)
    .reduce((sum, c) => sum + c.amount, 0);

  const { count: clickCount } = await supabase
    .from('referral_clicks')
    .select('id', { count: 'exact' })
    .eq('referral_code', referralCode);

  const conversionRate = clickCount && clickCount > 0
    ? ((referrals?.length || 0) / clickCount) * 100
    : 0;

  return {
    totalReferrals: referrals?.length || 0,
    activeReferrals,
    pendingReferrals,
    totalEarnings,
    pendingEarnings,
    monthlyEarnings,
    conversionRate,
    referralCode,
    referralLink: `https://takeyourtoken.com/signup?ref=${referralCode}`
  };
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const { data, error } = await supabase
    .from('referrals')
    .select(`
      id,
      referred_id,
      status,
      tier,
      commission_earned,
      created_at,
      profiles:referred_id(email, display_name, total_spent)
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(r => ({
    id: r.id,
    referredUserId: r.referred_id,
    referredEmail: r.profiles?.email || 'Unknown',
    referredName: r.profiles?.display_name || 'Anonymous',
    status: r.status,
    totalSpent: r.profiles?.total_spent || 0,
    commissionEarned: r.commission_earned || 0,
    joinedAt: r.created_at,
    tier: r.tier
  }));
}

export async function getCommissionHistory(
  userId: string,
  options: {
    status?: 'pending' | 'paid' | 'rejected';
    limit?: number;
    offset?: number;
  } = {}
): Promise<CommissionHistory[]> {
  const { status, limit = 50, offset = 0 } = options;

  let query = supabase
    .from('referral_commissions')
    .select(`
      id,
      referral_id,
      amount,
      commission_type,
      status,
      created_at,
      paid_at,
      referrals!inner(
        referred_id,
        profiles:referred_id(email)
      )
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(c => ({
    id: c.id,
    referralId: c.referral_id,
    referredUserEmail: c.referrals?.profiles?.email || 'Unknown',
    amount: c.amount,
    type: c.commission_type,
    status: c.status,
    createdAt: c.created_at,
    paidAt: c.paid_at
  }));
}

export async function trackReferralClick(referralCode: string): Promise<void> {
  await supabase.from('referral_clicks').insert({
    referral_code: referralCode,
    ip_hash: 'anonymous',
    user_agent: navigator.userAgent
  });
}

export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> {
  const { data: referrer } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (!referrer) {
    return { success: false, error: 'Invalid referral code' };
  }

  if (referrer.user_id === newUserId) {
    return { success: false, error: 'Cannot refer yourself' };
  }

  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', newUserId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Already referred' };
  }

  const { error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.user_id,
      referred_id: newUserId,
      tier: 1,
      status: 'pending'
    });

  if (error) {
    return { success: false, error: 'Failed to apply referral' };
  }

  return { success: true };
}

export function generateReferralCode(userId: string): string {
  const prefix = 'TYT';
  const hash = userId.slice(0, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${hash}${random}`;
}

export function calculateCommission(
  amount: number,
  tier: number,
  vipBonusPercent: number = 0
): number {
  const baseRate = getTierBonus(tier, vipBonusPercent);
  return amount * (baseRate / 100);
}

export async function getReferralLeaderboard(limit: number = 10): Promise<{
  userId: string;
  displayName: string;
  totalReferrals: number;
  totalEarnings: number;
  rank: number;
}[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, referral_count, referral_earnings')
    .gt('referral_count', 0)
    .order('referral_count', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((u, index) => ({
    userId: u.user_id,
    displayName: u.display_name || 'Anonymous',
    totalReferrals: u.referral_count || 0,
    totalEarnings: u.referral_earnings || 0,
    rank: index + 1
  }));
}
