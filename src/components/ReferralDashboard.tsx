import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Clock,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Gift,
  Award,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getUserReferralStats,
  getUserReferrals,
  getReferralTiers,
  type ReferralStats,
  type Referral,
  type ReferralTier
} from '../utils/referralService';

export default function ReferralDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showTiers, setShowTiers] = useState(false);

  const tiers = getReferralTiers();

  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user?.id]);

  async function loadReferralData() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [statsData, referralsData] = await Promise.all([
        getUserReferralStats(user.id),
        getUserReferrals(user.id)
      ]);

      setStats(statsData);
      setReferrals(referralsData);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function copyReferralLink() {
    if (!stats?.referralLink) return;

    try {
      await navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      showToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  }

  async function copyReferralCode() {
    if (!stats?.referralCode) return;

    try {
      await navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      showToast('Referral code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy', 'error');
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Referral Program</h2>
              <p className="text-sm text-gray-400">Earn up to 5% on every referral purchase</p>
            </div>
          </div>
          <button
            onClick={loadReferralData}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-2">Your Referral Link</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-800 rounded-lg px-4 py-2 font-mono text-sm truncate">
              {stats.referralLink}
            </div>
            <button
              onClick={copyReferralLink}
              className="p-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="text-sm text-gray-400">
              Code: <span className="text-amber-400 font-semibold">{stats.referralCode}</span>
            </div>
            <button
              onClick={copyReferralCode}
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy Code
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Referrals"
            value={stats.totalReferrals.toString()}
            color="amber"
          />
          <StatCard
            icon={TrendingUp}
            label="Active"
            value={stats.activeReferrals.toString()}
            color="green"
          />
          <StatCard
            icon={DollarSign}
            label="Total Earned"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            color="cyan"
          />
          <StatCard
            icon={Clock}
            label="Pending"
            value={`$${stats.pendingEarnings.toFixed(2)}`}
            color="orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Commission Tiers
            </h3>
            <button
              onClick={() => setShowTiers(!showTiers)}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              {showTiers ? 'Hide' : 'Details'}
            </button>
          </div>

          <div className="space-y-3">
            {tiers.map((tier) => (
              <div
                key={tier.tier}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tier.tier === 1 ? 'bg-amber-500/20 text-amber-400' :
                    tier.tier === 2 ? 'bg-blue-500/20 text-blue-400' :
                    tier.tier === 3 ? 'bg-green-500/20 text-green-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {tier.tier}
                  </div>
                  <div>
                    <div className="font-medium">{tier.name}</div>
                    {showTiers && (
                      <div className="text-xs text-gray-500">
                        {tier.requirement > 0 ? `${tier.requirement}+ referrals` : 'Default'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-lg font-bold text-amber-400">
                  {tier.bonusPercentage}%
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2 text-sm">
              <Gift className="w-4 h-4 text-amber-400" />
              <span className="text-gray-300">VIP members earn additional bonus!</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              Recent Referrals
            </h3>
            <Link
              to="/app/referrals"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Share your link to start earning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.slice(0, 5).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      referral.status === 'active' ? 'bg-green-400' :
                      referral.status === 'pending' ? 'bg-amber-400' : 'bg-gray-400'
                    }`} />
                    <div>
                      <div className="font-medium">{referral.referredName}</div>
                      <div className="text-xs text-gray-500">
                        Tier {referral.tier} - {new Date(referral.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-400">
                      +${referral.commissionEarned.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ${referral.totalSpent.toFixed(0)} spent
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Target className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-lg mb-2">How to Maximize Your Referrals</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <div className="font-medium text-blue-400 mb-1">1. Share Your Link</div>
                <p>Post on social media, forums, or share directly with friends interested in crypto mining.</p>
              </div>
              <div>
                <div className="font-medium text-blue-400 mb-1">2. Earn Commissions</div>
                <p>Get 5% on all purchases made by your direct referrals, plus bonuses for deeper tiers.</p>
              </div>
              <div>
                <div className="font-medium text-blue-400 mb-1">3. Grow Your Network</div>
                <p>The more referrals you have, the more passive income you generate. VIP status adds extra bonuses!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color
}: {
  icon: typeof Users;
  label: string;
  value: string;
  color: 'amber' | 'green' | 'cyan' | 'orange';
}) {
  const colorClasses = {
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg border p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color].split(' ').pop()}`} />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
