import { useState, useEffect } from 'react';
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  Cpu,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useBitcoinPrice } from '../hooks/useBitcoinPrice';

interface NetworkStats {
  btcPrice: number;
  btcChange24h: number;
  networkHashrate: number;
  networkDifficulty: number;
  blockHeight: number;
  mempoolSize: number;
  avgBlockTime: number;
  halving: {
    nextDate: string;
    blocksRemaining: number;
  };
}

export default function NetworkStatsWidget() {
  const { price, loading: priceLoading } = useBitcoinPrice();
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNetworkStats();
    const interval = setInterval(loadNetworkStats, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (price) {
      setStats(prev => prev ? { ...prev, btcPrice: price } : null);
    }
  }, [price]);

  async function loadNetworkStats() {
    try {
      setStats({
        btcPrice: price || 100000,
        btcChange24h: 2.34,
        networkHashrate: 700,
        networkDifficulty: 92.67,
        blockHeight: 872453,
        mempoolSize: 156,
        avgBlockTime: 9.8,
        halving: {
          nextDate: '2028-04-15',
          blocksRemaining: 157547
        }
      });
    } catch (error) {
      console.error('Failed to load network stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">Bitcoin Network</h3>
        </div>
        <a
          href="https://mempool.space"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-amber-400 flex items-center gap-1"
        >
          Live Data <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 p-3">
          <div className="text-xs text-gray-400 mb-1">BTC Price</div>
          <div className="text-lg font-bold text-amber-400">
            ${stats.btcPrice.toLocaleString()}
          </div>
          <div className={`text-xs flex items-center gap-1 ${stats.btcChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.btcChange24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(stats.btcChange24h)}%
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Network Hashrate</div>
          <div className="text-lg font-bold">{stats.networkHashrate} EH/s</div>
          <div className="text-xs text-gray-500">Global Mining Power</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Difficulty</div>
          <div className="text-lg font-bold">{stats.networkDifficulty}T</div>
          <div className="text-xs text-gray-500">Current Epoch</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Block Height</div>
          <div className="text-lg font-bold">#{stats.blockHeight.toLocaleString()}</div>
          <div className="text-xs text-gray-500">~{stats.avgBlockTime}min avg</div>
        </div>
      </div>

      <div className="mt-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-lg border border-amber-500/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm">Next Halving</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-amber-400">
              {stats.halving.blocksRemaining.toLocaleString()} blocks
            </div>
            <div className="text-xs text-gray-500">
              ~{stats.halving.nextDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
