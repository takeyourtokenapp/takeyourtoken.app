import { supabase } from '../lib/supabase';

export type CustodialBlockchain = 'solana' | 'ethereum' | 'bsc' | 'polygon' | 'tron' | 'internal';

export interface CustodialAddress {
  id: string;
  user_id: string;
  blockchain: CustodialBlockchain;
  address: string;
  is_active: boolean;
  created_at: string;
}

export interface WithdrawalRequest {
  wallet_id: string;
  blockchain: CustodialBlockchain;
  asset: string;
  amount: number;
  destination_address: string;
}

export interface WithdrawalResult {
  success: boolean;
  withdrawal_id?: string;
  tx_hash?: string;
  amount_after_fee?: number;
  fees?: {
    total: number;
    protocol: number;
    foundation: number;
    academy: number;
  };
  error?: string;
}

const BLOCKCHAIN_EXPLORERS = {
  solana: 'https://explorer.solana.com/tx/',
  ethereum: 'https://etherscan.io/tx/',
  bsc: 'https://bscscan.com/tx/',
  polygon: 'https://polygonscan.com/tx/',
  tron: 'https://tronscan.org/#/transaction/'
};

export async function getCustodialAddress(
  userId: string,
  blockchain: CustodialBlockchain
): Promise<CustodialAddress | null> {
  if (blockchain === 'internal') return null;

  const { data, error } = await supabase
    .from('custodial_addresses')
    .select('*')
    .eq('user_id', userId)
    .eq('blockchain', blockchain)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching custodial address:', error);
    return null;
  }

  return data;
}

export async function generateCustodialAddress(
  userId: string,
  blockchain: CustodialBlockchain
): Promise<{ success: boolean; address?: string; error?: string }> {
  if (blockchain === 'internal') {
    return { success: false, error: 'Cannot generate address for internal blockchain' };
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-custodial-address`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ blockchain })
      }
    );

    const result = await response.json();

    if (result.success && result.address) {
      const { error } = await supabase
        .from('custodial_addresses')
        .insert({
          user_id: userId,
          blockchain,
          address: result.address,
          derivation_path: result.derivation_path,
          is_active: true
        });

      if (error) throw error;

      return { success: true, address: result.address };
    }

    return { success: false, error: result.error || 'Failed to generate address' };
  } catch (error: any) {
    console.error('Error generating custodial address:', error);
    return { success: false, error: error.message };
  }
}

export async function getOnChainBalance(
  blockchain: CustodialBlockchain,
  address: string,
  asset: string = 'native'
): Promise<number> {
  if (blockchain === 'internal') return 0;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-balance`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ blockchain, address, asset })
      }
    );

    const result = await response.json();
    return result.balance || 0;
  } catch (error) {
    console.error('Error checking on-chain balance:', error);
    return 0;
  }
}

export async function syncCustodialBalance(
  userId: string,
  walletId: string,
  blockchain: CustodialBlockchain
): Promise<boolean> {
  if (blockchain === 'internal') return true;

  try {
    const address = await getCustodialAddress(userId, blockchain);
    if (!address) return false;

    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('asset')
      .eq('id', walletId)
      .single();

    if (!wallet) return false;

    const onChainBalance = await getOnChainBalance(blockchain, address.address, wallet.asset);

    await supabase
      .from('custodial_balance_snapshots')
      .upsert({
        user_id: userId,
        wallet_id: walletId,
        balance: onChainBalance,
        blockchain,
        on_chain_balance: onChainBalance,
        last_sync_at: new Date().toISOString(),
        snapshot_date: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'wallet_id,snapshot_date'
      });

    return true;
  } catch (error) {
    console.error('Error syncing balance:', error);
    return false;
  }
}

