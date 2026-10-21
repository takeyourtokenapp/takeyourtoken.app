import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<CryptoPrice[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: 43250.00, change24h: 2.45, volume24h: 28500000000 },
    { symbol: 'ETH', name: 'Ethereum', price: 2280.50, change24h: -1.23, volume24h: 15200000000 },
    { symbol: 'TYT', name: 'TakeYourToken', price: 0.0842, change24h: 8.76, volume24h: 1250000 },
    { symbol: 'SOL', name: 'Solana', price: 98.32, change24h: 3.21, volume24h: 2100000000 },
    { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.01, volume24h: 45000000000 }
  ]);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: p.price * (1 + (Math.random() - 0.5) * 0.002),
        change24h: p.change24h + (Math.random() - 0.5) * 0.5
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900/50 border-y border-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
          {prices.map((crypto, index) => (
            <div key={index} className="flex items-center gap-3 min-w-fit">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{crypto.symbol}</span>
                <span className="text-gray-500 text-sm">/USD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  ${crypto.price.toFixed(crypto.symbol === 'BTC' ? 0 : crypto.symbol === 'ETH' ? 2 : 4)}
                </span>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  crypto.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {crypto.change24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(crypto.change24h).toFixed(2)}%
                </div>
              </div>
              {index < prices.length - 1 && (
                <div className="w-px h-8 bg-gray-800" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
