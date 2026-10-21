import { supabase } from '../lib/supabase';

export interface RewardCalculation {
  grossBTC: number;
  electricityCostUSD: number;
  serviceFeeUSD: number;
  totalCostUSD: number;
  costBTC: number;
  netBTC: number;
  discountPercent: number;
  discountAmount: number;
  reinvestBTC: number;
  creditedBTC: number;
}

export class RealRewardsEngine {
  private static BLOCK_REWARD = 3.125; // Post-halving April 2024
  private static NETWORK_HASH_EXPONENT = 32;

  static async calculateDailyReward(
    minerId: string,
    userId: string
  ): Promise<RewardCalculation> {
    const miner = await this.getMiner(minerId);
    const user = await this.getUser(userId);
    const btcPrice = await this.getBTCPrice();
    const networkDifficulty = await this.getNetworkDifficulty();
    const electricityRate = await this.getElectricityRate(miner.region);

    const grossBTC = this.calculateGrossBTC(
      miner.power_th,
      networkDifficulty
    );

    const dailyKWH = (miner.power_th * miner.efficiency_w_th * 24) / 1000;
    const electricityCostUSD = dailyKWH * electricityRate;

    const serviceFeeUSD = miner.power_th * miner.maintenance_rate;

    const discountPercent = await this.calculateDiscount(userId);
    const totalCostUSD = (electricityCostUSD + serviceFeeUSD) * (1 - discountPercent / 100);

    const costBTC = totalCostUSD / btcPrice;

    const netBTC = Math.max(0, grossBTC - costBTC);

    const reinvestPercent = user.reinvest_percent || 0;
    const reinvestBTC = netBTC * (reinvestPercent / 100);
    const creditedBTC = netBTC - reinvestBTC;

    return {
      grossBTC,
      electricityCostUSD,
      serviceFeeUSD,
      totalCostUSD,
      costBTC,
      netBTC,
      discountPercent,
      discountAmount: (electricityCostUSD + serviceFeeUSD) * (discountPercent / 100),
      reinvestBTC,
      creditedBTC,
    };
  }

  private static calculateGrossBTC(powerTH: number, difficulty: number): number {
    const secondsPerDay = 86400;
    const hashesPerSecond = powerTH * 1e12;
    const hashesPerDay = hashesPerSecond * secondsPerDay;

    const networkHashRate = difficulty * Math.pow(2, this.NETWORK_HASH_EXPONENT);
    const probability = hashesPerDay / networkHashRate;

    const blocksPerDay = 144;
    const grossBTC = probability * blocksPerDay * this.BLOCK_REWARD;

    return grossBTC;
  }

  private static async getMiner(minerId: string) {
    const { data, error } = await supabase
      .from('digital_miners')
      .select('*')
      .eq('id', minerId)
      .single();

    if (error || !data) throw new Error('Miner not found');
    return data;
  }

