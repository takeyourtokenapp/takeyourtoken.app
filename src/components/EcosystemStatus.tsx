import { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Server,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Globe,
  Heart,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { getBurnStats, getTimeUntilNextBurn } from '../utils/burnScheduler';
import { getChainObserverStatus } from '../utils/api/walletLedgerService';

interface EcosystemMetrics {
  totalBurned: number;
  burnedLast24h: number;
  charityMintTotal: number;
  nextBurnCountdown: { days: number; hours: number; minutes: number; seconds: number };
  chainStatus: { network: string; status: string; lastBlock: number }[];
  systemHealth: 'healthy' | 'degraded' | 'down';
}

export default function EcosystemStatus() {
  const [metrics, setMetrics] = useState<EcosystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextBurn());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadMetrics() {
    try {
      const [burnStats, chainStatus] = await Promise.all([
        getBurnStats(),
        getChainObserverStatus().catch(() => [])
      ]);

      const healthyChains = chainStatus.filter(c => c.health_status === 'healthy').length;
      const totalChains = chainStatus.length || 1;
      const healthRatio = healthyChains / totalChains;

      setMetrics({
        totalBurned: burnStats.totalBurned,
        burnedLast24h: burnStats.burnedLast24h,
        charityMintTotal: burnStats.charityMintTotal,
        nextBurnCountdown: getTimeUntilNextBurn(),
        chainStatus: chainStatus.map(c => ({
          network: c.network,
          status: c.health_status,
          lastBlock: c.last_processed_block
        })),
        systemHealth: healthRatio >= 0.8 ? 'healthy' : healthRatio >= 0.5 ? 'degraded' : 'down'
      });
    } catch (error) {
      console.error('Failed to load ecosystem metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          Ecosystem Status
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            metrics?.systemHealth === 'healthy' ? 'bg-green-400 animate-pulse' :
            metrics?.systemHealth === 'degraded' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className="text-sm text-gray-400 capitalize">{metrics?.systemHealth || 'Unknown'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Flame}
          label="Total TYT Burned"
          value={formatNumber(metrics?.totalBurned || 0)}
          suffix="TYT"
          color="orange"
          trend="+2.4%"
        />
        <MetricCard
          icon={Zap}
          label="Burned (24h)"
          value={formatNumber(metrics?.burnedLast24h || 0)}
          suffix="TYT"
          color="amber"
        />
        <MetricCard
          icon={Heart}
          label="Charity Minted"
          value={formatNumber(metrics?.charityMintTotal || 0)}
          suffix="TYT"
          color="pink"
        />
        <MetricCard
          icon={Globe}
          label="Active Chains"
          value={String(metrics?.chainStatus?.filter(c => c.status === 'healthy').length || 0)}
          suffix={`/ ${metrics?.chainStatus?.length || 0}`}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold">Next Scheduled Burn</h3>
              <p className="text-sm text-gray-400">Every Tuesday at 12:00 UTC</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <CountdownBox value={countdown.days} label="Days" />
            <CountdownBox value={countdown.hours} label="Hours" />
            <CountdownBox value={countdown.minutes} label="Min" />
            <CountdownBox value={countdown.seconds} label="Sec" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Server className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold">Chain Observers</h3>
              <p className="text-sm text-gray-400">Multi-chain monitoring status</p>
            </div>
          </div>

          <div className="space-y-2">
            {(metrics?.chainStatus || []).slice(0, 5).map((chain) => (
              <div key={chain.network} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  {chain.status === 'healthy' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="capitalize">{chain.network}</span>
                </div>
                <span className="text-sm text-gray-400">
                  Block #{chain.lastBlock.toLocaleString()}
                </span>
              </div>
            ))}
            {(!metrics?.chainStatus || metrics.chainStatus.length === 0) && (
              <div className="text-center py-4 text-gray-500">
                <p>Chain observers initializing...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5 rounded-xl border border-amber-500/20 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">Ecosystem Security</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Smart Contracts Audited
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Multi-sig Treasury
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Real-time Monitoring
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  trend
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  suffix?: string;
  color: 'orange' | 'amber' | 'pink' | 'cyan' | 'green';
  trend?: string;
}) {
  const colorClasses = {
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30 text-pink-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl border p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${colorClasses[color].split(' ').pop()}`} />
        {trend && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {suffix && <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span>}
      </div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-black/30 rounded-lg p-3 text-center">
      <div className="text-2xl font-bold text-orange-400">{String(value).padStart(2, '0')}</div>
      <div className="text-xs text-gray-500 uppercase">{label}</div>
    </div>
  );
}
