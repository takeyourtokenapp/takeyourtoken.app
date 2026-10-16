import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Server, MapPin, Zap, Activity, Globe, Cpu, TrendingUp, Gauge } from 'lucide-react';

interface DataCenter {
  id: string;
  name: string;
  location: string;
  country_code: string | null;
  latitude: number | null;
  longitude: number | null;
  kwh_rate: number;
  total_capacity_th: number;
  used_capacity_th: number;
  live_stream_url: string | null;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

interface NFTMiner {
  id: string;
  token_id: number;
  name: string;
  hashrate: string;
  efficiency: string;
  status: string;
}

export default function DataCenter() {
  const { user } = useAuth();
  const [dataCenters, setDataCenters] = useState<DataCenter[]>([]);
  const [miners, setMiners] = useState<NFTMiner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDC, setSelectedDC] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [dcRes, minersRes] = await Promise.all([
        supabase.from('data_centers').select('*').order('name', { ascending: true }),
        user
          ? supabase.from('nft_miners').select('id, token_id, name, hashrate, efficiency, status').eq('user_id', user.id).limit(50)
          : Promise.resolve({ data: null, error: null })
      ]);

      if (dcRes.error) throw dcRes.error;
      setDataCenters(dcRes.data || []);
      setMiners((minersRes.data as NFTMiner[]) || []);
    } catch (error) {
      console.error('Error loading data centers:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalCapacity = dataCenters.reduce((s, dc) => s + parseFloat(String(dc.total_capacity_th)), 0);
  const usedCapacity = dataCenters.reduce((s, dc) => s + parseFloat(String(dc.used_capacity_th)), 0);
  const utilization = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
  const avgKwhRate = dataCenters.length > 0 ? dataCenters.reduce((s, dc) => s + parseFloat(String(dc.kwh_rate)), 0) / dataCenters.length : 0;
  const totalUserHashrate = miners.reduce((s, m) => s + (parseFloat(m.hashrate) || 0), 0);

  function getCountryFlag(code: string | null): string {
    if (!code || code.length !== 2) return '';
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0)));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Server className="w-8 h-8 text-gold-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Center Insights</h1>
        <p className="text-tertiary-text">Real-time analytics from TYT mining data centers across the globe</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary-text">Total Capacity</span>
            <Cpu className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{totalCapacity.toFixed(0)}</div>
          <div className="text-sm text-tertiary-text mt-1">TH/s global</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Utilization</span>
            <Gauge className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{utilization.toFixed(1)}%</div>
          <div className="text-sm text-tertiary-text mt-1">{usedCapacity.toFixed(0)} / {totalCapacity.toFixed(0)} TH/s</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Avg Electricity</span>
            <Zap className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">${avgKwhRate.toFixed(3)}</div>
          <div className="text-sm text-tertiary-text mt-1">per kWh</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Your Hashrate</span>
            <TrendingUp className="w-5 h-5 text-gold-400" />
          </div>
          <div className="text-3xl font-bold text-gold-400">{totalUserHashrate.toFixed(0)}</div>
          <div className="text-sm text-tertiary-text mt-1">TH/s from {miners.length} miners</div>
        </div>
      </div>

      {dataCenters.length === 0 ? (
        <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
          <Server className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Data Centers Available</h3>
          <p className="text-tertiary-text">Data center information will appear here when mining operations go live</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataCenters.map(dc => {
            const dcUtil = parseFloat(String(dc.total_capacity_th)) > 0
              ? (parseFloat(String(dc.used_capacity_th)) / parseFloat(String(dc.total_capacity_th))) * 100
              : 0;
            const isSelected = selectedDC === dc.id;

            return (
              <div
                key={dc.id}
                onClick={() => setSelectedDC(isSelected ? null : dc.id)}
                className={`bg-secondary rounded-xl p-6 border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-secondary hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getCountryFlag(dc.country_code)}</span>
                      <h3 className="text-lg font-bold">{dc.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-tertiary-text">
                      <MapPin className="w-3 h-3" />
                      {dc.location}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${dc.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {dc.is_active ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-tertiary-text">Capacity Used</span>
                      <span className="font-bold">{dcUtil.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.min(dcUtil, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-tertiary-text mt-1">
                      <span>{parseFloat(String(dc.used_capacity_th)).toFixed(0)} TH/s used</span>
                      <span>{parseFloat(String(dc.total_capacity_th)).toFixed(0)} TH/s total</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-tertiary rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-tertiary-text mb-1">
                      <Zap className="w-3 h-3" /> Electricity
                    </div>
                    <div className="font-bold text-green-400">${parseFloat(String(dc.kwh_rate)).toFixed(3)}/kWh</div>
                  </div>
                  <div className="bg-tertiary rounded-lg p-3">
                    <div className="flex items-center gap-1 text-xs text-tertiary-text mb-1">
                      <Activity className="w-3 h-3" /> Status
                    </div>
                    <div className="font-bold">{dc.is_active ? 'Operational' : 'Maintenance'}</div>
                  </div>
                </div>

                {dc.live_stream_url && (
                  <a
                    href={dc.live_stream_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-semibold hover:bg-blue-500/30 transition-all"
                  >
                    <Globe size={14} /> View Live Stream
                  </a>
                )}

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-secondary">
                    <h4 className="font-semibold mb-3">Your Miners in this Region</h4>
                    {miners.length === 0 ? (
                      <p className="text-sm text-tertiary-text">No miners assigned to this data center</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {miners.map(m => (
                          <div key={m.id} className="flex items-center justify-between text-sm p-2 bg-tertiary rounded-lg">
                            <div>
                              <div className="font-semibold">#{m.token_id} {m.name}</div>
                              <div className="text-xs text-tertiary-text">{parseFloat(m.hashrate).toFixed(1)} TH/s - {parseFloat(m.efficiency).toFixed(1)} W/TH</div>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              m.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
