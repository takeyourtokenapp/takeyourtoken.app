import { BlockchainNetwork } from '../contexts/MultiChainWeb3Context';
import { supabase } from '../lib/supabase';

export interface SwapQuote {
  inputToken: string;
  outputToken: string;
  inputAmount: number;
  outputAmount: number;
  priceImpact: number;
  route: string[];
  estimatedGas: number;
  provider: string;
}

export interface SwapResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export async function getSwapQuote(
  network: BlockchainNetwork,
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<SwapQuote | null> {
  try {
    switch (network) {
      case 'solana':
        return await getJupiterQuote(tokenIn, tokenOut, amount);
      case 'ethereum':
      case 'bsc':
      case 'polygon':
        return await get1InchQuote(network, tokenIn, tokenOut, amount);
      case 'tron':
        return await getSunSwapQuote(tokenIn, tokenOut, amount);
      default:
        return null;
    }
  } catch (error) {
    console.error('Error getting swap quote:', error);
    return null;
  }
}

async function getJupiterQuote(
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<SwapQuote> {
  const amountInLamports = Math.floor(amount * 1e9);

  const mockQuote: SwapQuote = {
    inputToken: tokenIn,
    outputToken: tokenOut,
    inputAmount: amount,
    outputAmount: amount * 1850,
    priceImpact: 0.12,
    route: ['Raydium', 'Orca'],
    estimatedGas: 0.000005,
    provider: 'Jupiter Aggregator'
  };

  return mockQuote;
}

async function get1InchQuote(
  network: BlockchainNetwork,
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<SwapQuote> {
  const rates: Record<string, number> = {
    ethereum: 3200,
    bsc: 600,
    polygon: 1.15
  };

  const rate = rates[network] || 1;

  const mockQuote: SwapQuote = {
    inputToken: tokenIn,
    outputToken: tokenOut,
    inputAmount: amount,
    outputAmount: amount * rate * 1850,
    priceImpact: 0.15,
    route: ['1inch'],
    estimatedGas: network === 'ethereum' ? 0.002 : 0.0001,
    provider: '1inch Aggregator'
  };

  return mockQuote;
}

async function getSunSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amount: number
): Promise<SwapQuote> {
  const mockQuote: SwapQuote = {
    inputToken: tokenIn,
    outputToken: tokenOut,
    inputAmount: amount,
    outputAmount: amount * 0.15 * 1850,
    priceImpact: 0.18,
    route: ['SunSwap V2'],
    estimatedGas: 0,
    provider: 'SunSwap'
  };

  return mockQuote;
}

export async function executeSwap(
  userId: string,
  network: BlockchainNetwork,
  quote: SwapQuote,
  walletAddress: string,
  provider: any
): Promise<SwapResult> {
  try {
    const mockTxHash = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

    const { error } = await supabase
      .from('token_swaps')
      .insert({
        user_id: userId,
        blockchain: network,
        from_token: quote.inputToken,
        to_token: quote.outputToken,
        from_amount: quote.inputAmount,
        to_amount: quote.outputAmount,
        wallet_address: walletAddress,
        tx_hash: mockTxHash,
        swap_provider: quote.provider,
        status: 'completed'
      });

    if (error) throw error;

    return {
      success: true,
      txHash: mockTxHash
    };
  } catch (error: any) {
    console.error('Error executing swap:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getUserSwapHistory(userId: string) {
  const { data, error } = await supabase
    .from('token_swaps')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching swap history:', error);
    return [];
  }

  return data || [];
}

export const POPULAR_TOKENS: Record<BlockchainNetwork, Array<{symbol: string, address: string, name: string}>> = {
  solana: [
    { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', name: 'Solana' },
    { symbol: 'TYT', address: import.meta.env.VITE_TYT_TOKEN_MINT || '', name: 'TYT Token' },
    { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'USD Coin' },
    { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', name: 'Tether' },
  ],
  ethereum: [
    { symbol: 'ETH', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'Ethereum' },
    { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', name: 'Tether' },
  ],
  bsc: [
    { symbol: 'BNB', address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', name: 'BNB' },
    { symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', name: 'Tether' },
    { symbol: 'BUSD', address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', name: 'Binance USD' },
  ],
  polygon: [
    { symbol: 'MATIC', address: '0x0000000000000000000000000000000000001010', name: 'Polygon' },
    { symbol: 'USDC', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', name: 'USD Coin' },
    { symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', name: 'Tether' },
  ],
  tron: [
    { symbol: 'TRX', address: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb', name: 'TRON' },
    { symbol: 'USDT', address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', name: 'Tether' },
  ]
};
