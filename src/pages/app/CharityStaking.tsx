import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, TrendingUp, Lock, Unlock, Info, Award, DollarSign, Calendar, Activity } from 'lucide-react';

interface StakingPool {
  id: string;
  name: string;
  blockchain: string;
  token_symbol: string;
  apy: number;
  min_stake: number;
  lock_period_days: number;
  total_staked: number;
  max_capacity: number;
  is_active: boolean;
  description: string | null;
}

interface UserStake {
  id: string;
  pool_id: string;
  amount: number;
  start_date: string;
  unlock_date: string;
  rewards_earned: number;
  status: string;
  pool?: StakingPool;
}

export default function CharityStaking() {
  const { user } = useAuth();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [poolsRes, stakesRes] = await Promise.all([
        supabase.from('staking_pools').select('*').eq('is_active', true).order('apy', { ascending: false }),
        user
          ? supabase.from('user_stakes').select(`
              *,
              pool:staking_pools!inner(*)
            `).eq('user_id', user.id).order('created_at', { ascending: false })
          : Promise.resolve({ data: null, error: null })
      ]);

      if (poolsRes.error) throw poolsRes.error;
      setPools(poolsRes.data || []);
      setStakes((stakesRes.data as UserStake[]) || []);
    } catch (error) {
      console.error('Error loading staking data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalStaked = pools.reduce((s, p) => s + parseFloat(String(p.total_staked)), 0);
  const activeStakes = stakes.filter(s => s.status === 'active');
  const userTotalStaked = activeStakes.reduce((s, st) => s + parseFloat(String(st.amount)), 0);
  const userRewards = activeStakes.reduce((s, st) => s + parseFloat(String(st.rewards_earned)), 0);

  async function handleStake() {
    if (!user || !selectedPool || !stakeAmount) return;
    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) return;

    setActionLoading(true);
    try {
      const pool = pools.find(p => p.id === selectedPool);
      if (!pool) return;

      const unlockDate = new Date();
      unlockDate.setDate(unlockDate.getDate() + pool.lock_period_days);

      const { error } = await supabase.from('user_stakes').insert({
        user_id: user.id,
        pool_id: selectedPool,
        amount: amount,
        wallet_address: user.id,
        start_date: new Date().toISOString(),
        unlock_date: unlockDate.toISOString(),
        status: 'active'
      });

      if (error) throw error;

      await supabase.from('staking_pools')
        .update({ total_staked: parseFloat(String(pool.total_staked)) + amount })
        .eq('id', selectedPool);

      setStakeAmount('');
      setSelectedPool(null);
      loadData();
    } catch (error) {
      console.error('Staking failed:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnstake(stakeId: string) {
    if (!user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('user_stakes')
        .update({ status: 'withdrawn', withdrawn_at: new Date().toISOString() })
        .eq('id', stakeId)
        .eq('user_id', user.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Unstaking failed:', error);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Heart className="w-8 h-8 text-pink-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Charity Staking</h1>
        <p className="text-tertiary-text">Stake TYT tokens to support the Children's Brain Cancer Foundation. Earn yield while contributing to medical research.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 rounded-xl p-6 border border-pink-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary-text">Total Staked (Global)</span>
            <DollarSign className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-pink-400">{totalStaked.toLocaleString()}</div>
          <div className="text-sm text-tertiary-text mt-1">TYT tokens</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Your Active Stakes</span>
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{userTotalStaked.toLocaleString()}</div>
          <div className="text-sm text-tertiary-text mt-1">TYT staked</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Your Rewards</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{userRewards.toFixed(2)}</div>
          <div className="text-sm text-tertiary-text mt-1">TYT earned</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Active Pools</span>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{pools.length}</div>
          <div className="text-sm text-tertiary-text mt-1">staking pools</div>
        </div>
      </div>

      {activeStakes.length > 0 && (
        <div className="bg-secondary rounded-xl border border-secondary p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-pink-400" /> Your Active Stakes
          </h2>
          <div className="space-y-4">
            {activeStakes.map(stake => {
              const pool = stake.pool;
              const unlockDate = new Date(stake.unlock_date);
              const daysLeft = Math.ceil((unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUnlocked = daysLeft <= 0;

              return (
                <div key={stake.id} className="bg-tertiary rounded-xl p-5 border border-secondary">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-semibold text-lg">{pool?.name || 'Staking Pool'}</div>
                      <div className="text-sm text-tertiary-text">{pool?.blockchain} - {pool?.token_symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-400">{parseFloat(String(stake.amount)).toLocaleString()} TYT</div>
                      <div className="text-xs text-tertiary-text">staked</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-tertiary-text text-xs">APY</div>
                      <div className="font-bold text-green-400">{pool ? parseFloat(String(pool.apy)) * 100 : 0}%</div>
                    </div>
                    <div>
                      <div className="text-tertiary-text text-xs">Rewards</div>
                      <div className="font-bold text-green-400">{parseFloat(String(stake.rewards_earned)).toFixed(2)} TYT</div>
                    </div>
                    <div>
                      <div className="text-tertiary-text text-xs">{isUnlocked ? 'Unlocked' : 'Days Left'}</div>
                      <div className={`font-bold ${isUnlocked ? 'text-green-400' : 'text-amber-400'}`}>{isUnlocked ? 'Yes' : daysLeft}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnstake(stake.id)}
                    disabled={actionLoading || !isUnlocked}
                    className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isUnlocked
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500'
                    }`}
                  >
                    <Unlock size={18} />
                    {isUnlocked ? 'Unstake & Claim Rewards' : 'Emergency Unstake (Lose Rewards)'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-secondary rounded-xl border border-secondary p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-pink-400" /> Available Staking Pools
        </h2>

        {pools.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
            <p className="text-tertiary-text">No staking pools available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pools.map(pool => {
              const utilization = pool.max_capacity > 0 ? (parseFloat(String(pool.total_staked)) / parseFloat(String(pool.max_capacity))) * 100 : 0;
              const isSelected = selectedPool === pool.id;

              return (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPool(isSelected ? null : pool.id)}
                  className={`bg-tertiary rounded-xl p-6 border-2 cursor-pointer transition-all ${
                    isSelected ? 'border-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.3)]' : 'border-secondary hover:border-pink-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{pool.name}</h3>
                      <div className="text-sm text-tertiary-text">{pool.blockchain} - {pool.token_symbol}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{parseFloat(String(pool.apy)) * 100}%</div>
                      <div className="text-xs text-tertiary-text">APY</div>
                    </div>
                  </div>

                  {pool.description && <p className="text-sm text-tertiary-text mb-4">{pool.description}</p>}

                  <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                    <div>
                      <div className="text-tertiary-text text-xs">Min Stake</div>
                      <div className="font-bold">{parseFloat(String(pool.min_stake)).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-tertiary-text text-xs">Lock Period</div>
                      <div className="font-bold">{pool.lock_period_days} days</div>
                    </div>
                    <div>
                      <div className="text-tertiary-text text-xs">Total Staked</div>
                      <div className="font-bold text-pink-400">{parseFloat(String(pool.total_staked)).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-tertiary-text mb-1">
                      <span>Pool Utilization</span>
                      <span>{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-red-500" style={{ width: `${Math.min(utilization, 100)}%` }} />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-secondary space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">Stake Amount</label>
                        <input
                          type="number"
                          value={stakeAmount}
                          onChange={e => setStakeAmount(e.target.value)}
                          placeholder={`Min: ${parseFloat(String(pool.min_stake))}`}
                          min={parseFloat(String(pool.min_stake))}
                          className="w-full px-4 py-3 bg-secondary border border-secondary rounded-lg focus:border-pink-500 focus:ring-2 focus:ring-pink-500/50 transition-all"
                        />
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStake(); }}
                        disabled={actionLoading || !stakeAmount || parseFloat(stakeAmount) < parseFloat(String(pool.min_stake))}
                        className="w-full py-3 bg-gradient-to-r from-pink-600 to-pink-800 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        {actionLoading ? (
                          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Staking...</>
                        ) : (
                          <><Heart size={18} /> Stake for Charity</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
          <div className="text-sm space-y-2">
            <div className="font-semibold text-blue-400">How Charity Staking Works</div>
            <ul className="space-y-1 text-secondary-text list-disc list-inside">
              <li>Lock your TYT tokens in a staking pool for a fixed period</li>
              <li>Earn yield based on the pool's APY rate</li>
              <li>A portion of yield goes to the Children's Brain Cancer Foundation</li>
              <li>Longer lock periods offer higher yield multipliers</li>
              <li>Principal is returned after the lock period ends</li>
              <li>Early unstake may forfeit accumulated rewards</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
