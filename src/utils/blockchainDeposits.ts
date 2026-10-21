import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export interface BlockchainNetwork {
  network_code: string;
  network_name: string;
  chain_id: string | null;
  explorer_url: string;
  min_confirmations: number;
  is_active: boolean;
  supports_tokens: boolean;
  native_symbol: string;
}

export interface DepositAddress {
  id: string;
  network_code: string;
  address: string;
  is_verified: boolean;
  created_at: string;
  derivation_path?: string;
  network?: BlockchainNetwork;
}

export interface BlockchainDeposit {
  id: string;
  network_code: string;
  tx_hash: string;
  from_address: string;
  to_address: string;
  asset: string;
  amount: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'credited' | 'failed';
  block_number?: number;
  block_timestamp?: string;
  fee_charged?: number;
  amount_credited?: number;
  detected_at: string;
  confirmed_at?: string;
  credited_at?: string;
}

export async function getSupportedNetworks(): Promise<BlockchainNetwork[]> {
  const { data, error } = await supabase
    .from('blockchain_networks')
    .select('*')
    .eq('is_active', true)
    .order('network_name');

  if (error) {
    console.error('Error fetching networks:', error);
    return [];
  }

  return data || [];
}

export async function getDepositAddresses(): Promise<DepositAddress[]> {
  const { data, error } = await supabase
    .from('user_deposit_addresses')
    .select(`
      *,
      blockchain_networks (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deposit addresses:', error);
    return [];
  }

  return data || [];
}

export async function generateDepositAddress(networkCode: string): Promise<{
  success: boolean;
  address?: string;
  network_name?: string;
  explorer_url?: string;
  qr_code?: string;
  derivation_path?: string;
  error?: string;
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-deposit-address`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ network_code: networkCode }),
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating deposit address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getBlockchainDeposits(): Promise<BlockchainDeposit[]> {
  const { data, error } = await supabase
    .from('blockchain_deposits')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching blockchain deposits:', error);
    return [];
  }

  return data || [];
}

export async function getPendingDeposits(): Promise<BlockchainDeposit[]> {
  const { data, error } = await supabase
    .from('blockchain_deposits')
    .select('*')
    .in('status', ['pending', 'confirmed'])
    .order('detected_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending deposits:', error);
    return [];
  }

  return data || [];
}

export function getExplorerTxUrl(explorerUrl: string, txHash: string): string {
  if (explorerUrl.includes('tronscan')) {
    return `${explorerUrl}/#/transaction/${txHash}`;
  } else if (explorerUrl.includes('etherscan') || explorerUrl.includes('bscscan') || explorerUrl.includes('polygonscan')) {
    return `${explorerUrl}/tx/${txHash}`;
  } else if (explorerUrl.includes('solana')) {
    return `${explorerUrl}/tx/${txHash}`;
  }
  return `${explorerUrl}/tx/${txHash}`;
}

export function getExplorerAddressUrl(explorerUrl: string, address: string): string {
  if (explorerUrl.includes('tronscan')) {
    return `${explorerUrl}/#/address/${address}`;
  } else if (explorerUrl.includes('etherscan') || explorerUrl.includes('bscscan') || explorerUrl.includes('polygonscan')) {
    return `${explorerUrl}/address/${address}`;
  } else if (explorerUrl.includes('solana')) {
    return `${explorerUrl}/address/${address}`;
  }
  return `${explorerUrl}/address/${address}`;
}

export function formatDepositAmount(amount: number, asset: string): string {
  if (asset === 'TRX' || asset === 'BNB' || asset === 'MATIC' || asset === 'SOL') {
    return amount.toFixed(4);
  }
  return amount.toFixed(2);
}

export function getDepositStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-400';
    case 'confirmed':
      return 'text-blue-400';
    case 'credited':
      return 'text-green-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function getDepositStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Confirmations';
    case 'confirmed':
      return 'Confirmed';
    case 'credited':
      return 'Credited';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export async function triggerDepositMonitoring(): Promise<{
  success: boolean;
  checked_addresses?: number;
  new_deposits?: number;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/monitor-deposits?secret=${import.meta.env.VITE_CRON_SECRET || 'change-in-production'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error triggering deposit monitoring:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
