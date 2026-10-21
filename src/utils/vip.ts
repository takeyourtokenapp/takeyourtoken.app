import { supabase } from '../lib/supabase';
import type { VIPTier } from '../types/database';

export type VIPLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface VIPBenefits {
  level: VIPLevel;
  name: string;
  minTYTBalance: number;
  marketplaceFeeDiscount: number;
  maintenanceDiscount: number;
  reinvestBonus: number;
  referralBonus: number;
  color: string;
  icon: string;
}

export const VIP_TIERS: Record<VIPLevel, VIPBenefits> = {
  none: {
    level: 'none',
    name: 'None',
    minTYTBalance: 0,
    marketplaceFeeDiscount: 0,
    maintenanceDiscount: 0,
    reinvestBonus: 0,
    referralBonus: 5,
    color: 'gray',
    icon: '🦉'
  },
  bronze: {
    level: 'bronze',
    name: 'Bronze',
    minTYTBalance: 10000,
    marketplaceFeeDiscount: 10,
    maintenanceDiscount: 5,
    reinvestBonus: 2,
    referralBonus: 7,
    color: '#CD7F32',
    icon: '🥉'
  },
  silver: {
    level: 'silver',
    name: 'Silver',
    minTYTBalance: 50000,
    marketplaceFeeDiscount: 20,
    maintenanceDiscount: 10,
    reinvestBonus: 4,
    referralBonus: 10,
    color: '#C0C0C0',
    icon: '🥈'
  },
  gold: {
    level: 'gold',
    name: 'Gold',
    minTYTBalance: 150000,
    marketplaceFeeDiscount: 30,
    maintenanceDiscount: 15,
    reinvestBonus: 6,
    referralBonus: 12,
    color: '#FFD700',
    icon: '🥇'
  },
  platinum: {
    level: 'platinum',
    name: 'Platinum',
    minTYTBalance: 500000,
    marketplaceFeeDiscount: 40,
    maintenanceDiscount: 20,
    reinvestBonus: 8,
    referralBonus: 15,
    color: '#E5E4E2',
    icon: '💎'
  },
  diamond: {
    level: 'diamond',
    name: 'Diamond',
    minTYTBalance: 1500000,
    marketplaceFeeDiscount: 50,
    maintenanceDiscount: 25,
    reinvestBonus: 10,
    referralBonus: 20,
    color: '#B9F2FF',
    icon: '👑'
  }
};

export function getUserVIPLevel(tytBalance: number): VIPBenefits {
  if (tytBalance >= VIP_TIERS.diamond.minTYTBalance) return VIP_TIERS.diamond;
  if (tytBalance >= VIP_TIERS.platinum.minTYTBalance) return VIP_TIERS.platinum;
  if (tytBalance >= VIP_TIERS.gold.minTYTBalance) return VIP_TIERS.gold;
  if (tytBalance >= VIP_TIERS.silver.minTYTBalance) return VIP_TIERS.silver;
  if (tytBalance >= VIP_TIERS.bronze.minTYTBalance) return VIP_TIERS.bronze;
  return VIP_TIERS.none;
}

export async function syncUserVIPTier(userId: string): Promise<VIPBenefits> {
  const { data: wallet } = await supabase
    .from('custodial_wallets')
    .select('balance')
    .eq('user_id', userId)
    .eq('asset', 'TYT')
    .maybeSingle();

  const tytBalance = wallet ? parseFloat(wallet.balance) : 0;
  const vipLevel = getUserVIPLevel(tytBalance);

  const { data: existingTier } = await supabase
    .from('vip_tiers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingTier) {
    await supabase
      .from('vip_tiers')
      .update({
        tier_level: vipLevel.level,
        current_tyt_balance: tytBalance.toString(),
        benefits: {
          marketplaceFeeDiscount: vipLevel.marketplaceFeeDiscount,
          maintenanceDiscount: vipLevel.maintenanceDiscount,
          reinvestBonus: vipLevel.reinvestBonus,
          referralBonus: vipLevel.referralBonus
        }
      })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('vip_tiers')
      .insert({
        user_id: userId,
        tier_level: vipLevel.level,
        current_tyt_balance: tytBalance.toString(),
        benefits: {
          marketplaceFeeDiscount: vipLevel.marketplaceFeeDiscount,
          maintenanceDiscount: vipLevel.maintenanceDiscount,
          reinvestBonus: vipLevel.reinvestBonus,
          referralBonus: vipLevel.referralBonus
        }
      });
  }

  return vipLevel;
}

export async function createReferralCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('code', code)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Referral code already exists' };
  }

  const { error } = await supabase
    .from('referral_codes')
    .insert({
      user_id: userId,
      code: code,
      is_active: true,
      usage_count: 0
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; error?: string }> {
  const { data: code } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', referralCode)
    .eq('is_active', true)
    .maybeSingle();

  if (!code) {
    return { success: false, error: 'Invalid referral code' };
  }

  if (code.usage_limit && code.usage_count >= code.usage_limit) {
    return { success: false, error: 'Referral code usage limit reached' };
  }

  const { error: referralError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: code.user_id,
      referred_id: newUserId,
      referral_code: referralCode,
      status: 'pending'
    });

  if (referralError) {
    return { success: false, error: referralError.message };
  }

  await supabase
    .from('referral_codes')
    .update({ usage_count: code.usage_count + 1 })
    .eq('id', code.id);

  return { success: true };
}

export async function calculateReferralReward(
  referrerId: string,
  rewardAmount: number
): Promise<number> {
  const vipLevel = await syncUserVIPTier(referrerId);
  return rewardAmount * (vipLevel.referralBonus / 100);
}

export async function processReferralReward(
  referralId: string,
  transactionType: 'purchase' | 'maintenance',
  amountUsd: number
): Promise<void> {
  const { data: referral } = await supabase
    .from('referrals')
    .select('*, profiles!referrals_referrer_id_fkey(id)')
    .eq('id', referralId)
    .maybeSingle();

  if (!referral || referral.status !== 'active') return;

  const baseReward = amountUsd * 0.05;
  const bonusReward = await calculateReferralReward(referral.referrer_id, baseReward);
  const totalReward = baseReward + bonusReward;

  await supabase
    .from('referral_rewards')
    .insert({
      referral_id: referralId,
      reward_type: transactionType,
      reward_amount_usd: totalReward.toString(),
      credited: false
    });

  await supabase.rpc('increment_referral_earnings', {
    p_referral_id: referralId,
    p_amount: totalReward
  });
}
