import { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  Zap,
  DollarSign,
  Clock,
  Cpu,
  BarChart3,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface HashrateStat {
  time: string;
  hashrate: number;
}

interface RewardStat {
  time: string;
  btc: number;
  usd: number;
}

export default function MiningStatsDashboard() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '1y'>('7d');
  const [hashrateData, setHashrateData] = useState<HashrateStat[]>([]);
  const [rewardsData, setRewardsData] = useState<RewardStat[]>([]);

  // Generate mock data
  useEffect(() => {
    const now = Date.now();
    const generateHashrateData = () => {
      const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : timeRange === '30d' ? 30 : 365;
      const interval = timeRange === '24h' ? 3600000 : timeRange === '7d' ? 3600000 : timeRange === '30d' ? 86400000 : 86400000;

      return Array.from({ length: points }, (_, i) => ({
        time: new Date(now - (points - i) * interval).toLocaleString(),
        hashrate: 150 + Math.random() * 50 + Math.sin(i / 10) * 20
      }));
    };

    const generateRewardsData = () => {
      const points = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 12;
      const interval = timeRange === '24h' ? 3600000 : 86400000;

      return Array.from({ length: points }, (_, i) => {
        const btc = 0.00015 + Math.random() * 0.00005;
        return {
          time: new Date(now - (points - i) * interval).toLocaleDateString(),
          btc,
          usd: btc * 43250
        };
      });
    };

    setHashrateData(generateHashrateData());
    setRewardsData(generateRewardsData());
  }, [timeRange]);

  const currentHashrate = 187.5;
  const totalMiners = 24;
  const activeMiners = 23;
  const avgEfficiency = 22.3;
  const dailyRewards = 0.00147;
  const weeklyRewards = 0.01029;
  const monthlyROI = 12.4;

  const getMaxHashrate = () => Math.max(...hashrateData.map(d => d.hashrate));
  const getMinHashrate = () => Math.min(...hashrateData.map(d => d.hashrate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mining Statistics</h2>
          <p className="text-gray-400">Real-time performance and earnings overview</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          {(['24h', '7d', '30d', '1y'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md font-semibold transition-all ${
                timeRange === range
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Cpu className="w-8 h-8 text-blue-400" />
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">{currentHashrate} TH/s</div>
          <div className="text-sm text-gray-400">Total Hashrate</div>
          <div className="text-xs text-green-400 mt-2">+5.2% from last period</div>
        </div>

        <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-8 h-8 text-amber-400" />
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">{avgEfficiency} W/TH</div>
          <div className="text-sm text-gray-400">Avg Efficiency</div>
          <div className="text-xs text-green-400 mt-2">Optimal performance</div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-400" />
            <ArrowUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">{dailyRewards.toFixed(5)} BTC</div>
          <div className="text-sm text-gray-400">Daily Rewards</div>
          <div className="text-xs text-gray-500 mt-2">≈ ${(dailyRewards * 43250).toFixed(2)} USD</div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400 mb-1">{monthlyROI}%</div>
          <div className="text-sm text-gray-400">Monthly ROI</div>
          <div className="text-xs text-green-400 mt-2">Above target</div>
        </div>
      </div>

      {/* Hashrate Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold">Hashrate Performance</h3>
            <p className="text-sm text-gray-400">
              Peak: {getMaxHashrate().toFixed(1)} TH/s • Low: {getMinHashrate().toFixed(1)} TH/s
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-400">Hashrate</span>
            </div>
          </div>
        </div>

        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 1000 200" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 50}
                x2="1000"
                y2={i * 50}
                stroke="#374151"
                strokeWidth="1"
              />
            ))}

            {/* Gradient fill */}
            <defs>
              <linearGradient id="hashrate-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Line path */}
            <path
              d={hashrateData.map((point, i) => {
                const x = (i / (hashrateData.length - 1)) * 1000;
                const y = 200 - ((point.hashrate - 100) / 100) * 200;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* Area fill */}
            <path
              d={`
                ${hashrateData.map((point, i) => {
                  const x = (i / (hashrateData.length - 1)) * 1000;
                  const y = 200 - ((point.hashrate - 100) / 100) * 200;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ')}
                L 1000 200 L 0 200 Z
              `}
              fill="url(#hashrate-gradient)"
            />
          </svg>
        </div>
      </div>

      {/* Miners Status */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Active Miners</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">Total Miners</span>
              </div>
              <span className="text-2xl font-bold">{totalMiners}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-gray-400">Active</span>
              </div>
              <span className="text-xl font-bold text-green-400">{activeMiners}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-400">Offline</span>
              </div>
              <span className="text-xl font-bold text-gray-500">{totalMiners - activeMiners}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-gray-400">Uptime</span>
              </div>
              <span className="text-xl font-bold text-amber-400">99.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">Rewards Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <span className="text-gray-400">Daily Average</span>
              <div className="text-right">
                <div className="font-bold">{dailyRewards.toFixed(5)} BTC</div>
                <div className="text-xs text-gray-500">${(dailyRewards * 43250).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <span className="text-gray-400">Weekly Total</span>
              <div className="text-right">
                <div className="font-bold">{weeklyRewards.toFixed(5)} BTC</div>
                <div className="text-xs text-gray-500">${(weeklyRewards * 43250).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-700">
              <span className="text-gray-400">Monthly Est.</span>
              <div className="text-right">
                <div className="font-bold">{(weeklyRewards * 4.33).toFixed(5)} BTC</div>
                <div className="text-xs text-gray-500">${(weeklyRewards * 4.33 * 43250).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-400">Total Lifetime</span>
              <div className="text-right">
                <div className="font-bold text-green-400">0.3847 BTC</div>
                <div className="text-xs text-gray-500">$16,638.48</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
