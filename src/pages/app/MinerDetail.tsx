import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMinerDetail } from '../../hooks/useAPI';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Cpu,
  Zap,
  TrendingUp,
  DollarSign,
  Calendar,
  Settings2,
  ArrowUpCircle,
  Activity,
  MapPin,
  BarChart3,
  AlertCircle
} from 'lucide-react';

export default function MinerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading } = useMinerDetail(id);

  const [reinvestPct, setReinvestPct] = useState(data?.miner?.reinvest_percentage || 0);
  const [donatePct, setDonatePct] = useState(0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading miner details...</div>
      </div>
    );
  }

  if (!data?.miner) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
        <div className="text-xl text-gray-400 mb-2">Miner not found</div>
        <Link to="/app/miners" className="text-amber-400 hover:text-amber-300">
          Back to miners list
        </Link>
      </div>
    );
  }

  const { miner, rewards, invoices } = data;

  const last7DaysRewards = rewards.slice(0, 7);
  const totalRewards7Days = last7DaysRewards.reduce(
    (sum, r) => sum + parseFloat(r.net_btc),
    0
  );
  const avgDailyReward = totalRewards7Days / Math.max(1, last7DaysRewards.length);

  const totalMaintenanceCost = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.final_amount_usd),
    0
  );

  const dailyElectricity =
    (miner.hashrate_th * miner.efficiency_w_per_th * 24 * 0.08) / 1000;
  const dailyService = miner.hashrate_th * 0.02;
  const totalDailyCost = dailyElectricity + dailyService;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/app/miners')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Miners
        </button>
        <div className="flex items-center gap-2">
          <Link
            to={`/app/miners/${id}/upgrade`}
            className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg font-semibold hover:bg-amber-500/30 transition-all flex items-center gap-2"
          >
            <ArrowUpCircle size={18} />
            Upgrade
          </Link>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings2 size={20} />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Miner #{miner.id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  miner.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}
              >
                {miner.status}
              </div>
              {miner.farm_id && (
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <MapPin size={14} />
                  <span>Data Center #{miner.farm_id.slice(0, 6)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Total Earned</div>
            <div className="text-2xl font-bold text-green-400">
              {miner.total_rewards_btc.toFixed(8)} BTC
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <div className="text-sm text-gray-400">Hashrate</div>
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {miner.hashrate_th}
            </div>
            <div className="text-xs text-gray-500">TH/s</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <div className="text-sm text-gray-400">Efficiency</div>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {miner.efficiency_w_per_th}
            </div>
            <div className="text-xs text-gray-500">W/TH</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <div className="text-sm text-gray-400">Power Level</div>
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {miner.power_level}
            </div>
            <div className="text-xs text-gray-500">Level</div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <div className="text-sm text-gray-400">Avg Daily</div>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {avgDailyReward.toFixed(8)}
            </div>
            <div className="text-xs text-gray-500">BTC</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Rewards History (7 Days)</h2>
          </div>

          {last7DaysRewards.length > 0 ? (
            <div className="space-y-3">
              {last7DaysRewards.map((reward) => {
                const grossBTC = parseFloat(reward.gross_btc);
                const netBTC = parseFloat(reward.net_btc);
                const efficiency = ((netBTC / grossBTC) * 100).toFixed(1);

                return (
                  <div
                    key={reward.id}
                    className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-all border border-gray-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="text-sm font-semibold">
                          {new Date(reward.reward_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-green-400">
                        +{netBTC.toFixed(8)} BTC
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Gross:</span>
                        <span className="ml-1 text-gray-300">{grossBTC.toFixed(8)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Maint:</span>
                        <span className="ml-1 text-gray-300">
                          {parseFloat(reward.maintenance_cost_btc).toFixed(8)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Efficiency:</span>
                        <span className="ml-1 text-amber-400">{efficiency}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">7-Day Total</span>
                  <span className="font-bold text-green-400">
                    {totalRewards7Days.toFixed(8)} BTC
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Daily Average</span>
                  <span className="font-bold text-amber-400">
                    {avgDailyReward.toFixed(8)} BTC
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rewards yet</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold">Maintenance Breakdown</h2>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-3">Daily Cost Estimate</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Electricity
                  </span>
                  <span className="font-semibold text-white">
                    ${dailyElectricity.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Service Fee</span>
                  <span className="font-semibold text-white">
                    ${dailyService.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-700 flex justify-between">
                  <span className="font-semibold text-gray-200">Total Daily</span>
                  <span className="font-bold text-amber-400">
                    ${totalDailyCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {invoices.length > 0 && (
              <div>
                <div className="text-sm text-gray-400 mb-3">Recent Invoices</div>
                <div className="space-y-2">
                  {invoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg text-sm"
                    >
                      <div>
                        <div className="font-semibold">
                          {new Date(invoice.invoice_date).toLocaleDateString()}
                        </div>
                        <div
                          className={`text-xs ${
                            invoice.status === 'paid'
                              ? 'text-green-400'
                              : 'text-yellow-400'
                          }`}
                        >
                          {invoice.status}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          ${parseFloat(invoice.final_amount_usd).toFixed(2)}
                        </div>
                        {invoice.discount_applied_pct > 0 && (
                          <div className="text-xs text-amber-400">
                            -{invoice.discount_applied_pct}% discount
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="text-xs text-amber-400 font-semibold mb-2">
                💡 Maintenance Tip
              </div>
              <div className="text-sm text-gray-300">
                Pay with TYT tokens for up to 18% discount! Higher VIP levels get
                even better rates.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Settings2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold">Miner Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Auto-Reinvest: <span className="text-amber-400">{reinvestPct}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={reinvestPct}
              onChange={(e) => setReinvestPct(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Automatically reinvest {reinvestPct}% of rewards to upgrade this miner
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Foundation Donation: <span className="text-neon-cyan">{donatePct}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={donatePct}
              onChange={(e) => setDonatePct(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>10%</span>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Donate {donatePct}% of rewards to Brain Cancer Children's Foundation
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2 bg-amber-500 text-black rounded-lg font-semibold hover:bg-amber-400 transition-all">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
