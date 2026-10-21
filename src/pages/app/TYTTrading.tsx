import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWeb3 } from '../../contexts/Web3Context';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ExternalLink,
  Activity,
  DollarSign,
  Users,
  Droplets,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import {
  getTYTTokenData,
  getUserTYTHoldings,
  getUserTrades,
  buyTYTToken,
  sellTYTToken,
  formatWalletAddress,
  formatTokenAmount,
  getPriceChangeColor,
  type TYTTokenData,
  type TradeSummary,
  type Trade
} from '../../utils/pumpFun';

type TradeMode = 'buy' | 'sell' | null;

export default function TYTTrading() {
  const { user } = useAuth();
  const { connectedWallet, connectPhantom, isConnecting, getProvider } = useWeb3();

  const [tokenData, setTokenData] = useState<TYTTokenData | null>(null);
  const [holdings, setHoldings] = useState<TradeSummary | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [tradeMode, setTradeMode] = useState<TradeMode>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [isTrading, setIsTrading] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      const [token, userHoldings, userTrades] = await Promise.all([
        getTYTTokenData(),
        getUserTYTHoldings(user.id),
        getUserTrades(user.id)
      ]);

      setTokenData(token);
      setHoldings(userHoldings);
      setTrades(userTrades);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleBuy = async () => {
    if (!connectedWallet || !buyAmount || parseFloat(buyAmount) <= 0) return;

    setIsTrading(true);
    try {
      const provider = getProvider();
      const result = await buyTYTToken(
        connectedWallet.wallet_address,
        parseFloat(buyAmount),
        provider
      );

      if (result.success) {
        alert(`Purchase initiated!\nTransaction: ${result.signature?.slice(0, 16)}...`);
        setTradeMode(null);
        setBuyAmount('');
        await loadData();
      } else {
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error buying TYT:', error);
      alert('Failed to buy TYT tokens');
    } finally {
      setIsTrading(false);
    }
  };

  const handleSell = async () => {
    if (!connectedWallet || !sellAmount || parseFloat(sellAmount) <= 0) return;

    setIsTrading(true);
    try {
      const provider = getProvider();
      const result = await sellTYTToken(
        connectedWallet.wallet_address,
        parseFloat(sellAmount),
        provider
      );

      if (result.success) {
        alert(`Sale initiated!\nTransaction: ${result.signature?.slice(0, 16)}...`);
        setTradeMode(null);
        setSellAmount('');
        await loadData();
      } else {
        alert(`Sale failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error selling TYT:', error);
      alert('Failed to sell TYT tokens');
    } finally {
      setIsTrading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading TYT trading...</div>
        </div>
      </div>
    );
  }

  const estimatedBuyTYT = buyAmount && tokenData
    ? parseFloat(buyAmount) / tokenData.price
    : 0;

  const estimatedSellSOL = sellAmount && tokenData
    ? parseFloat(sellAmount) * tokenData.price
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
              T
            </span>
            TYT Token Trading
          </h1>
          <p className="text-gray-400">Trade TYT on Pump.fun via Solana blockchain</p>
        </div>
        <div className="flex items-center gap-3">
          {connectedWallet ? (
            <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-mono">{formatWalletAddress(connectedWallet.wallet_address)}</span>
            </div>
          ) : (
            <button
              onClick={connectPhantom}
              disabled={isConnecting}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect Phantom
                </>
              )}
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {tokenData && (
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Price
              </div>
              <div className="text-3xl font-bold text-amber-400 mb-1">
                ${tokenData.price.toFixed(8)}
              </div>
              <div className={`text-sm font-semibold flex items-center gap-1 ${getPriceChangeColor(tokenData.priceChange24h)}`}>
                {tokenData.priceChange24h > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {tokenData.priceChange24h > 0 ? '+' : ''}{tokenData.priceChange24h.toFixed(2)}% (24h)
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Market Cap
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${formatTokenAmount(tokenData.marketCap)}
              </div>
              <div className="text-sm text-gray-400">
                Vol: ${formatTokenAmount(tokenData.volume24h)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Holders
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {tokenData.holders.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">
                Supply: {formatTokenAmount(tokenData.totalSupply)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Liquidity
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                ${formatTokenAmount(tokenData.liquidity)}
              </div>
              <a
                href="https://pump.fun/8YuADotEATc86nEgPUZVs8fBRxdMMgEP4JL4xv7rpump"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View on Pump.fun
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {holdings && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-400" />
            Your TYT Holdings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Net Balance</div>
              <div className="text-2xl font-bold text-amber-400">
                {formatTokenAmount(holdings.net_tyt_balance, 2)} TYT
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Invested</div>
              <div className="text-2xl font-bold text-blue-400">
                {holdings.total_sol_spent.toFixed(4)} SOL
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Avg Buy Price</div>
              <div className="text-2xl font-bold text-green-400">
                ${holdings.average_buy_price.toFixed(8)}
              </div>
            </div>
          </div>
        </div>
      )}

      {!connectedWallet ? (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-12 border border-purple-500/30 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400 mb-6">
            Connect your Phantom wallet to start trading TYT tokens on Pump.fun
          </p>
          <button
            onClick={connectPhantom}
            disabled={isConnecting}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-semibold hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Connect Phantom Wallet
          </button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Quick Trade</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setTradeMode('buy')}
              className="group p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 rounded-xl border border-green-500/30 hover:border-green-500/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                  <ArrowDownLeft className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg mb-1">Buy TYT</div>
                  <div className="text-sm text-gray-400">Purchase TYT tokens with SOL</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setTradeMode('sell')}
              className="group p-6 bg-gradient-to-br from-red-500/10 to-rose-500/10 hover:from-red-500/20 hover:to-rose-500/20 rounded-xl border border-red-500/30 hover:border-red-500/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-xl group-hover:bg-red-500/30 transition-colors">
                  <ArrowUpRight className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg mb-1">Sell TYT</div>
                  <div className="text-sm text-gray-400">Sell TYT tokens for SOL</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            Trade History
          </h2>
        </div>
        <div className="divide-y divide-gray-700">
          {trades.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No trades yet</p>
              <p className="text-sm mt-2">Start trading to see your history here</p>
            </div>
          ) : (
            trades.map((trade) => (
              <div key={trade.id} className="p-6 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      trade.trade_type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {trade.trade_type === 'buy' ? (
                        <ArrowDownLeft className="w-6 h-6 text-green-400" />
                      ) : (
                        <ArrowUpRight className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold capitalize mb-1">
                        {trade.trade_type} TYT
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(trade.created_at).toLocaleString()}
                      </div>
                      {trade.tx_signature && (
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {trade.tx_signature.slice(0, 16)}...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      trade.trade_type === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatTokenAmount(trade.tyt_amount, 2)} TYT
                    </div>
                    <div className="text-sm text-gray-400">
                      {trade.sol_amount.toFixed(4)} SOL
                    </div>
                    <div className={`text-xs font-semibold mt-1 flex items-center justify-end gap-1 ${
                      trade.status === 'confirmed' ? 'text-green-400' :
                      trade.status === 'pending' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {trade.status === 'confirmed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : trade.status === 'pending' ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {trade.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {tradeMode === 'buy' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-green-400" />
                Buy TYT
              </h3>
              <button onClick={() => setTradeMode(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">SOL Amount</label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>

              {buyAmount && tokenData && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-2">You will receive approximately:</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatTokenAmount(estimatedBuyTYT, 2)} TYT
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Price: ${tokenData.price.toFixed(8)} per TYT
                  </div>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  Make sure you have enough SOL in your connected wallet. Transaction will be executed on Solana blockchain.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setTradeMode(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBuy}
                  disabled={!buyAmount || parseFloat(buyAmount) <= 0 || isTrading}
                  className="flex-1 px-4 py-3 bg-green-500 rounded-lg font-semibold hover:bg-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTrading ? 'Processing...' : 'Buy TYT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tradeMode === 'sell' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-red-400" />
                Sell TYT
              </h3>
              <button onClick={() => setTradeMode(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {holdings && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-sm text-gray-400">Available Balance</div>
                  <div className="text-xl font-bold text-amber-400">
                    {formatTokenAmount(holdings.net_tyt_balance, 2)} TYT
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-3">TYT Amount</label>
                <input
                  type="number"
                  value={sellAmount}
                  onChange={(e) => setSellAmount(e.target.value)}
                  placeholder="0.00"
                  step="any"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>

              {sellAmount && tokenData && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-2">You will receive approximately:</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {estimatedSellSOL.toFixed(6)} SOL
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Price: ${tokenData.price.toFixed(8)} per TYT
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setTradeMode(null)}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSell}
                  disabled={!sellAmount || parseFloat(sellAmount) <= 0 || isTrading}
                  className="flex-1 px-4 py-3 bg-red-500 rounded-lg font-semibold hover:bg-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTrading ? 'Processing...' : 'Sell TYT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
