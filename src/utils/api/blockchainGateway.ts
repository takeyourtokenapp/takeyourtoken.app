import { supabase } from '../../lib/supabase';

export type SupportedNetwork = 'solana' | 'polygon' | 'tron' | 'ethereum' | 'bitcoin' | 'ton' | 'xrp';

export interface NetworkConfig {
  network: SupportedNetwork;
  chainId?: string;
  rpcEndpoints: string[];
  explorerUrl: string;
  nativeSymbol: string;
  minConfirmations: number;
  isActive: boolean;
  supportsTokens: boolean;
}

export interface DepositAddress {
  address: string;
  network: SupportedNetwork;
  networkName: string;
  explorerUrl: string;
  memo?: string;
  tag?: string;
}

export interface TransactionStatus {
  txHash: string;
  network: SupportedNetwork;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  requiredConfirmations: number;
  blockNumber?: number;
  timestamp?: string;
  amount?: number;
  asset?: string;
}

export interface WithdrawalRequest {
  userId: string;
  toAddress: string;
  network: SupportedNetwork;
  asset: string;
  amount: number;
  memo?: string;
}

export interface WithdrawalResult {
  success: boolean;
  withdrawalId?: string;
  txHash?: string;
  estimatedFee?: number;
  error?: string;
}

const NETWORK_CONFIGS: Record<SupportedNetwork, Partial<NetworkConfig>> = {
  solana: {
    nativeSymbol: 'SOL',
    minConfirmations: 31,
    supportsTokens: true,
    explorerUrl: 'https://explorer.solana.com'
  },
  polygon: {
    chainId: '137',
    nativeSymbol: 'MATIC',
    minConfirmations: 128,
    supportsTokens: true,
    explorerUrl: 'https://polygonscan.com'
  },
  tron: {
    nativeSymbol: 'TRX',
    minConfirmations: 19,
    supportsTokens: true,
    explorerUrl: 'https://tronscan.org'
  },
  ethereum: {
    chainId: '1',
    nativeSymbol: 'ETH',
    minConfirmations: 12,
    supportsTokens: true,
    explorerUrl: 'https://etherscan.io'
  },
  bitcoin: {
    nativeSymbol: 'BTC',
    minConfirmations: 3,
    supportsTokens: false,
    explorerUrl: 'https://mempool.space'
  },
  ton: {
    nativeSymbol: 'TON',
    minConfirmations: 1,
    supportsTokens: true,
    explorerUrl: 'https://tonscan.org'
  },
  xrp: {
    nativeSymbol: 'XRP',
    minConfirmations: 1,
    supportsTokens: false,
    explorerUrl: 'https://xrpscan.com'
  }
};

export async function getActiveNetworks(): Promise<NetworkConfig[]> {
  const { data, error } = await supabase
    .from('blockchain_networks')
    .select('*')
    .eq('is_active', true)
    .order('network_code');

  if (error) throw error;

  return (data || []).map(row => ({
    network: row.network_code.toLowerCase() as SupportedNetwork,
    chainId: row.chain_id,
    rpcEndpoints: row.rpc_endpoint ? [row.rpc_endpoint] : [],
    explorerUrl: row.explorer_url,
    nativeSymbol: row.native_symbol,
    minConfirmations: row.min_confirmations,
    isActive: row.is_active,
    supportsTokens: row.supports_tokens
  }));
}

