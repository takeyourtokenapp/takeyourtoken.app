/**
 * Maintenance Engine Service
 *
 * Calculates and manages maintenance costs for NFT miners.
 * Handles invoices, payments, and discount calculations.
 */

import { supabase } from '../lib/supabase';

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface FeeConfig {
  id: string;
  region: string;
  kwh_usd: number;
  service_bps: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceInvoice {
  id: string;
  miner_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  elec_usd: number;
  service_usd: number;
  discount_pct: number;
  amount_usd?: number;
  base_cost_usd?: number;
  final_cost_usd?: number;
  asset: string | null;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MaintenancePayment {
  id: string;
  invoice_id: string;
  user_id: string;
  amount: number;
  amount_usd: number;
  asset: string;
  tyt_burned: number;
  discount_pct: number;
  transaction_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MaintenanceCalc {
  power_kw: number;
  daily_kwh: number;
  kwh_rate: number;
  elec_usd: number;
  service_usd: number;
  subtotal_usd: number;
  discount_bps: number;
  discount_pct: number;
  discount_amount_usd: number;
  total_usd: number;
  region: string;
  days: number;
}

export interface DiscountBreakdown {
  vip_discount_bps: number;
  prepay_discount_bps: number;
  vetyt_discount_bps: number;
  service_button_discount_bps: number;
  total_discount_bps: number;
  total_discount_pct: number;
}

export interface InvoiceWithMiner extends MaintenanceInvoice {
  miner: {
    token_id: string;
    name: string;
    hashrate: number;
    efficiency: number;
  };
}

export class MaintenanceService {
  /**
   * Get fee configuration by region
   */
  async getFeeConfig(region: string): Promise<FeeConfig | null> {
    const { data, error } = await supabase
      .from('maintenance_fee_config')
      .select('*')
      .eq('region', region)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Get all active fee configurations
   */
  async getAllFeeConfigs(): Promise<FeeConfig[]> {
    const { data, error } = await supabase
      .from('maintenance_fee_config')
      .select('*')
      .eq('is_active', true)
      .order('region');

    if (error) throw error;
    return data || [];
  }

  /**
   * Calculate maintenance cost with discounts
   */
  async calculateMaintenance(params: {
    powerTH: number;
    efficiencyWTH: number;
    region: string;
    days?: number;
    vipLevel?: number;
    prepayDays?: number;
    vetytPower?: number;
    totalVetyt?: number;
    serviceButton?: boolean;
  }): Promise<MaintenanceCalc> {
    const {
      powerTH,
      efficiencyWTH,
      region,
      days = 1,
      vipLevel = 0,
      prepayDays = 0,
      vetytPower = 0,
      totalVetyt = 1,
      serviceButton = false,
    } = params;

    const { data, error } = await supabase.rpc('calculate_maintenance', {
      p_power_th: powerTH,
      p_efficiency_w_th: efficiencyWTH,
      p_region: region,
      p_days: days,
      p_vip_level: vipLevel,
      p_prepay_days: prepayDays,
      p_vetyt_power: vetytPower,
      p_total_vetyt: totalVetyt,
      p_service_button: serviceButton,
    });

    if (error) throw error;
    return data as MaintenanceCalc;
  }

  /**
   * Calculate discount breakdown
   */
  calculateDiscountBreakdown(
    vipLevel: number,
    prepayDays: number,
    vetytPower: number,
    totalVetyt: number,
    serviceButton: boolean
  ): DiscountBreakdown {
    let vip_discount_bps = 0;
    if (vipLevel >= 9) vip_discount_bps = 1800;
    else if (vipLevel >= 7) vip_discount_bps = 1300;
    else if (vipLevel >= 5) vip_discount_bps = 900;
    else if (vipLevel >= 3) vip_discount_bps = 500;
    else if (vipLevel >= 1) vip_discount_bps = 200;

    const prepay_discount_bps = Math.min(Math.floor(prepayDays / 30) * 100, 1000);

    let vetyt_discount_bps = 0;
    if (totalVetyt > 0) {
      vetyt_discount_bps = Math.min(Math.floor((vetytPower / totalVetyt) * 500), 500);
    }

    const service_button_discount_bps = serviceButton ? 300 : 0;

    const total_discount_bps = Math.min(
      vip_discount_bps + prepay_discount_bps + vetyt_discount_bps + service_button_discount_bps,
      2000
    );

    return {
      vip_discount_bps,
      prepay_discount_bps,
      vetyt_discount_bps,
      service_button_discount_bps,
      total_discount_bps,
      total_discount_pct: total_discount_bps / 100,
    };
  }

  /**
   * Get user's invoices
   */
  async getUserInvoices(
    userId: string,
    options: {
      status?: InvoiceStatus;
      limit?: number;
      offset?: number;
      includeMiner?: boolean;
    } = {}
  ): Promise<MaintenanceInvoice[] | InvoiceWithMiner[]> {
    const { status, limit = 50, offset = 0, includeMiner = false } = options;

    let query = supabase
      .from('maintenance_invoices')
      .select(includeMiner ? '*, miner:nft_miners(token_id, name, hashrate, efficiency)' : '*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string, includeMiner = false): Promise<MaintenanceInvoice | InvoiceWithMiner | null> {
    const { data, error } = await supabase
      .from('maintenance_invoices')
      .select(includeMiner ? '*, miner:nft_miners(token_id, name, hashrate, efficiency)' : '*')
      .eq('id', invoiceId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Get pending invoices for user
   */
  async getPendingInvoices(userId: string): Promise<InvoiceWithMiner[]> {
    const { data, error } = await supabase
      .from('maintenance_invoices')
      .select('*, miner:nft_miners(token_id, name, hashrate, efficiency)')
      .eq('user_id', userId)
      .in('status', ['pending', 'overdue'])
      .order('due_date');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get total pending amount for user
   */
  async getTotalPendingAmount(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('maintenance_invoices')
      .select('final_cost_usd, base_cost_usd')
      .eq('user_id', userId)
      .in('status', ['pending', 'overdue']);

    if (error) throw error;

    return (data || []).reduce((sum, invoice) => {
      return sum + (invoice.final_cost_usd || invoice.base_cost_usd || 0);
    }, 0);
  }

  /**
   * Pay invoice
   */
  async payInvoice(
    invoiceId: string,
    asset: string,
    amount: number,
    amountUSD: number,
    transactionId?: string
  ): Promise<MaintenancePayment> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      throw new Error('Not authenticated');
    }

    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.user_id !== session.session.user.id) {
      throw new Error('Unauthorized');
    }

    const tytBurned = asset === 'TYT' ? amount * 0.2 : 0;

    const { data: payment, error: paymentError } = await supabase
      .from('maintenance_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_currency: asset,
        payment_amount: amount,
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (paymentError) throw paymentError;

    return payment;
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string, limit = 50): Promise<MaintenancePayment[]> {
    const { data, error } = await supabase
      .from('maintenance_invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get invoice payments
   */
  async getInvoicePayments(invoiceId: string): Promise<MaintenancePayment[]> {
    const { data, error } = await supabase
      .from('maintenance_invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('status', 'paid')
      .order('paid_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get maintenance stats for user
   */
  async getUserMaintenanceStats(userId: string): Promise<{
    pending_count: number;
    overdue_count: number;
    paid_count: number;
    pending_amount_usd: number;
    overdue_amount_usd: number;
    paid_amount_usd: number;
    next_due_date: string | null;
  }> {
    const { data, error } = await supabase
      .from('v_user_maintenance_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        pending_count: 0,
        overdue_count: 0,
        paid_count: 0,
        pending_amount_usd: 0,
        overdue_amount_usd: 0,
        paid_amount_usd: 0,
        next_due_date: null,
      };
    }

    return data;
  }

  /**
   * Subscribe to invoice updates (real-time)
   */
  subscribeToUserInvoices(userId: string, callback: (invoice: MaintenanceInvoice) => void) {
    const channel = supabase
      .channel(`invoices-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_invoices',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as MaintenanceInvoice);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Estimate monthly maintenance cost for a miner
   */
  async estimateMonthlyCost(params: {
    powerTH: number;
    efficiencyWTH: number;
    region: string;
    vipLevel?: number;
    prepayDays?: number;
    vetytPower?: number;
    totalVetyt?: number;
    serviceButton?: boolean;
  }): Promise<{
    daily: MaintenanceCalc;
    monthly: MaintenanceCalc;
    yearly: MaintenanceCalc;
  }> {
    const daily = await this.calculateMaintenance({ ...params, days: 1 });
    const monthly = await this.calculateMaintenance({ ...params, days: 30 });
    const yearly = await this.calculateMaintenance({ ...params, days: 365 });

    return { daily, monthly, yearly };
  }

  /**
   * Calculate profitability after maintenance
   */
  calculateProfitability(params: {
    dailyRewardBTC: number;
    dailyMaintenanceUSD: number;
    btcPriceUSD: number;
  }): {
    dailyRewardUSD: number;
    dailyMaintenanceUSD: number;
    dailyNetUSD: number;
    dailyNetBTC: number;
    monthlyNetUSD: number;
    yearlyNetUSD: number;
    isProfitable: boolean;
    breakEvenBTCPrice: number;
  } {
    const { dailyRewardBTC, dailyMaintenanceUSD, btcPriceUSD } = params;

    const dailyRewardUSD = dailyRewardBTC * btcPriceUSD;
    const dailyNetUSD = dailyRewardUSD - dailyMaintenanceUSD;
    const dailyNetBTC = dailyNetUSD / btcPriceUSD;
    const monthlyNetUSD = dailyNetUSD * 30;
    const yearlyNetUSD = dailyNetUSD * 365;
    const isProfitable = dailyNetUSD > 0;
    const breakEvenBTCPrice = dailyRewardBTC > 0 ? dailyMaintenanceUSD / dailyRewardBTC : Infinity;

    return {
      dailyRewardUSD,
      dailyMaintenanceUSD,
      dailyNetUSD,
      dailyNetBTC,
      monthlyNetUSD,
      yearlyNetUSD,
      isProfitable,
      breakEvenBTCPrice,
    };
  }
}

export const maintenanceService = new MaintenanceService();
