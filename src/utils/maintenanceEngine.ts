import { supabase } from '../lib/supabase';

export interface MaintenanceInvoice {
  id: string;
  user_id: string;
  miner_id: string;
  invoice_date: string;
  period_start: string;
  period_end: string;
  electricity_kwh: number;
  electricity_cost_usd: number;
  service_fee_usd: number;
  total_before_discount: number;
  discount_percentage: number;
  discount_amount_usd: number;
  total_due_usd: number;
  payment_method: 'tyt' | 'usdt' | 'btc' | null;
  payment_amount: number | null;
  payment_currency: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  due_date: string;
  paid_at: string | null;
  tyt_burned: number;
}

export interface MaintenanceConfig {
  baseServiceFeeBps: number;
  tytPaymentDiscountBps: number;
  gracePeriodDays: number;
  delinquencyPenaltyBps: number;
}

export interface DiscountTier {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  minSpent: number;
  maxSpent: number | null;
  maintenanceDiscountBps: number;
  serviceButtonReward: number;
  referralBonusBps: number;
}

const DISCOUNT_TIERS: DiscountTier[] = [
  { tier: 'bronze', minSpent: 0, maxSpent: 999, maintenanceDiscountBps: 200, serviceButtonReward: 10, referralBonusBps: 0 },
  { tier: 'silver', minSpent: 1000, maxSpent: 4999, maintenanceDiscountBps: 500, serviceButtonReward: 15, referralBonusBps: 100 },
  { tier: 'gold', minSpent: 5000, maxSpent: 14999, maintenanceDiscountBps: 900, serviceButtonReward: 25, referralBonusBps: 200 },
  { tier: 'platinum', minSpent: 15000, maxSpent: 49999, maintenanceDiscountBps: 1300, serviceButtonReward: 40, referralBonusBps: 300 },
  { tier: 'diamond', minSpent: 50000, maxSpent: null, maintenanceDiscountBps: 1800, serviceButtonReward: 100, referralBonusBps: 500 }
];

const TYT_PAYMENT_DISCOUNT_BPS = 2000;
const BASE_SERVICE_FEE_BPS = 1500;
const GRACE_PERIOD_DAYS = 3;

export function getDiscountTier(totalSpentUsd: number): DiscountTier {
  for (let i = DISCOUNT_TIERS.length - 1; i >= 0; i--) {
    if (totalSpentUsd >= DISCOUNT_TIERS[i].minSpent) {
      return DISCOUNT_TIERS[i];
    }
  }
  return DISCOUNT_TIERS[0];
}

export function calculateMaintenanceCost(
  powerTh: number,
  efficiencyWTh: number,
  electricityRateKwh: number,
  days: number = 1
): {
  electricityKwh: number;
  electricityCostUsd: number;
  serviceFeeCostUsd: number;
  totalBeforeDiscount: number;
} {
  const powerWatts = powerTh * efficiencyWTh;
  const hoursPerPeriod = days * 24;
  const electricityKwh = (powerWatts * hoursPerPeriod) / 1000;
  const electricityCostUsd = electricityKwh * electricityRateKwh;

  const grossDailyValue = powerTh * 0.00001 * 100000;
  const serviceFeeCostUsd = (grossDailyValue * BASE_SERVICE_FEE_BPS / 10000) * days;

  return {
    electricityKwh,
    electricityCostUsd,
    serviceFeeCostUsd,
    totalBeforeDiscount: electricityCostUsd + serviceFeeCostUsd
  };
}

export function calculateDiscount(
  baseAmount: number,
  vipTier: DiscountTier,
  payWithTyt: boolean
): {
  vipDiscountBps: number;
  tytDiscountBps: number;
  totalDiscountBps: number;
  discountAmount: number;
  finalAmount: number;
} {
  const vipDiscountBps = vipTier.maintenanceDiscountBps;
  const tytDiscountBps = payWithTyt ? TYT_PAYMENT_DISCOUNT_BPS : 0;
  const totalDiscountBps = Math.min(vipDiscountBps + tytDiscountBps, 3800);

  const discountAmount = (baseAmount * totalDiscountBps) / 10000;
  const finalAmount = baseAmount - discountAmount;

  return {
    vipDiscountBps,
    tytDiscountBps,
    totalDiscountBps,
    discountAmount,
    finalAmount
  };
}

