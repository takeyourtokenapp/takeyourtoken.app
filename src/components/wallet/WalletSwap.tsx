import { useState, useEffect } from 'react';
import { ArrowRightLeft, ArrowUpDown, RefreshCw, Loader2, Info, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallets } from '../../hooks/useAPI';
import { supabase } from '../../lib/supabase';

const ASSET_PRICES: Record<string, number> = {
  BTC: 95000,
  ETH: 3500,
  SOL: 140,
  TRX: 0.15,
  XRP: 2.5,
  TON: 5.5,
  TYT: 0.05,
  USDT: 1,
  USDC: 1
};

const SWAP_FEE = 0.003;

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: number;
  usdPrice: number;
}

interface WalletSwapProps {
  selectedAsset?: string;
  onSuccess?: () => void;
}

export default function WalletSwap({ selectedAsset, onSuccess }: WalletSwapProps) {
  const { user } = useAuth();
  const { data: wallets, isLoading: walletsLoading, refetch } = useWallets(user?.id);

  const [fromToken, setFromToken] = useState<string>(selectedAsset || 'BTC');
  const [toToken, setToToken] = useState<string>('TYT');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceImpact, setPriceImpact] = useState(0);

  useEffect(() => {
    if (selectedAsset) {
      setFromToken(selectedAsset);
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      calculateToAmount();
    } else {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const tokens: Token[] = [
    'BTC', 'ETH', 'TYT', 'USDT', 'SOL', 'TRX', 'XRP', 'TON', 'USDC'
  ].map(symbol => {
    const wallet = wallets?.find(w => w.asset === symbol);
    return {
      symbol,
      name: symbol === 'TYT' ? 'TYT Token' : symbol,
      icon: symbol,
      balance: parseFloat(wallet?.balance || '0'),
      usdPrice: ASSET_PRICES[symbol] || 0
    };
  });

  const fromTokenData = tokens.find(t => t.symbol === fromToken);
  const toTokenData = tokens.find(t => t.symbol === toToken);

  const calculateToAmount = () => {
    const amount = parseFloat(fromAmount);
    if (!amount || !fromTokenData || !toTokenData) return;

    const fromValue = amount * fromTokenData.usdPrice;
    const feeAmount = fromValue * SWAP_FEE;
    const netValue = fromValue - feeAmount;
    const toAmountCalc = netValue / toTokenData.usdPrice;

    setToAmount(toAmountCalc.toFixed(8));

    const impact = (feeAmount / fromValue) * 100;
    setPriceImpact(impact);
  };

  const handleSwap = async () => {
    if (!user || !fromAmount || !toAmount) {
      setError('Please enter swap amounts');
      return;
    }

    const amount = parseFloat(fromAmount);
    if (amount <= 0 || amount > (fromTokenData?.balance || 0)) {
      setError('Invalid amount or insufficient balance');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fromValue = amount * (fromTokenData?.usdPrice || 0);
      const toValue = parseFloat(toAmount) * (toTokenData?.usdPrice || 0);
      const feeAmount = fromValue * SWAP_FEE;
      const protocolFee = feeAmount * 0.6;
      const charityFee = feeAmount * 0.3;
      const academyFee = feeAmount * 0.1;

      const { error: swapError } = await supabase
        .from('token_swaps')
        .insert({
          user_id: user.id,
          from_asset: fromToken,
          to_asset: toToken,
          from_amount: amount,
          to_amount: parseFloat(toAmount),
          exchange_rate: (fromTokenData?.usdPrice || 0) / (toTokenData?.usdPrice || 0),
          fee_amount: feeAmount,
          fee_asset: 'USD',
          status: 'completed',
          executed_at: new Date().toISOString()
        });

      if (swapError) throw swapError;

      const { error: ledgerError } = await supabase.rpc('process_swap_transaction', {
        p_user_id: user.id,
        p_from_asset: fromToken,
        p_to_asset: toToken,
        p_from_amount: amount,
        p_to_amount: parseFloat(toAmount),
        p_fee_usd: feeAmount
      });

      if (ledgerError) throw ledgerError;

      setSuccess(true);
      setFromAmount('');
      setToAmount('');
      refetch();
      onSuccess?.();

      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('Swap failed:', err);
      setError(err.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  const handleFlipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount('');
    setToAmount('');
  };

  const handleMaxAmount = () => {
    if (fromTokenData) {
      setFromAmount(fromTokenData.balance.toString());
    }
  };

  const exchangeRate = fromTokenData && toTokenData
    ? (fromTokenData.usdPrice / toTokenData.usdPrice).toFixed(6)
    : '0';

  const totalFee = parseFloat(fromAmount) * (fromTokenData?.usdPrice || 0) * SWAP_FEE;
  const protocolFee = totalFee * 0.6;
  const charityFee = totalFee * 0.3;
  const academyFee = totalFee * 0.1;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
            <ArrowRightLeft className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Swap Tokens</h2>
            <p className="text-sm text-gray-400">Exchange between supported assets</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-green-200">
              Swap completed successfully! Your balances have been updated.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">From</span>
              <span className="text-xs text-gray-400">
                Balance: {fromTokenData?.balance.toFixed(fromToken === 'BTC' ? 8 : 4) || '0'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol} disabled={token.symbol === toToken}>
                    {token.symbol}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.0001"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-right text-xl font-semibold focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleMaxAmount}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/30 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>

            {fromAmount && parseFloat(fromAmount) > 0 && (
              <div className="text-xs text-gray-400 mt-2 text-right">
                ≈ ${(parseFloat(fromAmount) * (fromTokenData?.usdPrice || 0)).toFixed(2)} USD
              </div>
            )}
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlipTokens}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 border-4 border-gray-900 transition-all hover:rotate-180 duration-300"
            >
              <ArrowUpDown className="text-blue-400" size={20} />
            </button>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">To</span>
              <span className="text-xs text-gray-400">
                Balance: {toTokenData?.balance.toFixed(toToken === 'BTC' ? 8 : 4) || '0'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol} disabled={token.symbol === fromToken}>
                    {token.symbol}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={toAmount}
                readOnly
                placeholder="0.0"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-right text-xl font-semibold focus:outline-none"
              />
            </div>

            {toAmount && parseFloat(toAmount) > 0 && (
              <div className="text-xs text-gray-400 mt-2 text-right">
                ≈ ${(parseFloat(toAmount) * (toTokenData?.usdPrice || 0)).toFixed(2)} USD
              </div>
            )}
          </div>
        </div>

        {fromAmount && parseFloat(fromAmount) > 0 && (
          <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Exchange Rate:</span>
                <span className="font-mono text-white">1 {fromToken} = {exchangeRate} {toToken}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Swap Fee (0.3%):</span>
                <span className="font-mono text-blue-400">${totalFee.toFixed(4)}</span>
              </div>
              <div className="ml-4 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>• Protocol (60%):</span>
                  <span className="font-mono">${protocolFee.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>• Charity (30%):</span>
                  <span className="font-mono">${charityFee.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>• Academy (10%):</span>
                  <span className="font-mono">${academyFee.toFixed(4)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Slippage Tolerance:</span>
                <span className="text-white">{slippage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price Impact:</span>
                <span className={priceImpact > 1 ? 'text-amber-400' : 'text-green-400'}>
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-2">Slippage Tolerance</label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    slippage === value
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > (fromTokenData?.balance || 0)}
          className="w-full mt-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Swapping...
            </>
          ) : (
            <>
              <ArrowRightLeft size={20} />
              Swap {fromToken} for {toToken}
            </>
          )}
        </button>

        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-200">
              <div className="font-semibold mb-2">Swap Details:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Instant execution</li>
                <li>0.3% swap fee (60% protocol, 30% charity, 10% academy)</li>
                <li>Best rates aggregated from multiple sources</li>
                <li>No minimum amount required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
