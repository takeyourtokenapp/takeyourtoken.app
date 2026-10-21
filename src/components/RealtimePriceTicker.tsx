import { useRealtimePrice } from '../hooks/useRealtimePrice';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function RealtimePriceTicker() {
  const { prices, isLoading, refresh } = useRealtimePrice(30000);

  const formatPrice = (price: number, decimals: number = 2) => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    return price.toFixed(decimals);
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  const tickers = [
    { symbol: 'BTC', name: 'Bitcoin', price: prices.btc, change: prices.change24h.btc, decimals: 2 },
    { symbol: 'TYT', name: 'TakeYourToken', price: prices.tyt, change: prices.change24h.tyt, decimals: 4 },
    { symbol: 'ETH', name: 'Ethereum', price: prices.eth, change: prices.change24h.eth, decimals: 2 },
    { symbol: 'SOL', name: 'Solana', price: prices.sol, change: prices.change24h.sol, decimals: 2 }
  ];

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 py-3 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh prices"
            >
              <RefreshCw size={16} className={`text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-xs text-gray-500">Live</span>
          </div>

          <div className="flex gap-6 animate-ticker">
            {tickers.map((ticker) => (
              <div key={ticker.symbol} className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{ticker.symbol}</span>
                  <span className="text-sm text-gray-400">${formatPrice(ticker.price, ticker.decimals)}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  ticker.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {ticker.change >= 0 ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  <span>{formatChange(ticker.change)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
