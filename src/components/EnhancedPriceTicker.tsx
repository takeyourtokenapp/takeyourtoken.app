import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Bitcoin, DollarSign } from 'lucide-react';
import { useRealtimePrice } from '../hooks/useRealtimePrice';

interface CryptoAsset {
  symbol: string;
  name: string;
  IconComponent?: React.ComponentType<{ className?: string; size?: number }>;
  emoji?: string;
  color: string;
  gradient: string;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    IconComponent: Bitcoin,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-600/20 border-orange-500/30'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    emoji: 'Ξ',
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-600/20 border-blue-500/30'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    emoji: '◎',
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-600/20 border-purple-500/30'
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    emoji: 'Ⓑ',
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-amber-600/20 border-yellow-500/30'
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    emoji: 'Ⓧ',
    color: 'text-slate-400',
    gradient: 'from-slate-500/20 to-gray-600/20 border-slate-500/30'
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    emoji: '₳',
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-blue-600/20 border-indigo-500/30'
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    emoji: 'Ⓐ',
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-pink-600/20 border-rose-500/30'
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    emoji: '●',
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-fuchsia-600/20 border-pink-500/30'
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    emoji: 'Ⓜ',
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-purple-600/20 border-violet-500/30'
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    emoji: '⬡',
    color: 'text-sky-400',
    gradient: 'from-sky-500/20 to-blue-600/20 border-sky-500/30'
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    emoji: '🦄',
    color: 'text-fuchsia-400',
    gradient: 'from-fuchsia-500/20 to-pink-600/20 border-fuchsia-500/30'
  },
  {
    symbol: 'TON',
    name: 'Toncoin',
    emoji: '💎',
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30'
  },
  {
    symbol: 'TRX',
    name: 'Tron',
    emoji: 'Ⓣ',
    color: 'text-red-400',
    gradient: 'from-red-500/20 to-rose-600/20 border-red-500/30'
  },
  {
    symbol: 'TYT',
    name: 'TakeYourToken',
    emoji: '🦉',
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-yellow-600/20 border-amber-500/30'
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    IconComponent: DollarSign,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-600/20 border-green-500/30'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    IconComponent: DollarSign,
    color: 'text-teal-400',
    gradient: 'from-teal-500/20 to-cyan-600/20 border-teal-500/30'
  },
];

export default function EnhancedPriceTicker() {
  const btcPrice = useRealtimePrice('BTC');
  const [isPaused, setIsPaused] = useState(false);

  const mockPrices: Record<string, { price: number; change24h: number; volume24h: number }> = {
    BTC: { price: btcPrice || 95000, change24h: 5.2, volume24h: 28.5 },
    ETH: { price: 3500, change24h: 10.1, volume24h: 15.2 },
    SOL: { price: 140, change24h: 0.26, volume24h: 2.1 },
    BNB: { price: 620, change24h: 2.8, volume24h: 1.8 },
    TRX: { price: 0.15, change24h: -1.2, volume24h: 0.89 },
    XRP: { price: 2.5, change24h: 3.8, volume24h: 3.2 },
    ADA: { price: 1.05, change24h: 4.5, volume24h: 1.5 },
    AVAX: { price: 42.5, change24h: -2.1, volume24h: 0.95 },
    DOT: { price: 8.75, change24h: 1.9, volume24h: 0.67 },
    MATIC: { price: 1.15, change24h: 6.3, volume24h: 0.85 },
    LINK: { price: 18.5, change24h: 3.7, volume24h: 0.72 },
    UNI: { price: 12.8, change24h: -0.8, volume24h: 0.45 },
    TON: { price: 5.25, change24h: 7.2, volume24h: 0.38 },
    TYT: { price: 0.05, change24h: 5.2, volume24h: 0.0012 },
    USDT: { price: 1.0, change24h: 0.0, volume24h: 45.0 },
    USDC: { price: 1.0, change24h: 0.01, volume24h: 23.5 },
  };

  const duplicatedAssets = [...CRYPTO_ASSETS, ...CRYPTO_ASSETS, ...CRYPTO_ASSETS];

  return (
    <div className="bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md border-b border-gray-700/50 overflow-hidden">
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-4 py-3 ${isPaused ? '' : 'animate-scroll'}`}
          style={{
            animation: isPaused ? 'none' : 'scroll 60s linear infinite',
          }}
        >
          {duplicatedAssets.map((asset, idx) => {
            const priceData = mockPrices[asset.symbol];
            const isPositive = priceData.change24h >= 0;

            return (
              <div
                key={`${asset.symbol}-${idx}`}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-br ${asset.gradient} border backdrop-blur-sm whitespace-nowrap hover:scale-105 transition-transform duration-200`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${asset.color} bg-gray-800/50 border border-current/20`}>
                  {asset.IconComponent ? (
                    <asset.IconComponent size={18} />
                  ) : (
                    <span className="text-lg">{asset.emoji}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-bold text-white text-sm">{asset.symbol}</div>
                    <div className="text-xs text-gray-400">{asset.name}</div>
                  </div>

                  <div className="h-8 w-px bg-gray-700/50" />

                  <div className="text-right">
                    <div className="font-bold text-white text-sm">
                      ${priceData.price.toLocaleString(undefined, {
                        minimumFractionDigits: asset.symbol === 'BTC' || asset.symbol === 'ETH' ? 0 : 2,
                        maximumFractionDigits: asset.symbol === 'USDT' || asset.symbol === 'USDC' ? 2 : asset.symbol === 'TYT' ? 4 : 2
                      })}
                    </div>
                    <div className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {isPositive ? '+' : ''}{priceData.change24h.toFixed(2)}%
                    </div>
                  </div>

                  <div className="h-8 w-px bg-gray-700/50" />

                  <div className="text-xs text-gray-500">
                    <div>Vol</div>
                    <div className="font-semibold text-gray-400">${priceData.volume24h.toFixed(2)}B</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-33.333%);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
