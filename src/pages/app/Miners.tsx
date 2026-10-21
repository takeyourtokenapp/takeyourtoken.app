import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Cpu, Zap, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Settings, ArrowRight } from 'lucide-react';
import type { NFTMiner, MaintenanceInvoice } from '../../types/database';
import { calculateDailyMaintenanceCost, getUserDiscountTier } from '../../utils/maintenance';

export default function Miners() {
  const { user } = useAuth();
  const [miners, setMiners] = useState<NFTMiner[]>([]);
  const [invoices, setInvoices] = useState<MaintenanceInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tytBalance, setTytBalance] = useState(0);
  const [selectedMiner, setSelectedMiner] = useState<NFTMiner | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const [minersRes, invoicesRes, walletRes] = await Promise.all([
        supabase
          .from('nft_miners')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('maintenance_invoices')
          .select('*, nft_miners!inner(owner_id)')
          .eq('nft_miners.owner_id', user.id)
          .eq('status', 'pending')
          .order('due_date', { ascending: true }),
        supabase
          .from('custodial_wallets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('asset', 'TYT')
          .maybeSingle()
      ]);

      if (minersRes.data) setMiners(minersRes.data);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      if (walletRes.data) setTytBalance(parseFloat(walletRes.data.balance));
    } catch (error) {
      console.error('Error loading miners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'maintenance_due': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'delinquent': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const totalHashrate = miners.reduce((sum, m) => sum + m.hashrate_th, 0);
  const avgEfficiency = miners.length > 0
    ? miners.reduce((sum, m) => sum + m.efficiency_w_per_th, 0) / miners.length
    : 0;
  const activeMiners = miners.filter(m => m.status === 'active').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading miners...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Miners</h1>
        <p className="text-gray-400">Manage your NFT miners and maintenance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Total Miners</div>
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{miners.length}</div>
          <div className="text-xs text-gray-500 mt-2">{activeMiners} active</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Total Hashrate</div>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{totalHashrate.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-2">TH/s</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Avg Efficiency</div>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{avgEfficiency.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-2">W/TH</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Pending Invoices</div>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{invoices.length}</div>
          <div className="text-xs text-gray-500 mt-2">
            ${invoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount_usd), 0).toFixed(2)}
          </div>
        </div>
      </div>

      {invoices.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-400 mb-2">Maintenance Required</h3>
              <p className="text-gray-300 mb-4">
                You have {invoices.length} pending maintenance invoice{invoices.length !== 1 ? 's' : ''}.
                Pay to keep your miners active and earning rewards.
              </p>
              <button className="px-6 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition-all">
                Pay All (${invoices.reduce((sum, inv) => sum + parseFloat(inv.final_amount_usd), 0).toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      )}

      {miners.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
          <Cpu className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Miners Yet</h3>
          <p className="text-gray-400 mb-6">
            Purchase your first NFT miner to start earning daily BTC rewards
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/50 transition-all inline-flex items-center gap-2">
            Browse Marketplace <ArrowRight size={20} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {miners.map((miner) => {
            const dailyCost = calculateDailyMaintenanceCost({
              hashrateTerahash: miner.hashrate_th,
              efficiencyWattsPerTh: miner.efficiency_w_per_th,
              kwhPriceUsd: 0.08,
              serviceFeeUsd: 2
            });
            const discountTier = getUserDiscountTier(tytBalance, dailyCost);

            return (
              <Link
                key={miner.id}
                to={`/app/miners/${miner.id}`}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-amber-500/50 transition-all block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      Miner #{miner.id.slice(0, 8)}
                    </h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(miner.status)}`}>
                      {miner.status === 'active' && <CheckCircle2 size={14} />}
                      {miner.status === 'maintenance_due' && <AlertCircle size={14} />}
                      {miner.status}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedMiner(miner);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Hashrate</div>
                    <div className="text-lg font-bold text-amber-400">{miner.hashrate_th} TH/s</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                    <div className="text-lg font-bold text-amber-400">{miner.efficiency_w_per_th} W/TH</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Cost:</span>
                    <span className="font-semibold">${dailyCost.toFixed(2)}</span>
                  </div>
                  {discountTier && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">TYT Discount:</span>
                      <span className="font-semibold text-amber-400">{discountTier.name} ({discountTier.discountPct}%)</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reinvest:</span>
                    <span className="font-semibold">{miner.reinvest_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Maintenance:</span>
                    <span className="font-semibold">
                      {new Date(miner.last_maintenance_paid).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg font-semibold hover:bg-amber-500/30 transition-all text-sm"
                  >
                    Upgrade
                  </button>
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-600 transition-all text-sm"
                  >
                    Pay Maint.
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {selectedMiner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Miner Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reinvest Percentage</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedMiner.reinvest_percentage}
                  className="w-full"
                />
                <div className="text-sm text-gray-400 mt-1">{selectedMiner.reinvest_percentage}% of rewards</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMiner(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setSelectedMiner(null)}
                  className="flex-1 px-4 py-2 bg-amber-500 rounded-lg font-semibold hover:bg-amber-400 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