export async function getUserDepositAddress(
  userId: string,
  network: SupportedNetwork
): Promise<DepositAddress | null> {
  const { data, error } = await supabase
    .from('user_deposit_addresses')
    .select(`
      address,
      network_code,
      blockchain_networks (
        network_name,
        explorer_url
      )
    `)
    .eq('user_id', userId)
    .eq('network_code', network.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const networkInfo = data.blockchain_networks as { network_name: string; explorer_url: string } | null;

  return {
    address: data.address,
    network,
    networkName: networkInfo?.network_name || network,
    explorerUrl: networkInfo?.explorer_url || NETWORK_CONFIGS[network]?.explorerUrl || ''
  };
}

export async function requestDepositAddress(
  userId: string,
  network: SupportedNetwork
): Promise<DepositAddress> {
  const existing = await getUserDepositAddress(userId, network);
  if (existing) return existing;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-deposit-address`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, network: network.toUpperCase() })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate deposit address');
  }

  const result = await response.json();
  return {
    address: result.address,
    network,
    networkName: result.networkName,
    explorerUrl: result.explorerUrl,
    memo: result.memo,
    tag: result.tag
  };
}

export async function getTransactionStatus(
  txHash: string,
  network: SupportedNetwork
): Promise<TransactionStatus> {
  const { data, error } = await supabase
    .from('blockchain_deposits')
    .select(`
      tx_hash,
      network_code,
      status,
      confirmations,
      block_number,
      block_timestamp,
      amount,
      asset,
      blockchain_networks (
        min_confirmations
      )
    `)
    .eq('tx_hash', txHash)
    .eq('network_code', network.toUpperCase())
    .maybeSingle();

  if (error) throw error;

  const networkInfo = data?.blockchain_networks as { min_confirmations: number } | null;
  const minConf = networkInfo?.min_confirmations || NETWORK_CONFIGS[network]?.minConfirmations || 1;

  if (!data) {
    return {
      txHash,
      network,
      status: 'pending',
      confirmations: 0,
      requiredConfirmations: minConf
    };
  }

  return {
    txHash: data.tx_hash,
    network,
    status: data.status as TransactionStatus['status'],
    confirmations: data.confirmations,
    requiredConfirmations: minConf,
    blockNumber: data.block_number,
    timestamp: data.block_timestamp,
    amount: data.amount,
    asset: data.asset
  };
}

export async function getUserDeposits(
  userId: string,
  options: {
    network?: SupportedNetwork;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  id: string;
  txHash: string;
  network: SupportedNetwork;
  asset: string;
  amount: number;
  amountUsd: number | null;
  status: string;
  confirmations: number;
  detectedAt: string;
  confirmedAt: string | null;
}[]> {
  const { network, status, limit = 20, offset = 0 } = options;

  let query = supabase
    .from('blockchain_deposits')
    .select('*')
    .eq('user_id', userId)
    .order('detected_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (network) {
    query = query.eq('network_code', network.toUpperCase());
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    txHash: row.tx_hash,
    network: row.network_code.toLowerCase() as SupportedNetwork,
    asset: row.asset,
    amount: row.amount,
    amountUsd: row.amount_usd,
    status: row.status,
    confirmations: row.confirmations,
    detectedAt: row.detected_at,
    confirmedAt: row.confirmed_at
  }));
}

export async function requestWithdrawal(
  request: WithdrawalRequest
): Promise<WithdrawalResult> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: request.userId,
        toAddress: request.toAddress,
        network: request.network.toUpperCase(),
        asset: request.asset,
        amount: request.amount,
        memo: request.memo
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: result.message || 'Withdrawal failed'
    };
  }

  return {
    success: true,
    withdrawalId: result.withdrawalId,
    txHash: result.txHash,
    estimatedFee: result.estimatedFee
  };
}

export function getExplorerTxUrl(network: SupportedNetwork, txHash: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config?.explorerUrl) return '';

  switch (network) {
    case 'solana':
      return `${config.explorerUrl}/tx/${txHash}`;
    case 'polygon':
    case 'ethereum':
      return `${config.explorerUrl}/tx/${txHash}`;
    case 'tron':
      return `${config.explorerUrl}/#/transaction/${txHash}`;
    case 'bitcoin':
      return `${config.explorerUrl}/tx/${txHash}`;
    case 'ton':
      return `${config.explorerUrl}/tx/${txHash}`;
    case 'xrp':
      return `${config.explorerUrl}/tx/${txHash}`;
    default:
      return '';
  }
}

export function getExplorerAddressUrl(network: SupportedNetwork, address: string): string {
  const config = NETWORK_CONFIGS[network];
  if (!config?.explorerUrl) return '';

  switch (network) {
    case 'solana':
      return `${config.explorerUrl}/address/${address}`;
    case 'polygon':
    case 'ethereum':
      return `${config.explorerUrl}/address/${address}`;
    case 'tron':
      return `${config.explorerUrl}/#/address/${address}`;
    case 'bitcoin':
      return `${config.explorerUrl}/address/${address}`;
    case 'ton':
      return `${config.explorerUrl}/address/${address}`;
    case 'xrp':
      return `${config.explorerUrl}/account/${address}`;
    default:
      return '';
  }
}

export function formatNetworkAmount(
  amount: number,
  network: SupportedNetwork,
  decimals: number = 4
): string {
  const config = NETWORK_CONFIGS[network];
  return `${amount.toFixed(decimals)} ${config?.nativeSymbol || network.toUpperCase()}`;
}

export function validateAddress(address: string, network: SupportedNetwork): boolean {
  switch (network) {
    case 'solana':
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    case 'polygon':
    case 'ethereum':
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    case 'tron':
      return /^T[a-zA-Z0-9]{33}$/.test(address);
    case 'bitcoin':
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}$/.test(address);
    case 'ton':
      return /^(EQ|UQ)[a-zA-Z0-9_-]{46}$/.test(address);
    case 'xrp':
      return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(address);
    default:
      return false;
  }
}