export async function requestWithdrawal(
  userId: string,
  request: WithdrawalRequest
): Promise<WithdrawalResult> {
  try {
    const { data: wallet } = await supabase
      .from('custodial_wallets')
      .select('balance')
      .eq('id', request.wallet_id)
      .eq('user_id', userId)
      .single();

    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (parseFloat(wallet.balance) < request.amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const { data: fees } = await supabase
      .rpc('calculate_withdrawal_fees', { p_amount: request.amount })
      .single();

    if (!fees) {
      return { success: false, error: 'Failed to calculate fees' };
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('custodial_withdrawals')
      .insert({
        user_id: userId,
        wallet_id: request.wallet_id,
        blockchain: request.blockchain,
        asset: request.asset,
        amount: request.amount,
        destination_address: request.destination_address,
        fee_total: fees.total_fee,
        fee_protocol: fees.protocol_fee,
        fee_foundation: fees.foundation_fee,
        fee_academy: fees.academy_fee,
        amount_after_fee: fees.amount_after_fee,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) throw withdrawalError;

    const newBalance = parseFloat(wallet.balance) - request.amount;
    await supabase
      .from('custodial_wallets')
      .update({ balance: newBalance.toString() })
      .eq('id', request.wallet_id);

    setTimeout(async () => {
      await processWithdrawal(withdrawal.id);
    }, 5000);

    return {
      success: true,
      withdrawal_id: withdrawal.id,
      amount_after_fee: fees.amount_after_fee,
      fees: {
        total: fees.total_fee,
        protocol: fees.protocol_fee,
        foundation: fees.foundation_fee,
        academy: fees.academy_fee
      }
    };
  } catch (error: any) {
    console.error('Error requesting withdrawal:', error);
    return { success: false, error: error.message };
  }
}

async function processWithdrawal(withdrawalId: string): Promise<void> {
  try {
    await supabase
      .from('custodial_withdrawals')
      .update({ status: 'processing', processed_at: new Date().toISOString() })
      .eq('id', withdrawalId);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ withdrawal_id: withdrawalId })
      }
    );

    const result = await response.json();

    if (result.success && result.tx_hash) {
      await supabase
        .from('custodial_withdrawals')
        .update({
          status: 'completed',
          tx_hash: result.tx_hash,
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);
    } else {
      await supabase
        .from('custodial_withdrawals')
        .update({
          status: 'failed',
          failure_reason: result.error || 'Unknown error'
        })
        .eq('id', withdrawalId);
    }
  } catch (error: any) {
    console.error('Error processing withdrawal:', error);
    await supabase
      .from('custodial_withdrawals')
      .update({
        status: 'failed',
        failure_reason: error.message
      })
      .eq('id', withdrawalId);
  }
}

export async function getUserWithdrawals(userId: string) {
  const { data, error } = await supabase
    .from('custodial_withdrawals')
    .select(`
      *,
      custodial_wallets (
        asset
      )
    `)
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }

  return data || [];
}

export async function getInternalSwapRate(
  fromAsset: string,
  toAsset: string
): Promise<number> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-swap-rate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ from_asset: fromAsset, to_asset: toAsset })
      }
    );

    const result = await response.json();
    return result.rate || 0;
  } catch (error) {
    console.error('Error getting swap rate:', error);

    const mockRates: Record<string, number> = {
      'BTC': 95000,
      'ETH': 3500,
      'SOL': 140,
      'BNB': 600,
      'MATIC': 1.15,
      'TRX': 0.15,
      'TYT': 0.05,
      'USDT': 1,
      'USDC': 1
    };

    const fromRate = mockRates[fromAsset] || 1;
    const toRate = mockRates[toAsset] || 1;

    return fromRate / toRate;
  }
}

export async function executeInternalSwap(
  userId: string,
  fromWalletId: string,
  toWalletId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: fromWallet } = await supabase
      .from('custodial_wallets')
      .select('asset, balance')
      .eq('id', fromWalletId)
      .eq('user_id', userId)
      .single();

    const { data: toWallet } = await supabase
      .from('custodial_wallets')
      .select('asset, balance')
      .eq('id', toWalletId)
      .eq('user_id', userId)
      .single();

    if (!fromWallet || !toWallet) {
      return { success: false, error: 'Wallet not found' };
    }

    if (parseFloat(fromWallet.balance) < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const rate = await getInternalSwapRate(fromWallet.asset, toWallet.asset);
    const swapFee = amount * 0.005;
    const amountAfterFee = amount - swapFee;
    const toAmount = amountAfterFee * rate;

    const { error: swapError } = await supabase
      .from('custodial_internal_swaps')
      .insert({
        user_id: userId,
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        from_asset: fromWallet.asset,
        to_asset: toWallet.asset,
        from_amount: amount,
        to_amount: toAmount,
        exchange_rate: rate,
        swap_fee: swapFee,
        status: 'completed'
      });

    if (swapError) throw swapError;

    const newFromBalance = parseFloat(fromWallet.balance) - amount;
    const newToBalance = parseFloat(toWallet.balance) + toAmount;

    await Promise.all([
      supabase
        .from('custodial_wallets')
        .update({ balance: newFromBalance.toString() })
        .eq('id', fromWalletId),
      supabase
        .from('custodial_wallets')
        .update({ balance: newToBalance.toString() })
        .eq('id', toWalletId)
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error executing internal swap:', error);
    return { success: false, error: error.message };
  }
}

export function getExplorerUrl(blockchain: CustodialBlockchain, txHash: string): string {
  return `${BLOCKCHAIN_EXPLORERS[blockchain as keyof typeof BLOCKCHAIN_EXPLORERS] || ''}${txHash}`;
}

export async function getUserInternalSwaps(userId: string) {
  const { data, error } = await supabase
    .from('custodial_internal_swaps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching internal swaps:', error);
    return [];
  }

  return data || [];
}
