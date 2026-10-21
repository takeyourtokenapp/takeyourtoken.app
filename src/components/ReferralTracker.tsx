import { useState, useEffect } from 'react';
import { Users, Copy, Check, Gift, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  pendingRewards: number;
  referralCode: string;
}

export default function ReferralTracker() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarned: 0,
    pendingRewards: 0,
    referralCode: ''
  });
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    try {
      setIsLoading(true);

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('referral_code')
        .eq('id', user?.id)
        .single();

      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id);

      const { data: earnings } = await supabase
        .from('referral_earnings')
        .select('amount, status')
        .eq('referrer_id', user?.id);

      const totalEarned = earnings?.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0) || 0;
      const pendingRewards = earnings?.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0) || 0;
      const activeReferrals = referrals?.filter(r => r.status === 'active').length || 0;

      setStats({
        totalReferrals: referrals?.length || 0,
        activeReferrals,
        totalEarned,
        pendingRewards,
        referralCode: userProfile?.referral_code || ''
      });
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    const referralLink = `${window.location.origin}/signup?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border-2 border-purple-700 rounded-2xl p-6 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500">
          <Gift size={28} className="text-purple-400" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">Referral Program</h3>
          <p className="text-sm text-gray-400">Earn rewards by inviting friends</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
            <div className="text-sm text-gray-400 mb-2">Your Referral Link</div>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg font-mono text-sm truncate">
                {window.location.origin}/signup?ref={stats.referralCode}
              </div>
              <button
                onClick={handleCopyCode}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={20} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Users size={18} className="text-blue-400" />
                <span className="text-sm text-gray-400">Total Referrals</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">{stats.totalReferrals}</div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-green-400" />
                <span className="text-sm text-gray-400">Active</span>
              </div>
              <div className="text-3xl font-bold text-green-400">{stats.activeReferrals}</div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-amber-400" />
                <span className="text-sm text-gray-400">Total Earned</span>
              </div>
              <div className="text-3xl font-bold text-amber-400">${stats.totalEarned.toFixed(2)}</div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-purple-400" />
                <span className="text-sm text-gray-400">Pending</span>
              </div>
              <div className="text-3xl font-bold text-purple-400">${stats.pendingRewards.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Gift className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-amber-400 mb-2">Referral Rewards</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <strong>5% commission</strong> on first purchase</li>
                  <li>• <strong>2% ongoing</strong> from mining rewards</li>
                  <li>• <strong>1% lifetime</strong> marketplace sales</li>
                  <li>• Bonus rewards for active referrals</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/50">
              View Detailed Stats
            </button>
          </div>
        </>
      )}
    </div>
  );
}
