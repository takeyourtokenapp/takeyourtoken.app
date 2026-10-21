import { useState, useEffect } from 'react';
import { ArrowDownUp, TrendingUp, Info, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
}

const TOKENS: Record<string, Omit<Token, 'balance'>> = {
  BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  TYT: { symbol: 'TYT', name: 'TYT Token', icon: '🦉' },
  USDT: { symbol: 'USDT', name: 'Tether', icon: '₮' },
  ETH: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  SOL: { symbol: 'SOL', name: 'Solana', icon: '◎' },
  TRX: { symbol: 'TRX', name: 'TRON', icon: '⬣' },
};

export default function Swap() {
  const { user } = useAuth();
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [swapFee, setSwapFee] = useState(0.3);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [swapHistory, setSwapHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadBalances();
      loadSwapHistory();
    }
  }, [user]);

  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      fetchExchangeRate();
    }
  }, [fromToken, toToken, fromAmount]);

  const loadBalances = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('custodial_wallets')
      .select('asset, balance')
      .eq('user_id', user.id);

    if (data) {
      const balanceMap: Record<string, number> = {};
      data.forEach((wallet) => {
        balanceMap[wallet.asset] = parseFloat(wallet.balance || '0');
      });
      setBalances(balanceMap);

      // Set default tokens
      if (!fromToken && balanceMap['USDT'] !== undefined) {
        setFromToken({ ...TOKENS['USDT'], balance: balanceMap['USDT'] });
      }
      if (!toToken && balanceMap['TYT'] !== undefined) {
        setToToken({ ...TOKENS['TYT'], balance: balanceMap['TYT'] });
      }
    }
  };

  const loadSwapHistory = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('custodial_internal_swaps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setSwapHistory(data);
    }
  };

  const fetchExchangeRate = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setLoadingRate(true);

    try {
      // Simulate exchange rate fetch (in production, call real API)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock rates (in production, fetch from price oracle)
      const rates: Record<string, Record<string, number>> = {
        BTC: { USDT: 45000, TYT: 900000, ETH: 15, SOL: 450, TRX: 450000 },
        USDT: { BTC: 0.000022, TYT: 20, ETH: 0.00033, SOL: 0.01, TRX: 10 },
        TYT: { BTC: 0.0000011, USDT: 0.05, ETH: 0.000017, SOL: 0.0005, TRX: 0.5 },
        ETH: { BTC: 0.067, USDT: 3000, TYT: 60000, SOL: 30, TRX: 30000 },
        SOL: { BTC: 0.0022, USDT: 100, TYT: 2000, ETH: 0.033, TRX: 1000 },
        TRX: { BTC: 0.0000022, USDT: 0.1, TYT: 2, ETH: 0.000033, SOL: 0.001 },
      };

      const rate = rates[fromToken.symbol]?.[toToken.symbol] || 1;
      setExchangeRate(rate);

      const calculatedAmount = parseFloat(fromAmount) * rate * (1 - swapFee / 100);
      setToAmount(calculatedAmount.toFixed(6));
    } catch (error) {
      console.error('Failed to fetch rate:', error);
    } finally {
      setLoadingRate(false);
    }
  };

  const handleSwap = async () => {
    if (!user || !fromToken || !toToken || !fromAmount || !toAmount) return;

    setLoading(true);

    try {
      // Get wallet IDs
      const { data: fromWallet } = await supabase
        .from('custodial_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset', fromToken.symbol)
        .single();

      const { data: toWallet } = await supabase
        .from('custodial_wallets')
        .select('id')
        .eq('user_id', user.id)
        .eq('asset', toToken.symbol)
        .single();

      if (!fromWallet || !toWallet) {
        throw new Error('Wallets not found');
      }

      // Create swap record
      const { error } = await supabase.from('custodial_internal_swaps').insert({
        user_id: user.id,
        from_wallet_id: fromWallet.id,
        to_wallet_id: toWallet.id,
        from_asset: fromToken.symbol,
        to_asset: toToken.symbol,
        from_amount: parseFloat(fromAmount),
        to_amount: parseFloat(toAmount),
        exchange_rate: exchangeRate,
        swap_fee: (parseFloat(fromAmount) * swapFee) / 100,
        rate_provider: 'internal',
        status: 'completed',
      });

      if (error) throw error;

      alert('Swap completed successfully!');
      setFromAmount('');
      setToAmount('');
      loadBalances();
      loadSwapHistory();
    } catch (error: any) {
      console.error('Swap error:', error);
      alert(error.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFlipTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMaxAmount = () => {
    if (fromToken) {
      setFromAmount(fromToken.balance.toString());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Token Swap</h1>
        <p className="text-gray-400">Exchange tokens instantly within your wallet</p>
      </div>

      {/* Swap Interface */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-gray-700/50">
        <div className="space-y-4">
          {/* From Token */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400">From</label>
              <span className="text-sm text-gray-400">
                Balance: {fromToken?.balance.toFixed(6) || '0.00'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={fromToken?.symbol || ''}
                onChange={(e) => {
                  const token = TOKENS[e.target.value];
                  if (token) {
                    setFromToken({ ...token, balance: balances[token.symbol] || 0 });
                  }
                }}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#D2A44C]"
              >
                <option value="">Select token</option>
                {Object.values(TOKENS).map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.icon} {token.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-2 bg-transparent text-white text-xl font-bold focus:outline-none"
              />
              <button
                onClick={handleMaxAmount}
                className="px-3 py-1 bg-[#D2A44C]/20 text-[#D2A44C] rounded text-sm hover:bg-[#D2A44C]/30"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleFlipTokens}
              className="p-3 rounded-full bg-gray-800 border border-gray-700 hover:border-[#D2A44C] hover:bg-gray-700 transition-all"
            >
              <ArrowDownUp className="w-5 h-5 text-[#D2A44C]" />
            </button>
          </div>

          {/* To Token */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-400">To</label>
              <span className="text-sm text-gray-400">
                Balance: {toToken?.balance.toFixed(6) || '0.00'}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={toToken?.symbol || ''}
                onChange={(e) => {
                  const token = TOKENS[e.target.value];
                  if (token) {
                    setToToken({ ...token, balance: balances[token.symbol] || 0 });
                  }
                }}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#D2A44C]"
              >
                <option value="">Select token</option>
                {Object.values(TOKENS).map((token) => (
                  <option key={token.symbol} value={token.symbol}>
                    {token.icon} {token.symbol}
                  </option>
                ))}
              </select>
              <div className="flex-1 text-right">
                {loadingRate ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {toAmount || '0.00'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Swap Details */}
          {fromToken && toToken && fromAmount && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Exchange Rate:</span>
                  <span className="text-white font-medium">
                    1 {fromToken.symbol} = {exchangeRate.toFixed(6)} {toToken.symbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Swap Fee:</span>
                  <span className="text-white font-medium">{swapFee}%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Slippage Tolerance:</span>
                  <span className="text-white font-medium">{slippage}%</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Price Impact:</span>
                  <span className="text-green-400 font-medium">{'<0.01%'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Slippage Settings */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Slippage:</span>
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-3 py-1 rounded text-sm ${
                  slippage === value
                    ? 'bg-[#D2A44C] text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={
              loading ||
              !fromToken ||
              !toToken ||
              !fromAmount ||
              parseFloat(fromAmount) <= 0 ||
              parseFloat(fromAmount) > (fromToken?.balance || 0)
            }
            className="w-full py-4 bg-gradient-to-r from-[#D2A44C] to-yellow-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#D2A44C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Swap Tokens
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recent Swaps */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-xl font-bold text-white mb-4">Recent Swaps</h2>
        <div className="space-y-3">
          {swapHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No swaps yet</div>
          ) : (
            swapHistory.map((swap) => (
              <div
                key={swap.id}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-[#D2A44C]" />
                    <div>
                      <div className="text-white font-medium">
                        {swap.from_amount} {swap.from_asset} → {swap.to_amount} {swap.to_asset}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(swap.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-400">Completed</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
