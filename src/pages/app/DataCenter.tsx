import { useState, useEffect } from 'react';
import {
  Server,
  Cpu,
  Thermometer,
  Zap,
  Wifi,
  MapPin,
  Activity,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Globe,
  Clock
} from 'lucide-react';
import EcosystemStatus from '../../components/EcosystemStatus';

interface DataCenterStatus {
  id: string;
  name: string;
  location: string;
  country: string;
  status: 'online' | 'maintenance' | 'offline';
  hashrate: number;
  temperature: number;
  efficiency: number;
  uptime: number;
  miners: number;
}

interface LiveMetric {
  timestamp: string;
  hashrate: number;
  power: number;
}

export default function DataCenter() {
  const [dataCenters, setDataCenters] = useState<DataCenterStatus[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalHashrate: 0,
    totalMiners: 0,
    avgEfficiency: 0,
    avgUptime: 0
  });

  useEffect(() => {
    loadDataCenters();
    const interval = setInterval(updateLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  function loadDataCenters() {
    const centers: DataCenterStatus[] = [
      {
        id: 'us-east',
        name: 'US East Coast',
        location: 'Virginia',
        country: 'USA',
        status: 'online',
        hashrate: 85.5,
        temperature: 42,
        efficiency: 28.5,
        uptime: 99.97,
        miners: 1250
      },
      {
        id: 'us-west',
        name: 'US West Coast',
        location: 'Oregon',
        country: 'USA',
        status: 'online',
        hashrate: 72.3,
        temperature: 38,
        efficiency: 26.8,
        uptime: 99.99,
        miners: 980
      },
      {
        id: 'eu-north',
        name: 'EU Nordic',
        location: 'Stockholm',
        country: 'Sweden',
        status: 'online',
        hashrate: 45.8,
        temperature: 35,
        efficiency: 24.2,
        uptime: 99.95,
        miners: 620
      },
      {
        id: 'eu-central',
        name: 'EU Central',
        location: 'Frankfurt',
        country: 'Germany',
        status: 'maintenance',
        hashrate: 38.2,
        temperature: 40,
        efficiency: 27.1,
        uptime: 98.5,
        miners: 520
      },
      {
        id: 'asia-east',
        name: 'Asia Pacific',
        location: 'Singapore',
        country: 'Singapore',
        status: 'online',
        hashrate: 52.1,
        temperature: 45,
        efficiency: 29.3,
        uptime: 99.92,
        miners: 710
      },
      {
        id: 'canada',
        name: 'Canada North',
        location: 'Quebec',
        country: 'Canada',
        status: 'online',
        hashrate: 68.9,
        temperature: 32,
        efficiency: 23.5,
        uptime: 99.98,
        miners: 890
      }
    ];

    setDataCenters(centers);
    setSelectedCenter(centers[0].id);

    const total = {
      totalHashrate: centers.reduce((sum, c) => sum + c.hashrate, 0),
      totalMiners: centers.reduce((sum, c) => sum + c.miners, 0),
      avgEfficiency: centers.reduce((sum, c) => sum + c.efficiency, 0) / centers.length,
      avgUptime: centers.reduce((sum, c) => sum + c.uptime, 0) / centers.length
    };
    setTotalStats(total);

    const metrics: LiveMetric[] = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - (19 - i) * 60000).toISOString(),
      hashrate: total.totalHashrate + (Math.random() - 0.5) * 10,
      power: total.totalHashrate * total.avgEfficiency * (0.95 + Math.random() * 0.1)
    }));
    setLiveMetrics(metrics);
  }

  function updateLiveMetrics() {
    setLiveMetrics(prev => {
      const newMetric: LiveMetric = {
        timestamp: new Date().toISOString(),
        hashrate: totalStats.totalHashrate + (Math.random() - 0.5) * 10,
        power: totalStats.totalHashrate * totalStats.avgEfficiency * (0.95 + Math.random() * 0.1)
      };
      return [...prev.slice(1), newMetric];
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-400 bg-green-500/20';
      case 'maintenance': return 'text-amber-400 bg-amber-500/20';
      case 'offline': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const selectedCenterData = dataCenters.find(c => c.id === selectedCenter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Server className="w-8 h-8 text-blue-400" />
            Data Center Network
          </h1>
          <p className="text-gray-400 mt-1">Real-time monitoring of global mining infrastructure</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full">
            <Activity className="w-4 h-4" />
            Live
          </div>
          <span className="text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <Globe className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400 mb-1">
            {dataCenters.length}
          </div>
          <div className="text-sm text-gray-400">Active Data Centers</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Cpu className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400 mb-1">
            {totalStats.totalHashrate.toFixed(1)} TH/s
          </div>
          <div className="text-sm text-gray-400">Total Hashrate</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Server className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">
            {totalStats.totalMiners.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Active Miners</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            {totalStats.avgUptime.toFixed(2)}%
          </div>
          <div className="text-sm text-gray-400">Network Uptime</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Live Hashrate Feed
          </h3>
          <div className="h-48 flex items-end gap-1">
            {liveMetrics.map((metric, index) => {
              const height = ((metric.hashrate / (totalStats.totalHashrate * 1.1)) * 100);
              return (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all duration-500"
                  style={{ height: `${height}%` }}
                  title={`${metric.hashrate.toFixed(1)} TH/s`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>20 min ago</span>
            <span>Now</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            Network Status
          </h3>
          <div className="space-y-3">
            {dataCenters.map((center) => (
              <div
                key={center.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedCenter === center.id
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'bg-gray-900/50 hover:bg-gray-900'
                }`}
                onClick={() => setSelectedCenter(center.id)}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    center.status === 'online' ? 'bg-green-400' :
                    center.status === 'maintenance' ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <span className="text-sm font-medium">{center.name}</span>
                </div>
                <span className="text-xs text-gray-400">{center.hashrate} TH/s</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCenterData && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                {selectedCenterData.name}
              </h3>
              <p className="text-sm text-gray-400">{selectedCenterData.location}, {selectedCenterData.country}</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${getStatusColor(selectedCenterData.status)}`}>
              {selectedCenterData.status === 'online' && <CheckCircle className="w-4 h-4" />}
              {selectedCenterData.status === 'maintenance' && <AlertTriangle className="w-4 h-4" />}
              {selectedCenterData.status.charAt(0).toUpperCase() + selectedCenterData.status.slice(1)}
            </div>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Cpu className="w-4 h-4" />
                Hashrate
              </div>
              <div className="text-2xl font-bold text-amber-400">{selectedCenterData.hashrate} TH/s</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Thermometer className="w-4 h-4" />
                Temperature
              </div>
              <div className={`text-2xl font-bold ${selectedCenterData.temperature > 45 ? 'text-red-400' : selectedCenterData.temperature > 40 ? 'text-amber-400' : 'text-green-400'}`}>
                {selectedCenterData.temperature}C
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Zap className="w-4 h-4" />
                Efficiency
              </div>
              <div className="text-2xl font-bold text-blue-400">{selectedCenterData.efficiency} W/TH</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Wifi className="w-4 h-4" />
                Uptime
              </div>
              <div className="text-2xl font-bold text-green-400">{selectedCenterData.uptime}%</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <Server className="w-4 h-4" />
                Miners
              </div>
              <div className="text-2xl font-bold text-white">{selectedCenterData.miners.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Server className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-lg mb-2">Enterprise-Grade Infrastructure</h4>
            <p className="text-gray-400 text-sm mb-4">
              Our data centers are strategically located across the globe to ensure optimal mining performance,
              low latency, and compliance with local regulations. All facilities are powered by renewable energy
              where possible and maintained by professional teams 24/7.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>99.9% SLA Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>24/7 Monitoring</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span>Green Energy Priority</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EcosystemStatus />
    </div>
  );
}
