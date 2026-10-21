import { supabase } from '../lib/supabase';

export interface UpgradeOption {
  type: 'hashrate' | 'efficiency';
  currentValue: number;
  upgradeAmount: number;
  costTYT: number;
  costUSDT: number;
  newValue: number;
}

export interface UpgradeResult {
  success: boolean;
  error?: string;
  newValue?: number;
}

export function calculateHashrateUpgradeCost(currentHashrate: number, increaseAmount: number): number {
  const baseCostPerTH = 50;
  const scalingFactor = 1 + (currentHashrate / 1000);
  return increaseAmount * baseCostPerTH * scalingFactor;
}

export function calculateEfficiencyUpgradeCost(currentEfficiency: number, decreaseAmount: number): number {
  const baseCostPerWatt = 100;
  const efficiencyFactor = 50 / currentEfficiency;
  return decreaseAmount * baseCostPerWatt * efficiencyFactor;
}

export function getHashrateUpgradeOptions(currentHashrate: number): UpgradeOption[] {
  const options = [
    { increase: 10, label: '+10 TH/s' },
    { increase: 25, label: '+25 TH/s' },
    { increase: 50, label: '+50 TH/s' },
    { increase: 100, label: '+100 TH/s' }
  ];

  return options.map(opt => {
    const costTYT = calculateHashrateUpgradeCost(currentHashrate, opt.increase);
    return {
      type: 'hashrate' as const,
      currentValue: currentHashrate,
      upgradeAmount: opt.increase,
      costTYT,
      costUSDT: costTYT * 0.05,
      newValue: currentHashrate + opt.increase
    };
  });
}

export function getEfficiencyUpgradeOptions(currentEfficiency: number): UpgradeOption[] {
  if (currentEfficiency <= 15) {
    return [];
  }

  const maxDecrease = currentEfficiency - 15;
  const options = [
    { decrease: 1, label: '-1 W/TH' },
    { decrease: 2, label: '-2 W/TH' },
    { decrease: 3, label: '-3 W/TH' },
    { decrease: 5, label: '-5 W/TH' }
  ].filter(opt => opt.decrease <= maxDecrease);

  return options.map(opt => {
    const costTYT = calculateEfficiencyUpgradeCost(currentEfficiency, opt.decrease);
    return {
      type: 'efficiency' as const,
      currentValue: currentEfficiency,
      upgradeAmount: opt.decrease,
      costTYT,
      costUSDT: costTYT * 0.05,
      newValue: currentEfficiency - opt.decrease
    };
  });
}

export async function upgradeMinerHashrate(
  minerId: string,
  userId: string,
  increaseAmount: number,
  paymentAsset: 'TYT' | 'USDT'
): Promise<UpgradeResult> {
  try {
    const { data: miner, error: minerError } = await supabase
      .from('nft_miners')
      .select('*')
      .eq('id', minerId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (minerError || !miner) {
      return { success: false, error: 'Miner not found' };
    }

    const cost = calculateHashrateUpgradeCost(miner.hashrate_th, increaseAmount);
    const paymentAmount = paymentAsset === 'TYT' ? cost : cost * 0.05;

    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('asset', paymentAsset)
      .maybeSingle();

    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const balance = parseFloat(wallet.balance);
    if (balance < paymentAmount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const newHashrate = miner.hashrate_th + increaseAmount;

    await supabase
      .from('nft_miners')
      .update({
        hashrate_th: newHashrate,
        upgraded_at: new Date().toISOString()
      })
      .eq('id', minerId);

    await supabase
      .from('custodial_wallets')
      .update({
        balance: (balance - paymentAmount).toString()
      })
      .eq('user_id', userId)
      .eq('asset', paymentAsset);

    if (paymentAsset === 'TYT') {
      await supabase
        .from('token_burns')
        .insert({
          amount_tyt: paymentAmount.toString(),
          burn_source: 'upgrade',
          user_id: userId,
          status: 'pending'
        });
    }

    await supabase
      .from('miner_upgrade_history')
      .insert({
        miner_id: minerId,
        user_id: userId,
        upgrade_type: 'hashrate',
        old_value: miner.hashrate_th.toString(),
        new_value: newHashrate.toString(),
        cost_amount: paymentAmount.toString(),
        cost_asset: paymentAsset
      });

    return { success: true, newValue: newHashrate };

  } catch (error) {
    console.error('Upgrade error:', error);
    return { success: false, error: 'Upgrade failed' };
  }
}

export async function upgradeMinerEfficiency(
  minerId: string,
  userId: string,
  decreaseAmount: number,
  paymentAsset: 'TYT' | 'USDT'
): Promise<UpgradeResult> {
  try {
    const { data: miner, error: minerError } = await supabase
      .from('nft_miners')
      .select('*')
      .eq('id', minerId)
      .eq('owner_id', userId)
      .maybeSingle();

    if (minerError || !miner) {
      return { success: false, error: 'Miner not found' };
    }

    if (miner.efficiency_w_per_th - decreaseAmount < 15) {
      return { success: false, error: 'Cannot upgrade below 15 W/TH' };
    }

    const cost = calculateEfficiencyUpgradeCost(miner.efficiency_w_per_th, decreaseAmount);
    const paymentAmount = paymentAsset === 'TYT' ? cost : cost * 0.05;

    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('asset', paymentAsset)
      .maybeSingle();

    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const balance = parseFloat(wallet.balance);
    if (balance < paymentAmount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const newEfficiency = miner.efficiency_w_per_th - decreaseAmount;

    await supabase
      .from('nft_miners')
      .update({
        efficiency_w_per_th: newEfficiency,
        upgraded_at: new Date().toISOString()
      })
      .eq('id', minerId);

    await supabase
      .from('custodial_wallets')
      .update({
        balance: (balance - paymentAmount).toString()
      })
      .eq('user_id', userId)
      .eq('asset', paymentAsset);

    if (paymentAsset === 'TYT') {
      await supabase
        .from('token_burns')
        .insert({
          amount_tyt: paymentAmount.toString(),
          burn_source: 'upgrade',
          user_id: userId,
          status: 'pending'
        });
    }

    await supabase
      .from('miner_upgrade_history')
      .insert({
        miner_id: minerId,
        user_id: userId,
        upgrade_type: 'efficiency',
        old_value: miner.efficiency_w_per_th.toString(),
        new_value: newEfficiency.toString(),
        cost_amount: paymentAmount.toString(),
        cost_asset: paymentAsset
      });

    return { success: true, newValue: newEfficiency };

  } catch (error) {
    console.error('Upgrade error:', error);
    return { success: false, error: 'Upgrade failed' };
  }
}

export async function getMinerUpgradeHistory(minerId: string): Promise<any[]> {
  const { data } = await supabase
    .from('miner_upgrade_history')
    .select('*')
    .eq('miner_id', minerId)
    .order('created_at', { ascending: false });

  return data || [];
}