export async function getUserMaintenanceInvoices(
  userId: string,
  options: { status?: string; limit?: number; offset?: number } = {}
): Promise<MaintenanceInvoice[]> {
  const { status, limit = 50, offset = 0 } = options;

  let query = supabase
    .from('maintenance_invoices')
    .select('*')
    .eq('user_id', userId)
    .order('invoice_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getPendingMaintenanceTotal(userId: string): Promise<{
  totalDueUsd: number;
  invoiceCount: number;
  oldestDueDate: string | null;
  isOverdue: boolean;
}> {
  const { data, error } = await supabase
    .from('maintenance_invoices')
    .select('total_due_usd, due_date')
    .eq('user_id', userId)
    .in('status', ['pending', 'overdue']);

  if (error) throw error;

  const invoices = data || [];
  const totalDueUsd = invoices.reduce((sum, inv) => sum + inv.total_due_usd, 0);

  const now = new Date();
  const overdueInvoices = invoices.filter(inv => new Date(inv.due_date) < now);

  const sortedDueDates = invoices
    .map(inv => inv.due_date)
    .sort();

  return {
    totalDueUsd,
    invoiceCount: invoices.length,
    oldestDueDate: sortedDueDates[0] || null,
    isOverdue: overdueInvoices.length > 0
  };
}

export async function payMaintenanceInvoice(
  invoiceId: string,
  paymentMethod: 'tyt' | 'usdt' | 'btc',
  tytPrice: number = 0.001
): Promise<{
  success: boolean;
  amountPaid: number;
  currency: string;
  tytBurned: number;
  newBalance: number;
}> {
  const { data: invoice, error: fetchError } = await supabase
    .from('maintenance_invoices')
    .select('*')
    .eq('id', invoiceId)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!invoice) throw new Error('Invoice not found or already paid');

  let amountPaid: number;
  let currency: string;
  let tytBurned = 0;

  if (paymentMethod === 'tyt') {
    const tytAmount = invoice.total_due_usd / tytPrice;
    amountPaid = tytAmount;
    currency = 'TYT';
    tytBurned = tytAmount;
  } else if (paymentMethod === 'btc') {
    amountPaid = invoice.total_due_usd / 100000;
    currency = 'BTC';
  } else {
    amountPaid = invoice.total_due_usd;
    currency = 'USDT';
  }

  const { error: updateError } = await supabase
    .from('maintenance_invoices')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      payment_amount: amountPaid,
      payment_currency: currency,
      paid_at: new Date().toISOString(),
      tyt_burned: tytBurned
    })
    .eq('id', invoiceId);

  if (updateError) throw updateError;

  if (tytBurned > 0) {
    await supabase.rpc('record_tyt_burn', {
      p_amount: tytBurned,
      p_burn_type: 'maintenance',
      p_ref_id: invoiceId
    });
  }

  return {
    success: true,
    amountPaid,
    currency,
    tytBurned,
    newBalance: 0
  };
}

export async function generateDailyMaintenanceInvoices(): Promise<{
  invoicesCreated: number;
  totalAmountUsd: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const { data: activeMiners, error: minersError } = await supabase
    .from('nft_miners')
    .select(`
      id,
      owner_id,
      power_th,
      efficiency_w_th,
      data_centers(electricity_rate_kwh)
    `)
    .eq('status', 'active');

  if (minersError) throw minersError;

  let invoicesCreated = 0;
  let totalAmountUsd = 0;

  for (const miner of activeMiners || []) {
    const dataCenter = miner.data_centers as { electricity_rate_kwh: number } | null;
    const electricityRate = dataCenter?.electricity_rate_kwh || 0.05;

    const costs = calculateMaintenanceCost(
      miner.power_th,
      miner.efficiency_w_th,
      electricityRate,
      1
    );

    const { data: userVip } = await supabase
      .from('vip_levels')
      .select('total_spent')
      .eq('user_id', miner.owner_id)
      .maybeSingle();

    const tier = getDiscountTier(userVip?.total_spent || 0);
    const discount = calculateDiscount(costs.totalBeforeDiscount, tier, false);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + GRACE_PERIOD_DAYS);

    const { error: insertError } = await supabase
      .from('maintenance_invoices')
      .insert({
        user_id: miner.owner_id,
        miner_id: miner.id,
        invoice_date: today,
        period_start: today,
        period_end: today,
        electricity_kwh: costs.electricityKwh,
        electricity_cost_usd: costs.electricityCostUsd,
        service_fee_usd: costs.serviceFeeCostUsd,
        total_before_discount: costs.totalBeforeDiscount,
        discount_percentage: discount.totalDiscountBps / 100,
        discount_amount_usd: discount.discountAmount,
        total_due_usd: discount.finalAmount,
        status: 'pending',
        due_date: dueDate.toISOString()
      });

    if (!insertError) {
      invoicesCreated++;
      totalAmountUsd += discount.finalAmount;
    }
  }

  return { invoicesCreated, totalAmountUsd };
}

export async function checkDelinquentMiners(): Promise<{
  minersMarkedDelinquent: number;
  totalOverdueUsd: number;
}> {
  const now = new Date().toISOString();

  const { data: overdueInvoices, error } = await supabase
    .from('maintenance_invoices')
    .select('user_id, miner_id, total_due_usd')
    .eq('status', 'pending')
    .lt('due_date', now);

  if (error) throw error;

  const delinquentMinerIds = [...new Set((overdueInvoices || []).map(inv => inv.miner_id))];
  let totalOverdueUsd = (overdueInvoices || []).reduce((sum, inv) => sum + inv.total_due_usd, 0);

  if (delinquentMinerIds.length > 0) {
    await supabase
      .from('nft_miners')
      .update({ status: 'delinquent' })
      .in('id', delinquentMinerIds);

    await supabase
      .from('maintenance_invoices')
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', now);
  }

  return {
    minersMarkedDelinquent: delinquentMinerIds.length,
    totalOverdueUsd
  };
}

export function formatMaintenanceCost(amountUsd: number): string {
  return `$${amountUsd.toFixed(2)}`;
}

export function formatDiscountPercentage(bps: number): string {
  return `${(bps / 100).toFixed(1)}%`;
}