  private static async getUser(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) throw new Error('User not found');
    return data;
  }

  private static async getBTCPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
      const data = await response.json();
      return parseFloat(data.data.amount);
    } catch (error) {
      console.error('Failed to fetch BTC price:', error);
      return 45000;
    }
  }

  private static async getNetworkDifficulty(): Promise<number> {
    try {
      const response = await fetch('https://blockchain.info/q/getdifficulty');
      const difficulty = await response.text();
      return parseFloat(difficulty);
    } catch (error) {
      console.error('Failed to fetch network difficulty:', error);
      return 72e12;
    }
  }

  private static async getElectricityRate(region: string): Promise<number> {
    const rates: Record<string, number> = {
      USA: 0.08,
      Canada: 0.06,
      Europe: 0.12,
      Asia: 0.05,
      'Middle East': 0.04,
    };

    return rates[region] || 0.08;
  }

  static async calculateDiscount(userId: string): Promise<number> {
    const { data: user } = await supabase
      .from('profiles')
      .select('vip_tier, maintenance_balance')
      .eq('id', userId)
      .single();

    if (!user) return 0;

    const tierDiscounts: Record<string, number> = {
      bronze: 2,
      silver: 5,
      gold: 9,
      platinum: 13,
      diamond: 18,
    };

    let discount = tierDiscounts[user.vip_tier?.toLowerCase() || ''] || 0;

    const { data: serviceButton } = await supabase
      .from('game_service_button_clicks')
      .select('clicked_at')
      .eq('user_id', userId)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single();

    if (serviceButton) {
      const lastClick = new Date(serviceButton.clicked_at);
      const hoursSinceClick = (Date.now() - lastClick.getTime()) / (1000 * 60 * 60);

      if (hoursSinceClick < 24) {
        discount += 3;
      }
    }

    return Math.min(discount, 20);
  }

  static async processAllDailyRewards(): Promise<void> {
    const { data: activeMiners, error } = await supabase
      .from('digital_miners')
      .select('id, user_id, status')
      .eq('status', 'active');

    if (error || !activeMiners) {
      console.error('Failed to fetch active miners:', error);
      return;
    }

    for (const miner of activeMiners) {
      try {
        await this.processMinerReward(miner.id, miner.user_id);
      } catch (error) {
        console.error(`Failed to process reward for miner ${miner.id}:`, error);
      }
    }
  }

  static async processMinerReward(minerId: string, userId: string): Promise<void> {
    const calculation = await this.calculateDailyReward(minerId, userId);

    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .eq('asset', 'BTC')
      .single();

    if (!wallet) {
      console.error(`No BTC wallet found for user ${userId}`);
      return;
    }

    const newBalance = (parseFloat(wallet.balance) + calculation.creditedBTC).toFixed(8);

    await supabase
      .from('custodial_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    await supabase.from('reward_distributions').insert({
      user_id: userId,
      miner_id: minerId,
      gross_btc: calculation.grossBTC.toFixed(8),
      electricity_cost_usd: calculation.electricityCostUSD.toFixed(2),
      service_fee_usd: calculation.serviceFeeUSD.toFixed(2),
      discount_percent: calculation.discountPercent,
      total_cost_usd: calculation.totalCostUSD.toFixed(2),
      cost_btc: calculation.costBTC.toFixed(8),
      net_btc: calculation.netBTC.toFixed(8),
      reinvest_btc: calculation.reinvestBTC.toFixed(8),
      credited_btc: calculation.creditedBTC.toFixed(8),
      distribution_date: new Date().toISOString().split('T')[0],
    });

    if (calculation.reinvestBTC > 0) {
      await this.processReinvestment(userId, calculation.reinvestBTC);
    }

    await this.deductMaintenanceFee(userId, minerId, calculation.totalCostUSD);
  }

  private static async processReinvestment(userId: string, btcAmount: number): Promise<void> {
    const { data: user } = await supabase
      .from('profiles')
      .select('total_reinvested_btc')
      .eq('id', userId)
      .single();

    if (!user) return;

    const newTotal = (parseFloat(user.total_reinvested_btc || '0') + btcAmount).toFixed(8);

    await supabase
      .from('profiles')
      .update({ total_reinvested_btc: newTotal })
      .eq('id', userId);
  }

  private static async deductMaintenanceFee(
    userId: string,
    minerId: string,
    feeUSD: number
  ): Promise<void> {
    const { data: user } = await supabase
      .from('profiles')
      .select('maintenance_payment_method, maintenance_balance')
      .eq('id', userId)
      .single();

    if (!user) return;

    if (user.maintenance_payment_method === 'TYT') {
      const tytPrice = await this.getTYTPrice();
      const tytAmount = feeUSD / tytPrice;

      const { data: tytWallet } = await supabase
        .from('custodial_wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('asset', 'TYT')
        .single();

      if (tytWallet && parseFloat(tytWallet.balance) >= tytAmount) {
        await this.burnTYT(userId, tytAmount);

        await supabase.from('maintenance_invoices').insert({
          user_id: userId,
          miner_id: minerId,
          amount_usd: feeUSD,
          paid_with: 'TYT',
          tyt_amount: tytAmount,
          status: 'paid',
        });
      }
    }
  }

  private static async getTYTPrice(): Promise<number> {
    return 0.05;
  }

  private static async burnTYT(userId: string, amount: number): Promise<void> {
    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .eq('asset', 'TYT')
      .single();

    if (!wallet) return;

    const newBalance = (parseFloat(wallet.balance) - amount).toFixed(6);

    await supabase
      .from('custodial_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    await supabase.from('token_burns').insert({
      burn_type: 'maintenance_payment',
      tyt_amount: amount,
      user_id: userId,
    });
  }

  static async calculateMinerROI(minerId: string, userId: string): Promise<{
    dailyRevenue: number;
    dailyCost: number;
    dailyProfit: number;
    monthlyProfit: number;
    yearlyProfit: number;
    breakEvenDays: number;
    roi: number;
  }> {
    const calculation = await this.calculateDailyReward(minerId, userId);
    const btcPrice = await this.getBTCPrice();

    const dailyRevenue = calculation.grossBTC * btcPrice;
    const dailyCost = calculation.totalCostUSD;
    const dailyProfit = calculation.netBTC * btcPrice;

    const { data: miner } = await supabase
      .from('digital_miners')
      .select('purchase_price')
      .eq('id', minerId)
      .single();

    const purchasePrice = parseFloat(miner?.purchase_price || '0');
    const breakEvenDays = purchasePrice > 0 ? purchasePrice / dailyProfit : 0;
    const roi = purchasePrice > 0 ? (dailyProfit * 365 / purchasePrice) * 100 : 0;

    return {
      dailyRevenue,
      dailyCost,
      dailyProfit,
      monthlyProfit: dailyProfit * 30,
      yearlyProfit: dailyProfit * 365,
      breakEvenDays,
      roi,
    };
  }
}

export default RealRewardsEngine;
