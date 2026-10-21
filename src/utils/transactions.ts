import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'reward' | 'maintenance' | 'purchase' | 'sale' | 'upgrade' | 'donation';
  asset: string;
  amount: string;
  amountUsd?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export async function createTransaction(
  userId: string,
  type: Transaction['type'],
  asset: string,
  amount: string,
  description?: string,
  metadata?: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      transaction_type: type,
      asset,
      amount,
      status: 'pending',
      description,
      metadata
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

export async function updateTransactionStatus(
  transactionId: string,
  status: Transaction['status'],
  txHash?: string
): Promise<void> {
  const updates: any = { status };

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  if (txHash) {
    updates.tx_hash = txHash;
  }

  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', transactionId);

  if (error) {
    throw error;
  }
}

export async function getUserTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getUserTransactionsByType(
  userId: string,
  type: Transaction['type'],
  limit: number = 50
): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('transaction_type', type)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getTransactionStats(userId: string): Promise<{
  totalDeposits: number;
  totalWithdrawals: number;
  totalRewards: number;
  totalSpent: number;
}> {
  const { data: deposits } = await supabase
    .from('transactions')
    .select('amount, asset')
    .eq('user_id', userId)
    .eq('transaction_type', 'deposit')
    .eq('status', 'completed');

  const { data: withdrawals } = await supabase
    .from('transactions')
    .select('amount, asset')
    .eq('user_id', userId)
    .eq('transaction_type', 'withdrawal')
    .eq('status', 'completed');

  const { data: rewards } = await supabase
    .from('daily_rewards')
    .select('net_btc')
    .eq('miner_id', userId);

  const { data: purchases } = await supabase
    .from('transactions')
    .select('amount, asset')
    .eq('user_id', userId)
    .in('transaction_type', ['purchase', 'maintenance', 'upgrade'])
    .eq('status', 'completed');

  const calculateTotal = (items: any[], assetPrices: Record<string, number>) => {
    return items?.reduce((sum, item) => {
      const amount = parseFloat(item.amount || item.net_btc || '0');
      const price = assetPrices[item.asset] || assetPrices['BTC'] || 1;
      return sum + (amount * price);
    }, 0) || 0;
  };

  const prices = {
    BTC: 95000,
    ETH: 3500,
    SOL: 140,
    TRX: 0.15,
    XRP: 2.5,
    TYT: 0.05,
    USDT: 1
  };

  return {
    totalDeposits: calculateTotal(deposits || [], prices),
    totalWithdrawals: calculateTotal(withdrawals || [], prices),
    totalRewards: calculateTotal(rewards || [], prices),
    totalSpent: calculateTotal(purchases || [], prices)
  };
}
