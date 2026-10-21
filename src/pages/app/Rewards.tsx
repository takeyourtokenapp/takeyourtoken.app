import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  TrendingUp,
  Calendar,
  Download,
  Shield,
  CheckCircle2,
  BarChart3,
  Filter,
  Search,
  X,
  Eye,
  FileText,
  Activity,
  DollarSign
} from 'lucide-react';
import type { DailyReward, NFTMiner } from '../../types/database';

type RewardWithMiner = DailyReward & { miner?: NFTMiner };
type ModalType = 'proof' | 'chart' | null;

export default function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardWithMiner[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'net' | 'gross'>('date');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedReward, setSelectedReward] = useState<RewardWithMiner | null>(null);

  useEffect(() => {
    if (user) {
      loadRewards();
    }
  }, [user, timeRange]);

  const loadRewards = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('daily_rewards')
        .select(`
          *,
          nft_miners!inner(id, hashrate_th, owner_id, miner_model, tier, rarity)
        `)
        .eq('nft_miners.owner_id', user.id)
        .order('reward_date', { ascending: false });

      if (timeRange !== 'all') {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        query = query.gte('reward_date', cutoffDate.toISOString());
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;
      if (data) setRewards(data as any);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Miner ID', 'Hashrate (TH/s)', 'Gross BTC', 'Maintenance BTC', 'Net BTC', 'USD Value', 'Merkle Leaf'];
    const rows = filteredRewards.map(reward => [
      new Date(reward.reward_date).toLocaleDateString(),
      reward.miner_id,
      reward.hashrate_snapshot_th,
      reward.gross_btc,
      reward.maintenance_cost_btc,
      reward.net_btc,
      (parseFloat(reward.net_btc) * 95000).toFixed(2),
      reward.merkle_leaf || 'Pending'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tyt-rewards-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredRewards = rewards
    .filter(reward => {
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          reward.miner_id.toLowerCase().includes(search) ||
          reward.id.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.reward_date).getTime() - new Date(a.reward_date).getTime();
        case 'net':
          return parseFloat(b.net_btc) - parseFloat(a.net_btc);
        case 'gross':
          return parseFloat(b.gross_btc) - parseFloat(a.gross_btc);
        default:
          return 0;
      }
    });

  const totalGross = rewards.reduce((sum, r) => sum + parseFloat(r.gross_btc), 0);
  const totalMaintenance = rewards.reduce((sum, r) => sum + parseFloat(r.maintenance_cost_btc), 0);
  const totalNet = rewards.reduce((sum, r) => sum + parseFloat(r.net_btc), 0);
  const avgDailyNet = rewards.length > 0 ? totalNet / rewards.length : 0;
  const totalUSD = totalNet * 95000;

  const chartData = rewards.slice(0, 30).reverse().map(r => ({
    date: new Date(r.reward_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    net: parseFloat(r.net_btc),
    gross: parseFloat(r.gross_btc)
  }));

  const maxChartValue = Math.max(...chartData.map(d => d.gross));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading rewards...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Rewards History</h1>
          <p className="text-gray-400">Track and analyze your mining rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('chart')}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-2"
          >
            <BarChart3 size={18} />
            Charts
          </button>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-all flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-6 border border-amber-500/50">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-300 text-sm font-medium">Total Net Earnings</div>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">{totalNet.toFixed(8)}</div>
          <div className="text-sm text-gray-400">BTC</div>
          <div className="text-xs text-gray-500 mt-2">
            ≈ ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Avg Daily Net</div>
            <Calendar className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">{avgDailyNet.toFixed(8)}</div>
          <div className="text-sm text-gray-400">BTC/day</div>
          <div className="text-xs text-gray-500 mt-2">
            ≈ ${(avgDailyNet * 95000).toFixed(2)}/day
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Total Gross</div>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">{totalGross.toFixed(8)}</div>
          <div className="text-sm text-gray-400">BTC</div>
          <div className="text-xs text-gray-500 mt-2">Before maintenance</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Maintenance Costs</div>
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-red-400 mb-1">{totalMaintenance.toFixed(8)}</div>
          <div className="text-sm text-gray-400">BTC</div>
          <div className="text-xs text-gray-500 mt-2">
            {totalGross > 0 ? ((totalMaintenance / totalGross) * 100).toFixed(1) : 0}% of gross
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by miner ID..."
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="date">Sort by Date</option>
              <option value="net">Sort by Net (High to Low)</option>
              <option value="gross">Sort by Gross (High to Low)</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['7d', '30d', '90d', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                  timeRange === range
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
              </button>
            ))}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredRewards.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
          <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Rewards Found</h3>
          <p className="text-gray-400">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Your rewards will appear here once your miners start earning'}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Miner</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Hashrate</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Gross BTC</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Maintenance</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Net BTC</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">USD Value</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredRewards.map((reward) => {
                  const usdValue = parseFloat(reward.net_btc) * 95000;

                  return (
                    <tr key={reward.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        {new Date(reward.reward_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-mono text-gray-400">
                            #{reward.miner_id.slice(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold">
                        {reward.hashrate_snapshot_th} TH/s
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-green-400">
                        {parseFloat(reward.gross_btc).toFixed(8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-400">
                        -{parseFloat(reward.maintenance_cost_btc).toFixed(8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-amber-400">
                        {parseFloat(reward.net_btc).toFixed(8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-gray-300">
                        ${usdValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {reward.merkle_leaf ? (
                            <button
                              onClick={() => {
                                setSelectedReward(reward);
                                setActiveModal('proof');
                              }}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="View Merkle Proof"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          ) : (
                            <span className="text-gray-600 text-xs">Pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRewards.length > 0 && (
            <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700 flex items-center justify-between text-sm text-gray-400">
              <div>
                Showing {filteredRewards.length} reward{filteredRewards.length !== 1 ? 's' : ''}
              </div>
              <div>
                Total: {totalNet.toFixed(8)} BTC (${totalUSD.toFixed(2)})
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-400" />
          Merkle Proof Verification
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          All rewards are recorded with cryptographic Merkle proofs on the blockchain. These proofs ensure complete transparency
          and allow you to independently verify that your rewards were included in the daily Merkle root.
          Click the checkmark icon to view and verify the proof for any reward.
        </p>
      </div>

      {activeModal === 'proof' && selectedReward && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="w-6 h-6 text-green-400" />
                Merkle Proof
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Reward Date</div>
                <div className="font-semibold">{new Date(selectedReward.reward_date).toLocaleDateString()}</div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Miner ID</div>
                <div className="font-mono text-sm break-all">{selectedReward.miner_id}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Gross BTC</div>
                  <div className="font-bold text-green-400">{selectedReward.gross_btc}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Net BTC</div>
                  <div className="font-bold text-amber-400">{selectedReward.net_btc}</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Merkle Leaf</div>
                <div className="font-mono text-xs break-all text-gray-300 bg-gray-900 p-3 rounded">
                  {selectedReward.merkle_leaf || 'Not yet generated'}
                </div>
              </div>

              {selectedReward.merkle_proof && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Merkle Proof</div>
                  <div className="font-mono text-xs break-all text-gray-300 bg-gray-900 p-3 rounded max-h-32 overflow-y-auto">
                    {selectedReward.merkle_proof}
                  </div>
                </div>
              )}

              {selectedReward.merkle_root && (
                <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                  <div className="text-sm text-gray-300 mb-2">Merkle Root (On-chain)</div>
                  <div className="font-mono text-xs break-all text-green-400">
                    {selectedReward.merkle_root}
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'chart' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                Earnings Chart
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Period</div>
                  <div className="text-xl font-bold text-amber-400">
                    {timeRange === '7d' ? '7 Days' : timeRange === '30d' ? '30 Days' : timeRange === '90d' ? '90 Days' : 'All Time'}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Total Net</div>
                  <div className="text-xl font-bold text-green-400">{totalNet.toFixed(6)} BTC</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">USD Value</div>
                  <div className="text-xl font-bold text-blue-400">${totalUSD.toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Daily Earnings (Last 30 Days)</h4>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-gray-400">Gross</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <span className="text-gray-400">Net</span>
                    </div>
                  </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-1">
                  {chartData.map((item, index) => {
                    const grossHeight = (item.gross / maxChartValue) * 100;
                    const netHeight = (item.net / maxChartValue) * 100;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex flex-col items-center justify-end h-full relative">
                          <div
                            className="w-full bg-green-400/30 hover:bg-green-400/50 transition-all rounded-t relative group"
                            style={{ height: `${grossHeight}%` }}
                          >
                            <div
                              className="absolute bottom-0 w-full bg-amber-400 hover:bg-amber-500 transition-all rounded-t"
                              style={{ height: `${(netHeight / grossHeight) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 rotate-45 origin-left whitespace-nowrap">
                          {item.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setActiveModal(null)}
                className="w-full px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
