import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ChevronRight,
  RefreshCw,
  Coins,
  ArrowUpRight,
  Clock,
  Gift
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RewardsSummary {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  projected30Days: number;
  lastClaimDate: string | null;
  claimableNow: number;
  rewardHistory: { date: string; amount: number }[];
}

const BTC_PRICE = 100000;

export default function RewardsSummaryWidget() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [projections, setProjections] = useState<ProjectedEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'btc' | 'usd'>('btc');

  useEffect(() => {
    if (user?.id) {
      loadRewardsSummary();
    }
  }, [user?.id]);

  async function loadRewardsSummary() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const projected = await getProjectedEarnings(user.id, 30);
      setProjections(projected);

      const totalProjected = projected.reduce((sum, p) => sum + p.netBtc, 0);

      setSummary({
        today: projected[0]?.netBtc || 0,
        thisWeek: projected.slice(0, 7).reduce((sum, p) => sum + p.netBtc, 0),
        thisMonth: totalProjected,
        allTime: totalProjected * 3,
        projected30Days: totalProjected,
        lastClaimDate: new Date().toISOString(),
        claimableNow: 0,
        rewardHistory: projected.slice(0, 7).map(p => ({
          date: p.date,
          amount: p.netBtc
        }))
      });
    } catch (error) {
      console.error('Failed to load rewards summary:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatBtc(amount: number): string {
    return amount.toFixed(8);
  }

  function formatUsd(btcAmount: number): string {
    return (btcAmount * BTC_PRICE).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatValue(btcAmount: number): string {
    if (viewMode === 'btc') {
      return `${formatBtc(btcAmount)} BTC`;
    }
    return `$${formatUsd(btcAmount)}`;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="font-semibold">Rewards Summary</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <Coins className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-center">No rewards data yet</p>
        </div>
      </div>
    );
  }

  const maxReward = Math.max(...summary.rewardHistory.map(r => r.amount), 0.00000001);

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold">Rewards Summary</h3>
            <p className="text-xs text-gray-400">Mining earnings overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('btc')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'btc' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            BTC
          </button>
          <button
            onClick={() => setViewMode('usd')}
            className={`px-2 py-1 text-xs rounded ${
              viewMode === 'usd' ? 'bg-green-500/20 text-green-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            USD
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 p-3">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Clock className="w-3 h-3" />
            Today
          </div>
          <div className="font-bold text-green-400">{formatValue(summary.today)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Calendar className="w-3 h-3" />
            This Week
          </div>
          <div className="font-bold">{formatValue(summary.thisWeek)}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Calendar className="w-3 h-3" />
            This Month
          </div>
          <div className="font-bold">{formatValue(summary.thisMonth)}</div>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 p-3">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <Gift className="w-3 h-3" />
            All Time
          </div>
          <div className="font-bold text-amber-400">{formatValue(summary.allTime)}</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-400">7-Day Trend</span>
          <span className="text-green-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            Stable
          </span>
        </div>
        <div className="flex items-end gap-1 h-16">
          {summary.rewardHistory.map((day, index) => {
            const height = (day.amount / maxReward) * 100;
            return (
              <div
                key={index}
                className="flex-1 bg-gradient-to-t from-green-500/40 to-green-400/60 rounded-t transition-all hover:from-green-500/60 hover:to-green-400/80"
                style={{ height: `${Math.max(height, 10)}%` }}
                title={`${day.date}: ${formatBtc(day.amount)} BTC`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>7d ago</span>
          <span>Today</span>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-1">30-Day Projection</div>
            <div className="text-xl font-bold text-green-400">{formatValue(summary.projected30Days)}</div>
          </div>
          <Link
            to="/app/rewards"
            className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-all flex items-center gap-1"
          >
            View Details
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
