import { supabase } from '../lib/supabase';

export interface UserProfile {
  user_id: string;
  kyc_status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  kyc_tier: number;
  access_level: 'restricted' | 'standard' | 'premium' | 'vip';
  reward_points: number;
  total_trading_volume: number;
  registration_date: string;
  kyc_submitted_at?: string;
  kyc_approved_at?: string;
  last_active: string;
}

export interface AccessFeature {
  feature_code: string;
  feature_name: string;
  description: string;
  required_kyc_tier: number;
  required_access_level: 'restricted' | 'standard' | 'premium' | 'vip';
  required_reward_points: number;
  is_active: boolean;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  requirements?: {
    currentTier: number;
    requiredTier: number;
    currentLevel: string;
    requiredLevel: string;
    currentPoints: number;
    requiredPoints: number;
  };
}

const ACCESS_LEVEL_HIERARCHY = {
  restricted: 0,
  standard: 1,
  premium: 2,
  vip: 3
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Get user profile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
}

export async function checkFeatureAccess(
  userId: string,
  featureCode: string
): Promise<FeatureAccessResult> {
  try {
    const { data: hasAccess, error } = await supabase
      .rpc('check_user_feature_access', {
        p_user_id: userId,
        p_feature_code: featureCode
      });

    if (error) {
      console.error('Check feature access error:', error);
      return {
        hasAccess: false,
        reason: 'Unable to verify access'
      };
    }

    if (hasAccess) {
      return { hasAccess: true };
    }

    const profile = await getUserProfile(userId);
    const feature = await getFeature(featureCode);

    if (!profile || !feature) {
      return {
        hasAccess: false,
        reason: 'Invalid user or feature'
      };
    }

    return {
      hasAccess: false,
      reason: getAccessDenialReason(profile, feature),
      requirements: {
        currentTier: profile.kyc_tier,
        requiredTier: feature.required_kyc_tier,
        currentLevel: profile.access_level,
        requiredLevel: feature.required_access_level,
        currentPoints: profile.reward_points,
        requiredPoints: feature.required_reward_points
      }
    };
  } catch (error) {
    console.error('Check feature access error:', error);
    return {
      hasAccess: false,
      reason: 'Access check failed'
    };
  }
}

async function getFeature(featureCode: string): Promise<AccessFeature | null> {
  try {
    const { data, error } = await supabase
      .from('access_features')
      .select('*')
      .eq('feature_code', featureCode)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

function getAccessDenialReason(profile: UserProfile, feature: AccessFeature): string {
  const reasons: string[] = [];

  if (profile.kyc_tier < feature.required_kyc_tier) {
    reasons.push(`Requires KYC Tier ${feature.required_kyc_tier} (you have Tier ${profile.kyc_tier})`);
  }

  const currentLevelValue = ACCESS_LEVEL_HIERARCHY[profile.access_level];
  const requiredLevelValue = ACCESS_LEVEL_HIERARCHY[feature.required_access_level];

  if (currentLevelValue < requiredLevelValue) {
    reasons.push(`Requires ${feature.required_access_level} access level (you have ${profile.access_level})`);
  }

  if (profile.reward_points < feature.required_reward_points) {
    reasons.push(
      `Requires ${feature.required_reward_points} reward points (you have ${profile.reward_points})`
    );
  }

  if (reasons.length === 0) {
    return 'Access denied';
  }

  return reasons.join('. ');
}

export async function getAllFeatures(): Promise<AccessFeature[]> {
  try {
    const { data, error } = await supabase
      .from('access_features')
      .select('*')
      .eq('is_active', true)
      .order('required_kyc_tier', { ascending: true });

    if (error) {
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get all features error:', error);
    return [];
  }
}

export async function getUserAccessibleFeatures(userId: string): Promise<string[]> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return [];

    const allFeatures = await getAllFeatures();
    const accessibleFeatures: string[] = [];

    for (const feature of allFeatures) {
      const access = await checkFeatureAccess(userId, feature.feature_code);
      if (access.hasAccess) {
        accessibleFeatures.push(feature.feature_code);
      }
    }

    return accessibleFeatures;
  } catch (error) {
    console.error('Get user accessible features error:', error);
    return [];
  }
}

export async function updateUserLastActive(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Update last active error:', error);
  }
}

