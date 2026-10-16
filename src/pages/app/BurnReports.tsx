import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Flame, TrendingDown, BarChart3, Calendar, Download, Activity } from 'lucide-react';

interface BurnEvent {
  id: string;
  burn_type: string;
  amount_tyt: number;
  tx_hash: string | null;
  burn_address: string;
  status: string;
  burned_at: string | null;
  created_at: string;
  source_ref_type: string | null;
  metadata: Record<string, any>;
}

interface BurnReport {
  id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  total_burned: number;
  burn_by_type: Record<string, number>;
  charity_mint_amount: number;
  cumulative_total_burned: number;
  tx_hashes: string[];
}

export default function BurnReports() {
  const { user } = useAuth();
  const [events, setEvents] = useState<BurnEvent[]>([]);
  const [reports, setReports] = useState<BurnReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'events' | 'reports'>('events');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalBurned: 0,
    pendingBurn: 0,
    confirmedBurn: 0,
    charityMint: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [eventsRes, reportsRes, poolRes] = await Promise.all([
        supabase.from('burn_events').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('burn_reports').select('*').order('report_date', { ascending: false }).limit(50),
        supabase.from('burn_pool').select('amount_tyt, status').eq('status', 'pending')
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (reportsRes.error) throw reportsRes.error;

      setEvents(eventsRes.data || []);
      setReports(reportsRes.data || []);

      const confirmed = (eventsRes.data || []).filter(e => e.status === 'confirmed');
      const totalBurned = confirmed.reduce((s, e) => s + parseFloat(String(e.amount_tyt)), 0);
      const pendingBurn = (poolRes.data || []).reduce((s, p) => s + parseFloat(String(p.amount_tyt)), 0);
      const charityMint = (reportsRes.data || []).reduce((s, r) => s + parseFloat(String(r.charity_mint_amount)), 0);

      setStats({
        totalBurned,
        pendingBurn,
        confirmedBurn: confirmed.length,
        charityMint
      });
    } catch (error) {
      console.error('Error loading burn data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = filterType === 'all' ? events : events.filter(e => e.burn_type === filterType);

  const burnTypes = Array.from(new Set(events.map(e => e.burn_type)));

  function exportCSV() {
    const headers = ['Date', 'Type', 'Amount (TYT)', 'Status', 'Tx Hash'];
    const rows = filteredEvents.map(e => [
      new Date(e.created_at).toLocaleDateString(),
      e.burn_type,
      e.amount_tyt,
      e.status,
      e.tx_hash || 'N/A'
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tyt-burn-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Token Burn Reports</h1>
          <p className="text-tertiary-text">Track TYT token burns, deflationary metrics, and charity mint distributions</p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg font-semibold hover:bg-orange-500/30 transition-all flex items-center gap-2">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-6 border border-orange-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary-text">Total Burned</span>
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-400">{stats.totalBurned.toLocaleString()}</div>
          <div className="text-sm text-tertiary-text mt-1">TYT tokens</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Pending Burn Pool</span>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{stats.pendingBurn.toLocaleString()}</div>
          <div className="text-sm text-tertiary-text mt-1">TYT awaiting burn</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Confirmed Burns</span>
            <TrendingDown className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.confirmedBurn}</div>
          <div className="text-sm text-tertiary-text mt-1">events executed</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-6 border border-pink-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary-text">Charity Mint</span>
            <BarChart3 className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-pink-400">{stats.charityMint.toLocaleString()}</div>
          <div className="text-sm text-tertiary-text mt-1">TYT to foundation</div>
        </div>
      </div>

      <div className="bg-secondary rounded-xl border border-secondary overflow-hidden">
        <div className="flex border-b border-secondary">
          <button onClick={() => setActiveTab('events')} className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'events' ? 'bg-orange-500 text-white' : 'text-tertiary-text hover:bg-tertiary'}`}>
            Burn Events
          </button>
          <button onClick={() => setActiveTab('reports')} className={`flex-1 px-6 py-4 font-semibold transition-colors ${activeTab === 'reports' ? 'bg-orange-500 text-white' : 'text-tertiary-text hover:bg-tertiary'}`}>
            Weekly Reports
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'events' && (
            <>
              {burnTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === 'all' ? 'bg-orange-500 text-white' : 'bg-tertiary text-tertiary-text hover:bg-secondary'}`}>
                    All Types
                  </button>
                  {burnTypes.map(type => (
                    <button key={type} onClick={() => setFilterType(type)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === type ? 'bg-orange-500 text-white' : 'bg-tertiary text-tertiary-text hover:bg-secondary'}`}>
                      {type.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}

              {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                  <Flame className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Burn Events</h3>
                  <p className="text-tertiary-text">Burn events will appear here when maintenance payments and marketplace fees are processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-tertiary">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Type</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary">
                      {filteredEvents.map(event => (
                        <tr key={event.id} className="hover:bg-tertiary transition-colors">
                          <td className="px-6 py-4 text-sm">{new Date(event.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-semibold">
                              {event.burn_type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-orange-400">
                            {parseFloat(String(event.amount_tyt)).toLocaleString()} TYT
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              event.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                              event.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-tertiary-text truncate max-w-[200px]">
                            {event.tx_hash ? `${event.tx_hash.slice(0, 16)}...` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'reports' && (
            <>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Weekly Reports</h3>
                  <p className="text-tertiary-text">Weekly burn reports are generated automatically by the cron-weekly-burn edge function</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="bg-tertiary rounded-xl p-6 border border-secondary hover:border-orange-500/50 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold">{new Date(report.report_date).toLocaleDateString()}</span>
                            <span className="text-sm text-tertiary-text">({new Date(report.period_start).toLocaleDateString()} - {new Date(report.period_end).toLocaleDateString()})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-400">{parseFloat(String(report.total_burned)).toLocaleString()}</div>
                          <div className="text-xs text-tertiary-text">TYT burned</div>
                        </div>
                      </div>

                      {report.burn_by_type && Object.keys(report.burn_by_type).length > 0 && (
                        <div className="flex flex-wrap gap-3 mb-4">
                          {Object.entries(report.burn_by_type).map(([type, amount]) => (
                            <div key={type} className="px-3 py-2 bg-secondary rounded-lg border border-secondary">
                              <div className="text-xs text-tertiary-text">{type.replace(/_/g, ' ')}</div>
                              <div className="text-sm font-bold text-orange-400">{Number(amount).toLocaleString()} TYT</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-secondary rounded-lg p-3">
                          <div className="text-tertiary-text text-xs">Charity Mint</div>
                          <div className="font-bold text-pink-400">{parseFloat(String(report.charity_mint_amount)).toLocaleString()} TYT</div>
                        </div>
                        <div className="bg-secondary rounded-lg p-3">
                          <div className="text-tertiary-text text-xs">Cumulative Total</div>
                          <div className="font-bold text-amber-400">{parseFloat(String(report.cumulative_total_burned)).toLocaleString()} TYT</div>
                        </div>
                        <div className="bg-secondary rounded-lg p-3">
                          <div className="text-tertiary-text text-xs">Transactions</div>
                          <div className="font-bold text-blue-400">{report.tx_hashes?.length || 0}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
