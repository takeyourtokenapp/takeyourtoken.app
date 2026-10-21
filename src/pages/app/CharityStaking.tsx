import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Heart,
  TrendingUp,
  Lock,
  Unlock,
  Award,
  DollarSign,
  Clock,
  Users,
  Target,
  Sparkles,
  Info,
  CheckCircle,
  Calendar,
  Flame,
  Shield,
  Gift
} from 'lucide-react';

interface CharityPool {
  id: string;
  pool_name: string;
  description: string;
  asset: string;
  base_apy: number;
  bonus_apy: number;
  min_stake_amount: number;
  max_stake_amount: number | null;
  total_staked: number;
  pool_cap: number | null;
  min_lock_days: number;
  max_lock_days: number;
  foundation_allocation_percentage: number;
  total_donated: number;
  unique_stakers_count: number;
  is_active: boolean;
}

interface UserStake {
  id: string;
  pool_id: string;
  asset: string;
  stake_amount: number;
  apy: number;
  lock_days: number;
  staked_at: string;
  unlock_at: string;
  total_rewards_earned: number;
  total_donated: number;
  status: string;
  children_helped: number;
  research_funded_usd: number;
}

export default function CharityStaking() {
  const { user } = useAuth();
  const [pools, setPools] = useState<CharityPool[]>([]);
  const [userStakes, setUserStakes] = useState<UserStake[]>([]);
  const [selectedPool, setSelectedPool] = useState<CharityPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockDays, setLockDays] = useState(30);
  const [userBalance, setUserBalance] = useState(0);
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [poolsRes, stakesRes, walletRes] = await Promise.all([
        supabase
          .from('charity_staking_pools')
          .select('*')
          .eq('is_active', true)
          .order('base_apy'),
        supabase
          .from('charity_stakes')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'completed']),
        supabase
          .from('custodial_wallets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('asset', 'TYT')
          .maybeSingle()
      ]);

      if (poolsRes.data) setPools(poolsRes.data);
      if (stakesRes.data) setUserStakes(stakesRes.data);
      if (walletRes.data) setUserBalance(parseFloat(walletRes.data.balance));
    } catch (error) {
      console.error('Error loading charity staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!user || !selectedPool || !stakeAmount) return;

    const amount = parseFloat(stakeAmount);
    if (amount < selectedPool.min_stake_amount || amount > userBalance) return;

    setIsStaking(true);
    try {
      const { data, error } = await supabase.rpc('create_charity_stake', {
        p_user_id: user.id,
        p_pool_id: selectedPool.id,
        p_stake_amount: amount,
        p_lock_days: lockDays
      });

      if (error) throw error;

      setStakeAmount('');
      await loadData();
      setSelectedPool(null);
    } catch (error: any) {
      console.error('Error staking:', error);
      alert(error.message || 'Failed to stake');
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async (stakeId: string) => {
    if (!user) return;

    setIsUnstaking(true);
    try {
      const { error } = await supabase.rpc('withdraw_charity_stake', {
        p_stake_id: stakeId,
        p_user_id: user.id
      });

      if (error) throw error;

      await loadData();
    } catch (error: any) {
      console.error('Error unstaking:', error);
      alert(error.message || 'Failed to unstake');
    } finally {
      setIsUnstaking(false);
    }
  };

  const getPoolIcon = (poolName: string) => {
    if (poolName.includes('Hope')) return <Sparkles className="w-6 h-6" />;
    if (poolName.includes('Life')) return <Heart className="w-6 h-6" />;
    if (poolName.includes('Legacy')) return <Award className="w-6 h-6" />;
    if (poolName.includes('Hero')) return <Shield className="w-6 h-6" />;
    return <Gift className="w-6 h-6" />;
  };

  const getPoolColor = (poolName: string) => {
    if (poolName.includes('Hope')) return 'from-blue-500 to-cyan-500';
    if (poolName.includes('Life')) return 'from-pink-500 to-rose-500';
    if (poolName.includes('Legacy')) return 'from-purple-500 to-indigo-500';
    if (poolName.includes('Hero')) return 'from-gold-500 to-amber-500';
    return 'from-green-500 to-emerald-500';
  };

  const totalStaked = userStakes
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.stake_amount, 0);

  const totalDonated = userStakes.reduce((sum, s) => sum + s.total_donated, 0);

  const totalImpact = pools.reduce((sum, p) => sum + p.total_donated, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Heart className="w-8 h-8 text-pink-400" />
            Charity Staking
          </h1>
          <p className="text-gray-400">Stake TYT and support children with brain cancer</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-pink-900/30 to-rose-900/30 rounded-xl p-6 border border-pink-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Your Active Stakes</span>
            <Lock className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalStaked.toLocaleString()} TYT
          </div>
          <div className="text-sm text-gray-400">
            ${(totalStaked * 0.15).toLocaleString()} USD
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl p-6 border border-purple-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Donated</span>
            <Heart className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {totalDonated.toLocaleString()} TYT
          </div>
          <div className="text-sm text-gray-400">
            To Foundation Research
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-6 border border-blue-500/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Global Impact</span>
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ${(totalImpact * 0.15).toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">
            Raised for Children
          </div>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-semibold text-white mb-2">How Charity Staking Works</p>
            <ul className="space-y-1 text-xs">
              <li>✓ Lock your TYT tokens for a chosen period</li>
              <li>✓ Earn rewards based on APY (5% - 40%)</li>
              <li>✓ 100% of rewards automatically go to TYT Children's Brain Cancer Foundation</li>
              <li>✓ Get your principal back after lock period</li>
              <li>✓ Track your impact on children's lives</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Charity Pools</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {pools.map((pool) => {
            const gradient = getPoolColor(pool.pool_name);
            const icon = getPoolIcon(pool.pool_name);
            const totalApy = pool.base_apy + pool.bonus_apy;
            const utilizationPercent = pool.pool_cap
              ? (pool.total_staked / pool.pool_cap) * 100
              : 0;

            return (
              <div
                key={pool.id}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden hover:border-gold-500/50 transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${gradient}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl`}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{pool.pool_name}</h3>
                        <p className="text-xs text-gray-400">
                          {pool.min_lock_days} - {pool.max_lock_days} days
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {totalApy}%
                      </div>
                      <div className="text-xs text-gray-400">APY</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{pool.description}</p>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Min Stake</div>
                      <div className="font-bold">{pool.min_stake_amount} TYT</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Total Donated</div>
                      <div className="font-bold text-pink-400">
                        {pool.total_donated.toLocaleString()} TYT
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Pool Utilization</span>
                      <span className="text-gray-300">
                        {pool.unique_stakers_count} stakers
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${gradient} transition-all`}
                        style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPool(pool);
                      setLockDays(pool.min_lock_days);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all"
                  >
                    Stake in This Pool
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {userStakes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Stakes</h2>
          <div className="space-y-4">
            {userStakes.map((stake) => {
              const pool = pools.find(p => p.id === stake.pool_id);
              const isLocked = new Date(stake.unlock_at) > new Date();
              const daysRemaining = Math.ceil(
                (new Date(stake.unlock_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={stake.id}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1">{pool?.pool_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {stake.lock_days} days
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {stake.apy}% APY
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {stake.stake_amount.toLocaleString()} TYT
                      </div>
                      <div className="text-sm text-gray-400">Staked Amount</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Rewards Earned</div>
                      <div className="font-bold text-green-400">
                        {stake.total_rewards_earned.toFixed(2)} TYT
                      </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Donated</div>
                      <div className="font-bold text-pink-400">
                        {stake.total_donated.toFixed(2)} TYT
                      </div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Status</div>
                      <div className={`font-bold ${isLocked ? 'text-yellow-400' : 'text-green-400'}`}>
                        {isLocked ? `${daysRemaining}d left` : 'Unlocked'}
                      </div>
                    </div>
                  </div>

                  {stake.status === 'active' && (
                    <button
                      onClick={() => handleUnstake(stake.id)}
                      disabled={isLocked || isUnstaking}
                      className={`w-full py-3 rounded-lg font-semibold transition-all ${
                        isLocked
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      }`}
                    >
                      {isLocked ? (
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-5 h-5" />
                          Locked for {daysRemaining} days
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Unlock className="w-5 h-5" />
                          Withdraw Stake
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedPool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gold-500 max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Stake in {selectedPool.pool_name}</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Stake Amount (TYT)</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder={`Min: ${selectedPool.min_stake_amount}`}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Available: {userBalance.toLocaleString()} TYT
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Lock Period: {lockDays} days
                </label>
                <input
                  type="range"
                  min={selectedPool.min_lock_days}
                  max={selectedPool.max_lock_days}
                  value={lockDays}
                  onChange={(e) => setLockDays(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{selectedPool.min_lock_days} days</span>
                  <span>{selectedPool.max_lock_days} days</span>
                </div>
              </div>

              {stakeAmount && parseFloat(stakeAmount) > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Rewards:</span>
                      <span className="font-bold text-green-400">
                        {(
                          (parseFloat(stakeAmount) *
                            (selectedPool.base_apy + selectedPool.bonus_apy) *
                            lockDays) /
                          365 /
                          100
                        ).toFixed(2)}{' '}
                        TYT
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Goes to Foundation:</span>
                      <span className="font-bold text-pink-400">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">You Get Back:</span>
                      <span className="font-bold">{stakeAmount} TYT</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedPool(null)}
                className="flex-1 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStake}
                disabled={
                  isStaking ||
                  !stakeAmount ||
                  parseFloat(stakeAmount) < selectedPool.min_stake_amount ||
                  parseFloat(stakeAmount) > userBalance
                }
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStaking ? 'Staking...' : 'Confirm Stake'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
