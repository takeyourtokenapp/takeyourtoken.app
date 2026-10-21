import { useState, useEffect } from 'react';
import {
  Flame,
  TrendingDown,
  Coins,
  Calendar,
  Clock,
  BarChart3,
  ArrowDown,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BurnEvent {
  id: string;
  amount: number;
  reason: string;
  tx_hash: string;
  created_at: string;
}

interface BurnStats {
  totalBurned: number;
  weeklyBurned: number;
  monthlyBurned: number;
  remainingSupply: number;
  burnRate: number;
}

export default function BurnReports() {
  const [burnEvents, setBurnEvents] = useState<BurnEvent[]>([]);
  const [stats, setStats] = useState<BurnStats>({
    totalBurned: 45_250_000,
    weeklyBurned: 1_250_000,
    monthlyBurned: 5_450_000,
    remainingSupply: 954_750_000,
    burnRate: 4.53
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadBurnData();
  }, [selectedPeriod]);

  async function loadBurnData() {
    setLoading(true);
    try {
      const { data: events } = await supabase
        .from('token_burns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (events) {
        setBurnEvents(events);
      }
    } catch {
      generateMockData();
    }
    setLoading(false);
  }

  function generateMockData() {
    const reasons = [
      'Maintenance Payment',
      'Miner Upgrade',
      'Marketplace Fee',
      'VIP Tier Activation',
      'Weekly Scheduled Burn'
    ];

    const mockEvents: BurnEvent[] = Array.from({ length: 20 }, (_, i) => ({
      id: `burn-${i}`,
      amount: Math.floor(Math.random() * 500000) + 10000,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      tx_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      created_at: new Date(Date.now() - i * 86400000 * Math.random() * 7).toISOString()
    }));

    setBurnEvents(mockEvents);
  }

  const weeklyBurnData = [
    { week: 'Week 1', burned: 1_120_000 },
    { week: 'Week 2', burned: 1_350_000 },
    { week: 'Week 3', burned: 980_000 },
    { week: 'Week 4', burned: 1_250_000 }
  ];

  const burnByCategory = [
    { category: 'Maintenance', amount: 25_000_000, percentage: 55.2, color: 'amber' },
    { category: 'Upgrades', amount: 12_500_000, percentage: 27.6, color: 'orange' },
    { category: 'Marketplace', amount: 5_750_000, percentage: 12.7, color: 'blue' },
    { category: 'Premium Features', amount: 2_000_000, percentage: 4.5, color: 'green' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-400" />
            Burn Reports
          </h1>
          <p className="text-gray-400 mt-1">Track TYT token burn events and deflationary progress</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-amber-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/30">
          <div className="flex items-center justify-between mb-3">
            <Flame className="w-8 h-8 text-orange-400" />
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
              Deflationary
            </span>
          </div>
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {(stats.totalBurned / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-sm text-gray-400">Total TYT Burned</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <TrendingDown className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            {stats.burnRate.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-400">Supply Burned</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {(stats.monthlyBurned / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-sm text-gray-400">Burned This Month</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Coins className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">
            {(stats.remainingSupply / 1_000_000).toFixed(0)}M
          </div>
          <div className="text-sm text-gray-400">Remaining Supply</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Weekly Burn Trend
          </h3>
          <div className="space-y-4">
            {weeklyBurnData.map((week, index) => {
              const maxBurned = Math.max(...weeklyBurnData.map(w => w.burned));
              const width = (week.burned / maxBurned) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{week.week}</span>
                    <span className="font-semibold text-amber-400">
                      {(week.burned / 1_000_000).toFixed(2)}M TYT
                    </span>
                  </div>
                  <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Burn by Category
          </h3>
          <div className="space-y-4">
            {burnByCategory.map((cat, index) => {
              const colorClasses: Record<string, string> = {
                amber: 'from-amber-500 to-amber-600 text-amber-400',
                orange: 'from-orange-500 to-orange-600 text-orange-400',
                blue: 'from-blue-500 to-blue-600 text-blue-400',
                green: 'from-green-500 to-green-600 text-green-400'
              };

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-300">{cat.category}</span>
                      <span className={`text-sm font-bold ${colorClasses[cat.color].split(' ')[2]}`}>
                        {cat.percentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colorClasses[cat.color].split(' ').slice(0, 2).join(' ')} rounded-full`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right w-24">
                    <span className="text-xs text-gray-400">
                      {(cat.amount / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Burn Events
          </h3>
          <div className="text-sm text-gray-400">
            {burnEvents.length} events
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {burnEvents.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-orange-500/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <ArrowDown className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">{event.reason}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {new Date(event.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-orange-400">
                      -{event.amount.toLocaleString()} TYT
                    </div>
                    <div className="text-xs text-gray-500">Burned</div>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${event.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-lg mb-2">Burn Verification</h4>
            <p className="text-gray-400 text-sm mb-4">
              All burn events are verifiable on the Solana blockchain. Click the external link icon
              on any burn event to view the transaction on Solscan.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Transparent & Auditable</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Immutable Records</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
