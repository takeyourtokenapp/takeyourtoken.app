import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Copy, DollarSign, TrendingUp, Award, Share2, Mail, MessageCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingRewards: number;
  tier: string;
}

interface Referral {
  id: string;
  referred_email: string;
  referred_username: string;
  status: 'pending' | 'active' | 'verified';
  total_spent: number;
  your_commission: number;
  joined_at: string;
}

export default function Referrals() {
  const { user } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingRewards: 0,
    tier: 'Bronze'
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setReferralCode(profile.referral_code);
      }

      const { data: referralData } = await supabase
        .from('referrals')
        .select(`
          id,
          referred_user_id,
          status,
          total_commission_earned,
          created_at,
          referred:profiles!referrals_referred_user_id_fkey(email, username)
        `)
        .eq('referrer_user_id', user.id)
        .order('created_at', { ascending: false });

      if (referralData) {
        const mappedReferrals: Referral[] = referralData.map((ref: any) => ({
          id: ref.id,
          referred_email: ref.referred?.email || 'N/A',
          referred_username: ref.referred?.username || 'User',
          status: ref.status,
          total_spent: 0,
          your_commission: ref.total_commission_earned || 0,
          joined_at: ref.created_at
        }));

        setReferrals(mappedReferrals);

        const totalEarnings = referralData.reduce((sum, r) => sum + (r.total_commission_earned || 0), 0);
        const activeCount = referralData.filter(r => r.status === 'active').length;

        setStats({
          totalReferrals: referralData.length,
          activeReferrals: activeCount,
          totalEarnings: totalEarnings,
          monthlyEarnings: totalEarnings * 0.3,
          pendingRewards: 0,
          tier: getTier(referralData.length)
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTier = (count: number): string => {
    if (count >= 50) return 'Platinum';
    if (count >= 20) return 'Gold';
    if (count >= 5) return 'Silver';
    return 'Bronze';
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'from-cyan-400 to-blue-500';
      case 'Gold': return 'from-amber-400 to-yellow-500';
      case 'Silver': return 'from-gray-400 to-gray-500';
      default: return 'from-amber-700 to-orange-700';
    }
  };

  const getTierCommission = (tier: string): string => {
    switch (tier) {
      case 'Platinum': return '15%';
      case 'Gold': return '12%';
      case 'Silver': return '8%';
      default: return '5%';
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast.showSuccess('Referral code copied!');
  };

  const handleCopyLink = () => {
    const link = `https://takeyourtoken.app/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.showSuccess('Referral link copied!');
  };

  const handleShareEmail = () => {
    const subject = 'Join TakeYourToken - Mine Bitcoin & Support Children';
    const body = `Hi!\n\nI've been using TakeYourToken to mine Bitcoin while supporting children's brain cancer research. It's an amazing platform!\n\nUse my referral code to get started: ${referralCode}\n\nSign up here: https://takeyourtoken.app/signup?ref=${referralCode}\n\nEvery transaction helps save children's lives!\n\nBest regards`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'verified': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-gray-400">Earn commission by inviting friends to TakeYourToken</p>
      </div>

      {/* Referral Code Card */}
      <div className={`bg-gradient-to-br ${getTierColor(stats.tier)} bg-opacity-20 border border-current rounded-xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getTierColor(stats.tier)} flex items-center justify-center`}>
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{stats.tier} Tier</h2>
              <p className="text-sm text-gray-400">{getTierCommission(stats.tier)} commission on referrals</p>
            </div>
          </div>
          <button
            onClick={() => setShareOpen(!shareOpen)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20 flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        <div className="bg-black/20 rounded-lg p-4 border border-white/10">
          <label className="text-sm text-gray-300 mb-2 block">Your Referral Code</label>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-2xl font-bold tracking-wider">{referralCode}</code>
            <button
              onClick={handleCopyCode}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mt-4 bg-black/20 rounded-lg p-4 border border-white/10">
          <label className="text-sm text-gray-300 mb-2 block">Your Referral Link</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={`https://takeyourtoken.app/signup?ref=${referralCode}`}
              readOnly
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {shareOpen && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleShareEmail}
              className="flex-1 px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/50 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => {
                const link = `https://takeyourtoken.app/signup?ref=${referralCode}`;
                window.open(`https://telegram.me/share/url?url=${encodeURIComponent(link)}&text=Join TakeYourToken and support children!`, '_blank');
              }}
              className="flex-1 px-4 py-3 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors border border-cyan-500/50 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Telegram
            </button>
            <button
              onClick={() => {
                const link = `https://takeyourtoken.app/signup?ref=${referralCode}`;
                const text = 'Join TakeYourToken - Mine Bitcoin & Support Children!';
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`, '_blank');
              }}
              className="flex-1 px-4 py-3 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/30 transition-colors border border-sky-500/50 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Twitter
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Referrals"
          value={stats.totalReferrals.toString()}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle className="w-6 h-6" />}
          label="Active Referrals"
          value={stats.activeReferrals.toString()}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6" />}
          label="Total Earnings"
          value={`$${stats.totalEarnings.toFixed(2)}`}
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="This Month"
          value={`$${stats.monthlyEarnings.toFixed(2)}`}
          color="purple"
        />
      </div>

      {/* Tier Progress */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">Tier Progress</h3>
        <div className="space-y-4">
          <TierProgress
            name="Bronze"
            commission="5%"
            required="0-4 referrals"
            current={stats.totalReferrals}
            max={4}
            active={stats.tier === 'Bronze'}
          />
          <TierProgress
            name="Silver"
            commission="8%"
            required="5-19 referrals"
            current={stats.totalReferrals}
            max={19}
            active={stats.tier === 'Silver'}
          />
          <TierProgress
            name="Gold"
            commission="12%"
            required="20-49 referrals"
            current={stats.totalReferrals}
            max={49}
            active={stats.tier === 'Gold'}
          />
          <TierProgress
            name="Platinum"
            commission="15%"
            required="50+ referrals"
            current={stats.totalReferrals}
            max={50}
            active={stats.tier === 'Platinum'}
          />
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold">Your Referrals</h3>
        </div>

        {referrals.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-2">No referrals yet</p>
            <p className="text-sm">Share your referral code to start earning commissions!</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Your Commission</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold">{referral.referred_username}</div>
                          <div className="text-sm text-gray-400">{referral.referred_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(referral.status)}`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-green-400">
                          ${referral.your_commission.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {new Date(referral.joined_at).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-800">
              {referrals.map((referral) => (
                <div key={referral.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{referral.referred_username}</div>
                      <div className="text-xs text-gray-400">{referral.referred_email}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(referral.status)}`}>
                      {referral.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-400">
                      {new Date(referral.joined_at).toLocaleDateString()}
                    </span>
                    <span className="font-bold text-green-400">
                      ${referral.your_commission.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colorClasses: any = {
    blue: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
    green: 'bg-green-500/10 border-green-500/50 text-green-400',
    amber: 'bg-amber-500/10 border-amber-500/50 text-amber-400',
    purple: 'bg-purple-500/10 border-purple-500/50 text-purple-400'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TierProgress({ name, commission, required, current, max, active }: {
  name: string;
  commission: string;
  required: string;
  current: number;
  max: number;
  active: boolean;
}) {
  const progress = Math.min((current / max) * 100, 100);

  return (
    <div className={`p-4 rounded-lg border ${active ? 'bg-blue-500/10 border-blue-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="font-bold">{name}</span>
          {active && <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Current</span>}
        </div>
        <div className="text-right">
          <div className="font-bold text-green-400">{commission}</div>
          <div className="text-xs text-gray-400">{required}</div>
        </div>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
