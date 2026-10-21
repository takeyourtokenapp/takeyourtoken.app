import { ReactNode } from 'react';
import { useFeatureAccess, useUserProfile } from '../hooks/useAccessControl';
import { Lock, AlertCircle, TrendingUp, Shield, Award } from 'lucide-react';

interface AccessGuardProps {
  featureCode: string;
  children: ReactNode;
  fallback?: ReactNode;
  showRequirements?: boolean;
}

export default function AccessGuard({
  featureCode,
  children,
  fallback,
  showRequirements = true
}: AccessGuardProps) {
  const { hasAccess, reason, requirements, loading } = useFeatureAccess(featureCode);
  const { profile } = useUserProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-3 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showRequirements) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 bg-red-500/20 rounded-full">
            <Lock className="w-12 h-12 text-red-400" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold mb-2">Access Restricted</h3>
          <p className="text-gray-400">{reason}</p>
        </div>

        {requirements && (
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-4 text-left">
            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold-400" />
              Requirements
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <AlertCircle size={18} />
                  <span>KYC Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={requirements.currentTier >= requirements.requiredTier ? 'text-green-400' : 'text-red-400'}>
                    Tier {requirements.currentTier}
                  </span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gold-400">Tier {requirements.requiredTier}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Shield size={18} />
                  <span>Access Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={
                    ['restricted', 'standard', 'premium', 'vip'].indexOf(requirements.currentLevel) >=
                    ['restricted', 'standard', 'premium', 'vip'].indexOf(requirements.requiredLevel)
                      ? 'text-green-400'
                      : 'text-red-400'
                  }>
                    {requirements.currentLevel}
                  </span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gold-400">{requirements.requiredLevel}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-400">
                  <Award size={18} />
                  <span>Reward Points</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={requirements.currentPoints >= requirements.requiredPoints ? 'text-green-400' : 'text-red-400'}>
                    {requirements.currentPoints.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gold-400">{requirements.requiredPoints.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {profile && profile.kyc_tier < (requirements?.requiredTier || 1) && (
            <button
              onClick={() => window.location.href = '/app/settings?tab=kyc'}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-amber-500 rounded-lg font-semibold hover:from-gold-400 hover:to-amber-400 transition-all"
            >
              Complete KYC Verification
            </button>
          )}

          <button
            onClick={() => window.location.href = '/app/academy'}
            className="px-6 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
          >
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

export function RequiresKYC({ tier, children }: { tier: number; children: ReactNode }) {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-6 h-6 border-3 border-gold-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile || profile.kyc_tier < tier) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-300">
          This feature requires KYC Tier {tier} verification. Your current tier is {profile?.kyc_tier || 0}.
          <button
            onClick={() => window.location.href = '/app/settings?tab=kyc'}
            className="block mt-2 text-gold-400 hover:text-gold-300 font-semibold"
          >
            Complete Verification →
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AccessBadge({ level }: { level: 'restricted' | 'standard' | 'premium' | 'vip' }) {
  const colors = {
    restricted: 'text-gray-400 bg-gray-500/20 border-gray-500/50',
    standard: 'text-blue-400 bg-blue-500/20 border-blue-500/50',
    premium: 'text-purple-400 bg-purple-500/20 border-purple-500/50',
    vip: 'text-gold-400 bg-gold-500/20 border-gold-500/50'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${colors[level]}`}>
      <Shield size={12} />
      {level.toUpperCase()}
    </span>
  );
}
