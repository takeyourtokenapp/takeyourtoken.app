import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Thermometer,
  Gauge
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserMiners, calculateEstimatedDailyReward, type MinerNFT } from '../utils/minerRegistry';

interface MinerPerformance {
  totalHashrate: number;
  averageEfficiency: number;
  estimatedDailyBtc: number;
  estimatedDailyUsd: number;
  activeMiners: number;
  totalMiners: number;
  topMiner: MinerNFT | null;
  performanceChange: number;
}

const BTC_PRICE = 100000;
const NETWORK_HASHRATE_TH = 700000000000;

export default function MinerPerformanceWidget() {
  const { user } = useAuth();
  const [performance, setPerformance] = useState<MinerPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadPerformance();
    }
  }, [user?.id]);

  async function loadPerformance() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const miners = await getUserMiners(user.id);

      const activeMiners = miners.filter(m => m.status === 'active');
      const totalHashrate = activeMiners.reduce((sum, m) => sum + m.powerTh, 0);
      const avgEfficiency = activeMiners.length > 0
        ? activeMiners.reduce((sum, m) => sum + m.efficiencyWTh, 0) / activeMiners.length
        : 0;

      let estimatedDailyBtc = 0;
      for (const miner of activeMiners) {
        const dailyReward = calculateEstimatedDailyReward(
          miner.powerTh,
          miner.efficiencyWTh,
          BTC_PRICE,
          NETWORK_HASHRATE_TH
        );
        estimatedDailyBtc += dailyReward.netBtc;
      }

      const topMiner = activeMiners.length > 0
        ? activeMiners.reduce((top, m) => m.powerTh > (top?.powerTh || 0) ? m : top, activeMiners[0])
        : null;

      setPerformance({
        totalHashrate,
        averageEfficiency: avgEfficiency,
        estimatedDailyBtc,
        estimatedDailyUsd: estimatedDailyBtc * BTC_PRICE,
        activeMiners: activeMiners.length,
        totalMiners: miners.length,
        topMiner,
        performanceChange: 2.4
      });
    } catch (error) {
      console.error('Failed to load miner performance:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!performance || performance.totalMiners === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <h3 className="font-semibold">Miner Performance</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Cpu className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-center mb-4">No miners found</p>
          <Link
            to="/app/marketplace"
            className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold hover:bg-amber-500/30 transition-all"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold">Miner Performance</h3>
            <p className="text-xs text-gray-400">Real-time mining statistics</p>
          </div>
        </div>
        <Link
          to="/app/miners"
          className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1"
        >
          Details <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatBox
          icon={Cpu}
          label="Total Hashrate"
          value={`${performance.totalHashrate.toFixed(2)} TH/s`}
          trend={performance.performanceChange}
        />
        <StatBox
          icon={Gauge}
          label="Avg Efficiency"
          value={`${performance.averageEfficiency.toFixed(1)} W/TH`}
          color="blue"
        />
        <StatBox
          icon={TrendingUp}
          label="Est. Daily"
          value={`${performance.estimatedDailyBtc.toFixed(8)} BTC`}
          subValue={`$${performance.estimatedDailyUsd.toFixed(2)}`}
          color="green"
        />
        <StatBox
          icon={Activity}
          label="Active Miners"
          value={`${performance.activeMiners}/${performance.totalMiners}`}
          color="cyan"
        />
      </div>

      {performance.topMiner && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400">Top Performer</div>
                <div className="font-semibold">{performance.topMiner.model || `Miner #${performance.topMiner.id.slice(0, 6)}`}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-amber-400">{performance.topMiner.powerTh} TH/s</div>
              <div className="text-sm text-gray-400">{performance.topMiner.efficiencyWTh} W/TH</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color = 'amber'
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  color?: 'amber' | 'blue' | 'green' | 'cyan';
}) {
  const colorClasses = {
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    cyan: 'text-cyan-400'
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
        {trend !== undefined && (
          <span className={`text-xs flex items-center gap-0.5 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className={`font-bold ${colorClasses[color]}`}>{value}</div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}
