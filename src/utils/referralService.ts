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
    .from('profiles')
    .select('referral_code')
    .eq('id', userId)
    .maybeSingle();

  const referralCode = profile?.referral_code || generateReferralCode(userId);

  const { data: referredUsers } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('referred_by', userId);

  const totalReferrals = referredUsers?.length || 0;

  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('commission_amount, status, created_at')
    .eq('referrer_id', userId);

  const totalEarnings = (earnings || [])
    .filter(e => e.status === 'paid')
    .reduce((sum, e) => sum + parseFloat(e.commission_amount || '0'), 0);

  const pendingEarnings = (earnings || [])
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + parseFloat(e.commission_amount || '0'), 0);

  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const monthlyEarnings = (earnings || [])
    .filter(e => e.status === 'paid' && new Date(e.created_at) >= monthAgo)
    .reduce((sum, e) => sum + parseFloat(e.commission_amount || '0'), 0);

  const activeReferrals = (earnings || []).filter(e => e.status === 'paid').length;
  const pendingReferrals = totalReferrals - activeReferrals;

  return {
    totalReferrals,
    activeReferrals: Math.max(0, activeReferrals),
    pendingReferrals: Math.max(0, pendingReferrals),
    totalEarnings,
    pendingEarnings,
    monthlyEarnings,
    conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0,
    referralCode,
    referralLink: `https://takeyourtoken.com/signup?ref=${referralCode}`
  };
}

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const { data: referredUsers, error } = await supabase
    .from('profiles')
    .select('id, email, username, full_name, created_at')
    .eq('referred_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('referred_user_id, commission_amount, status, event_type')
    .eq('referrer_id', userId);

  const earningsByUser = new Map<string, { total: number; status: string }>();
  for (const e of earnings || []) {
    const existing = earningsByUser.get(e.referred_user_id) || { total: 0, status: 'pending' };
    existing.total += parseFloat(e.commission_amount || '0');
    if (e.status === 'paid') existing.status = 'active';
    earningsByUser.set(e.referred_user_id, existing);
  }

  return (referredUsers || []).map(u => {
    const earning = earningsByUser.get(u.id);
    return {
      id: u.id,
      referredUserId: u.id,
      referredEmail: u.email || 'Unknown',
      referredName: u.full_name || u.username || 'Anonymous',
      status: (earning?.status as 'pending' | 'active') || 'pending',
      totalSpent: 0,
      commissionEarned: earning?.total || 0,
      joinedAt: u.created_at,
      tier: 1
    };
  });
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
    .from('referral_earnings')
    .select(`
      id,
      referred_user_id,
      commission_amount,
      event_type,
      status,
      created_at,
      paid_at
    `)
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const userIds = [...new Set((data || []).map(d => d.referred_user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  const emailMap = new Map<string, string>();
  for (const p of profiles || []) {
    emailMap.set(p.id, p.email || 'Unknown');
  }

  return (data || []).map(c => ({
    id: c.id,
    referralId: c.id,
    referredUserEmail: emailMap.get(c.referred_user_id) || 'Unknown',
    amount: parseFloat(c.commission_amount || '0'),
    type: c.event_type as 'purchase' | 'maintenance' | 'upgrade' | 'marketplace',
    status: c.status as 'pending' | 'paid' | 'rejected',
    createdAt: c.created_at,
    paidAt: c.paid_at
  }));
}

export async function trackReferralClick(_referralCode: string): Promise<void> {
  // Referral click tracking is not supported in the current DB schema
  // (referral_clicks view maps to referral_earnings which requires referrer_id + referred_user_id)
}

export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> {
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', referralCode)
    .maybeSingle();

  if (!referrer) {
    return { success: false, error: 'Invalid referral code' };
  }

  if (referrer.id === newUserId) {
    return { success: false, error: 'Cannot refer yourself' };
  }

  const { data: existing } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', newUserId)
    .maybeSingle();

  if (existing?.referred_by) {
    return { success: false, error: 'Already referred' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ referred_by: referrer.id })
    .eq('id', newUserId);

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
  const { data: referrers, error } = await supabase
    .from('referral_earnings')
    .select('referrer_id, commission_amount, status')
    .eq('status', 'paid');

  if (error) throw error;

  const statsByUser = new Map<string, { count: number; earnings: number }>();
  for (const e of referrers || []) {
    const existing = statsByUser.get(e.referrer_id) || { count: 0, earnings: 0 };
    existing.earnings += parseFloat(e.commission_amount || '0');
    statsByUser.set(e.referrer_id, existing);
  }

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username, full_name')
    .in('id', [...statsByUser.keys()]);

  const nameMap = new Map<string, string>();
  for (const p of profilesData || []) {
    nameMap.set(p.id, p.full_name || p.username || 'Anonymous');
  }

  const results = [...statsByUser.entries()]
    .map(([userId, stats]) => ({
      userId,
      displayName: nameMap.get(userId) || 'Anonymous',
      totalReferrals: stats.count,
      totalEarnings: stats.earnings,
      rank: 0
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return results;
}
