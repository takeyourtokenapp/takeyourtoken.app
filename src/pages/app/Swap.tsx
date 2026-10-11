import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Repeat,
  Settings,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import TokenSelector from '../../components/wallet/TokenSelector';
import SwapPreview from '../../components/wallet/SwapPreview';

interface Token {
  symbol: string;
  name: string;
  balance: number;
  contract_address?: string;
  decimals?: number;
}

export default function Swap() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);

  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [recentSwaps, setRecentSwaps] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadTokensAndSwaps();
    }
  }, [user]);

  useEffect(() => {
    if (fromToken && fromAmount && parseFloat(fromAmount) > 0) {
      calculateToAmount();
    }
  }, [fromToken, toToken, fromAmount]);

  const loadTokensAndSwaps = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const swapsRes = await supabase
        .from('token_swaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const tokenList: Token[] = [
        { symbol: 'TYT', name: 'TakeYourToken', balance: 0 },
        { symbol: 'BTC', name: 'Bitcoin', balance: 0 },
        { symbol: 'USDT', name: 'Tether USD', balance: 0 }
      ];

      // custodial_wallets uses 'currency' and 'balance', not balance_btc/balance_tyt/balance_usdt
      const walletRes = await supabase
        .from('custodial_wallets')
        .select('currency, balance')
        .eq('user_id', user.id);

      const walletMap: Record<string, number> = {};
      (walletRes.data || []).forEach(w => {
        walletMap[w.currency] = parseFloat(w.balance || '0');
      });

      const walletTokenList: Token[] = [
        {
          symbol: 'TYT',
          name: 'TakeYourToken',
          balance: walletMap['TYT'] || 0
        },
        {
          symbol: 'BTC',
          name: 'Bitcoin',
          balance: walletMap['BTC'] || 0
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          balance: walletMap['USDT'] || 0
        }
      ];

      const uniqueTokens = Array.from(
        new Map(walletTokenList.map(t => [t.symbol, t])).values()
      );

      setTokens(uniqueTokens);
      setRecentSwaps(swapsRes.data || []);

      if (uniqueTokens.length > 0 && !fromToken) {
        setFromToken(uniqueTokens.find(t => t.symbol === 'TYT') || uniqueTokens[0]);
      }
      if (uniqueTokens.length > 1 && !toToken) {
        setToToken(uniqueTokens.find(t => t.symbol === 'BTC') || uniqueTokens[1]);
      }
    } catch (err) {
      console.error('Error loading tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateToAmount = () => {
    if (!fromToken || !toToken || !fromAmount) return;

    const amount = parseFloat(fromAmount);
    if (isNaN(amount) || amount <= 0) return;

    let rate = 1;
    if (fromToken.symbol === 'TYT' && toToken.symbol === 'BTC') {
      rate = 0.00001;
    } else if (fromToken.symbol === 'BTC' && toToken.symbol === 'TYT') {
      rate = 100000;
    } else if (fromToken.symbol === 'TYT' && toToken.symbol === 'USDT') {
      rate = 0.5;
    } else if (fromToken.symbol === 'USDT' && toToken.symbol === 'TYT') {
      rate = 2;
    } else if (fromToken.symbol === 'BTC' && toToken.symbol === 'USDT') {
      rate = 45000;
    } else if (fromToken.symbol === 'USDT' && toToken.symbol === 'BTC') {
      rate = 0.0000222;
    }

    const fee = amount * 0.003;
    const outputAmount = (amount - fee) * rate;
    setToAmount(outputAmount.toFixed(8));
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;

    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleSwap = async () => {
    if (!user || !fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) return;

    const amount = parseFloat(fromAmount);
    if (amount > fromToken.balance) {
      alert('Insufficient balance');
      return;
    }

    try {
      setSwapping(true);

      const { error } = await supabase
        .from('token_swaps')
        .insert({
          user_id: user.id,
          from_token: fromToken.symbol,
          to_token: toToken.symbol,
          from_amount: amount,
          to_amount: parseFloat(toAmount),
          status: 'completed',
          blockchain: 'internal',
          swap_provider: 'tyt-internal',
          price_impact: parseFloat(((parseFloat(toAmount) / amount - 1) * 100).toFixed(2)),
        });

      if (error) throw error;

      await loadTokensAndSwaps();
      setFromAmount('');
      setToAmount('');

      alert('Swap completed successfully!');
    } catch (err) {
      console.error('Swap error:', err);
      alert('Swap failed. Please try again.');
    } finally {
      setSwapping(false);
    }
  };

  const exchangeRate = fromAmount && toAmount && parseFloat(fromAmount) > 0
    ? parseFloat(toAmount) / parseFloat(fromAmount)
    : 0;

  const priceImpact = fromAmount && parseFloat(fromAmount) > 1000 ? 2.5 : 0.5;
  const fee = fromAmount ? parseFloat(fromAmount) * 0.003 : 0;
  const minReceived = toAmount ? parseFloat(toAmount) * (1 - slippage / 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  const isSwapValid = fromToken && toToken && fromAmount &&
    parseFloat(fromAmount) > 0 &&
    parseFloat(fromAmount) <= fromToken.balance &&
    fromToken.symbol !== toToken.symbol;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Token Swap</h1>
          <p className="text-gray-400">
            Exchange tokens instantly with the best rates
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 bg-navy-800 border border-gold-500/20 rounded-lg hover:border-gold-500/40 transition-colors"
        >
          <Settings className={`w-5 h-5 text-gray-400 ${showSettings ? 'rotate-90' : ''} transition-transform`} />
        </button>
      </div>

      {showSettings && (
        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Swap Settings</h3>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Slippage Tolerance
            </label>
            <div className="flex gap-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    slippage === value
                      ? 'bg-gold-500 text-navy-900'
                      : 'bg-navy-700 text-white hover:bg-navy-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                step="0.1"
                min="0.1"
                max="50"
                className="flex-1 px-4 py-2 bg-navy-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-navy-800 to-navy-900 border border-gold-500/20 rounded-xl p-6 space-y-4">
        <div className="bg-navy-700/50 rounded-lg p-4">
          <TokenSelector
            label="From"
            selectedToken={fromToken}
            tokens={tokens}
            onSelect={setFromToken}
          />
          <input
            type="number"
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
            placeholder="0.0"
            className="w-full mt-3 px-4 py-3 bg-navy-800 border border-gray-600 rounded-lg text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-gold-500"
          />
          {fromToken && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-400">Balance: {fromToken.balance.toFixed(4)}</span>
              <button
                onClick={() => setFromAmount(fromToken.balance.toString())}
                className="text-gold-400 hover:text-gold-300 font-medium"
              >
                Max
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-3 bg-navy-700 border border-gold-500/20 rounded-lg hover:border-gold-500 transition-all hover:rotate-180"
          >
            <Repeat className="w-5 h-5 text-gold-400" />
          </button>
        </div>

        <div className="bg-navy-700/50 rounded-lg p-4">
          <TokenSelector
            label="To"
            selectedToken={toToken}
            tokens={tokens.filter(t => t.symbol !== fromToken?.symbol)}
            onSelect={setToToken}
          />
          <input
            type="text"
            value={toAmount}
            readOnly
            placeholder="0.0"
            className="w-full mt-3 px-4 py-3 bg-navy-800 border border-gray-600 rounded-lg text-white text-2xl font-bold"
          />
          {toToken && (
            <div className="mt-2 text-sm text-gray-400">
              Balance: {toToken.balance.toFixed(4)}
            </div>
          )}
        </div>

        <button
          onClick={handleSwap}
          disabled={!isSwapValid || swapping}
          className="w-full py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-gold-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {swapping ? 'Swapping...' : 'Swap Tokens'}
        </button>

        {!isSwapValid && fromAmount && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                {parseFloat(fromAmount) > (fromToken?.balance || 0)
                  ? 'Insufficient balance'
                  : 'Enter a valid amount'}
              </p>
            </div>
          </div>
        )}
      </div>

      {fromAmount && toAmount && fromToken && toToken && (
        <SwapPreview
          fromToken={fromToken.symbol}
          toToken={toToken.symbol}
          fromAmount={parseFloat(fromAmount)}
          toAmount={parseFloat(toAmount)}
          exchangeRate={exchangeRate}
          priceImpact={priceImpact}
          fee={fee}
          slippage={slippage}
          minReceived={minReceived}
        />
      )}

      {recentSwaps.length > 0 && (
        <div className="bg-navy-800 border border-gold-500/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            Recent Swaps
          </h3>
          <div className="space-y-3">
            {recentSwaps.map((swap) => (
              <div
                key={swap.id}
                className="flex items-center justify-between bg-navy-700/50 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">
                      {swap.from_amount} {swap.from_token} → {swap.to_amount.toFixed(6)} {swap.to_token}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(swap.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gold-400 font-medium">
                    1 {swap.from_token} = {swap.exchange_rate.toFixed(6)} {swap.to_token}
                  </p>
                  <p className="text-xs text-gray-400">Fee: {swap.fee_amount.toFixed(4)} {swap.from_token}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