export async function addRewardPoints(
  userId: string,
  points: number,
  reason: string
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;

    await supabase
      .from('user_profiles')
      .update({
        reward_points: profile.reward_points + points
      })
      .eq('user_id', userId);

    await supabase
      .from('user_feature_access')
      .insert({
        user_id: userId,
        feature_code: 'reward_earned',
        granted_reason: `${reason} (+${points} points)`,
        metadata: { points, reason }
      });
  } catch (error) {
    console.error('Add reward points error:', error);
  }
}

export async function updateTradingVolume(
  userId: string,
  volumeUSD: number
): Promise<void> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return;

    const newVolume = profile.total_trading_volume + volumeUSD;

    await supabase
      .from('user_profiles')
      .update({
        total_trading_volume: newVolume
      })
      .eq('user_id', userId);

    if (newVolume >= 100000 && profile.access_level === 'standard') {
      await upgradeAccessLevel(userId, 'premium', 'Trading volume milestone');
    } else if (newVolume >= 1000000 && profile.access_level === 'premium') {
      await upgradeAccessLevel(userId, 'vip', 'Trading volume milestone');
    }
  } catch (error) {
    console.error('Update trading volume error:', error);
  }
}

export async function upgradeAccessLevel(
  userId: string,
  newLevel: 'restricted' | 'standard' | 'premium' | 'vip',
  reason: string
): Promise<void> {
  try {
    await supabase
      .from('user_profiles')
      .update({
        access_level: newLevel
      })
      .eq('user_id', userId);

    await supabase
      .from('user_feature_access')
      .insert({
        user_id: userId,
        feature_code: 'access_level_upgrade',
        granted_reason: `Upgraded to ${newLevel}: ${reason}`,
        metadata: { new_level: newLevel, reason }
      });
  } catch (error) {
    console.error('Upgrade access level error:', error);
  }
}

export async function submitKYCDocuments(
  userId: string,
  documents: Array<{
    type: 'passport' | 'id_card' | 'drivers_license' | 'proof_of_address' | 'selfie';
    url: string;
  }>
): Promise<boolean> {
  try {
    for (const doc of documents) {
      await supabase
        .from('kyc_documents')
        .insert({
          user_id: userId,
          document_type: doc.type,
          document_url: doc.url,
          status: 'pending'
        });
    }

    await supabase
      .from('user_profiles')
      .update({
        kyc_status: 'pending',
        kyc_submitted_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    return true;
  } catch (error) {
    console.error('Submit KYC documents error:', error);
    return false;
  }
}

export async function getKYCStatus(userId: string): Promise<{
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  tier: number;
  documents: Array<{
    type: string;
    status: string;
    uploaded_at: string;
    rejection_reason?: string;
  }>;
}> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      return {
        status: 'not_submitted',
        tier: 0,
        documents: []
      };
    }

    const { data: documents } = await supabase
      .from('kyc_documents')
      .select('document_type, status, uploaded_at, rejection_reason')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    return {
      status: profile.kyc_status,
      tier: profile.kyc_tier,
      documents: documents || []
    };
  } catch (error) {
    console.error('Get KYC status error:', error);
    return {
      status: 'not_submitted',
      tier: 0,
      documents: []
    };
  }
}

export function getFeatureRequirements(feature: AccessFeature): string {
  const requirements: string[] = [];

  if (feature.required_kyc_tier > 0) {
    requirements.push(`KYC Tier ${feature.required_kyc_tier}`);
  }

  if (feature.required_access_level !== 'restricted') {
    requirements.push(`${feature.required_access_level} access`);
  }

  if (feature.required_reward_points > 0) {
    requirements.push(`${feature.required_reward_points} reward points`);
  }

  return requirements.length > 0 ? requirements.join(', ') : 'No requirements';
}

export function getNextTierBenefits(currentTier: number): string[] {
  const benefits: Record<number, string[]> = {
    0: [
      'Withdraw funds to external wallets',
      'Stake TYT tokens',
      'Buy and sell NFT miners',
      'Claim mining rewards'
    ],
    1: [
      'Access governance voting',
      'Premium trading features',
      'Higher withdrawal limits',
      'Priority support'
    ],
    2: [
      'VIP features and benefits',
      'Exclusive market access',
      'Maximum withdrawal limits',
      'Dedicated account manager'
    ]
  };

  return benefits[currentTier] || [];
}
