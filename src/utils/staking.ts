import { supabase } from '../lib/supabase';
import { BlockchainNetwork } from '../contexts/MultiChainWeb3Context';

export interface StakingPool {
  id: string;
  name: string;
  blockchain: BlockchainNetwork;
  token_symbol: string;
  apy: number;
  min_stake: number;
  lock_period_days: number;
  total_staked: number;
  max_capacity: number;
  is_active: boolean;
}

export interface UserStake {
  id: string;
  pool_id: string;
  amount: number;
  start_date: string;
  unlock_date: string;
  rewards_earned: number;
  status: 'active' | 'completed' | 'withdrawn';
  tx_hash: string;
}

export async function getStakingPools(blockchain?: BlockchainNetwork): Promise<StakingPool[]> {
  let query = supabase
    .from('staking_pools')
    .select('*')
    .eq('is_active', true)
    .order('apy', { ascending: false });

  if (blockchain) {
    query = query.eq('blockchain', blockchain);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staking pools:', error);
    return [];
  }

  return data || [];
}

export async function getUserStakes(userId: string): Promise<UserStake[]> {
  const { data, error } = await supabase
    .from('user_stakes')
    .select(`
      *,
      staking_pools (
        name,
        token_symbol,
        apy,
        blockchain
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user stakes:', error);
    return [];
  }

  return data || [];
}

export async function stakeTokens(
  userId: string,
  poolId: string,
  amount: number,
  walletAddress: string,
  provider: any
): Promise<{ success: boolean; stakeId?: string; error?: string }> {
  try {
    const { data: pool, error: poolError } = await supabase
      .from('staking_pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (poolError || !pool) {
      throw new Error('Staking pool not found');
    }

    if (amount < pool.min_stake) {
      throw new Error(`Minimum stake amount is ${pool.min_stake} ${pool.token_symbol}`);
    }

    if (pool.total_staked + amount > pool.max_capacity) {
      throw new Error('Pool capacity exceeded');
    }

    const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + pool.lock_period_days);

    const { data: stake, error: stakeError } = await supabase
      .from('user_stakes')
      .insert({
        user_id: userId,
        pool_id: poolId,
        amount: amount,
        wallet_address: walletAddress,
        unlock_date: unlockDate.toISOString(),
        tx_hash: mockTxHash,
        status: 'active'
      })
      .select()
      .single();

    if (stakeError) throw stakeError;

    await supabase
      .from('staking_pools')
      .update({ total_staked: pool.total_staked + amount })
      .eq('id', poolId);

    return {
      success: true,
      stakeId: stake.id
    };
  } catch (error: any) {
    console.error('Error staking tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function unstakeTokens(
  userId: string,
  stakeId: string,
  provider: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: stake, error: fetchError } = await supabase
      .from('user_stakes')
      .select('*, staking_pools(*)')
      .eq('id', stakeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !stake) {
      throw new Error('Stake not found');
    }

    if (stake.status !== 'active') {
      throw new Error('Stake is not active');
    }

    const now = new Date();
    const unlockDate = new Date(stake.unlock_date);

    if (now < unlockDate) {
      throw new Error(`Tokens are locked until ${unlockDate.toLocaleDateString()}`);
    }

    const rewards = calculateRewards(stake.amount, stake.staking_pools.apy, stake.start_date);

    const { error: updateError } = await supabase
      .from('user_stakes')
      .update({
        status: 'withdrawn',
        rewards_earned: rewards,
        withdrawn_at: new Date().toISOString()
      })
      .eq('id', stakeId);

    if (updateError) throw updateError;

    await supabase
      .from('staking_pools')
      .update({ total_staked: stake.staking_pools.total_staked - stake.amount })
      .eq('id', stake.pool_id);

    return { success: true };
  } catch (error: any) {
    console.error('Error unstaking tokens:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function calculateRewards(
  stakeAmount: number,
  apy: number,
  startDate: string
): number {
  const start = new Date(startDate);
  const now = new Date();
  const daysStaked = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  const dailyRate = apy / 365 / 100;
  const rewards = stakeAmount * dailyRate * daysStaked;

  return Math.floor(rewards * 100) / 100;
}

export async function claimRewards(
  userId: string,
  stakeId: string
): Promise<{ success: boolean; rewards?: number; error?: string }> {
  try {
    const { data: stake, error: fetchError } = await supabase
      .from('user_stakes')
      .select('*, staking_pools(*)')
      .eq('id', stakeId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !stake) {
      throw new Error('Stake not found');
    }

    if (stake.status !== 'active') {
      throw new Error('Stake is not active');
    }

    const rewards = calculateRewards(stake.amount, stake.staking_pools.apy, stake.start_date);

    const { error: rewardError } = await supabase
      .from('staking_rewards')
      .insert({
        user_id: userId,
        stake_id: stakeId,
        amount: rewards,
        claimed_at: new Date().toISOString()
      });

    if (rewardError) throw rewardError;

    await supabase
      .from('user_stakes')
      .update({
        rewards_earned: (stake.rewards_earned || 0) + rewards,
        start_date: new Date().toISOString()
      })
      .eq('id', stakeId);

    return {
      success: true,
      rewards: rewards
    };
  } catch (error: any) {
    console.error('Error claiming rewards:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getTotalStakingStats(userId: string) {
  const { data: stakes } = await supabase
    .from('user_stakes')
    .select('*, staking_pools(*)')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!stakes || stakes.length === 0) {
    return {
      totalStaked: 0,
      estimatedRewards: 0,
      activeStakes: 0
    };
  }

  const totalStaked = stakes.reduce((sum, stake) => sum + stake.amount, 0);
  const estimatedRewards = stakes.reduce((sum, stake) => {
    const rewards = calculateRewards(stake.amount, stake.staking_pools.apy, stake.start_date);
    return sum + rewards;
  }, 0);

  return {
    totalStaked,
    estimatedRewards,
    activeStakes: stakes.length
  };
}
