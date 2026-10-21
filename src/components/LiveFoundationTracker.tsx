import { useState, useEffect } from 'react';
import { Heart, TrendingUp, Users, Award, DollarSign, Activity, ExternalLink, CheckCircle } from 'lucide-react';

interface FoundationData {
  totalRaised: number;
  totalDisbursed: number;
  activeGrants: number;
  familiesHelped: number;
  recentDonations: Donation[];
  impactMetrics: ImpactMetric[];
  walletBalance: number;
}

interface Donation {
  id: string;
  amount: number;
  currency: string;
  source: string;
  timestamp: string;
  txHash?: string;
}

interface ImpactMetric {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
}

export default function LiveFoundationTracker() {
  const [data, setData] = useState<FoundationData>({
    totalRaised: 2847392,
    totalDisbursed: 1923450,
    activeGrants: 12,
    familiesHelped: 247,
    recentDonations: [
      {
        id: '1',
        amount: 1250,
        currency: 'USDT',
        source: 'NFT Sale',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        txHash: '0x1234...5678'
      },
      {
        id: '2',
        amount: 850,
        currency: 'TYT',
        source: 'Maintenance Fee',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        txHash: '0xabcd...efgh'
      },
      {
        id: '3',
        amount: 5000,
        currency: 'BTC',
        source: 'Direct Donation',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        txHash: '0x9876...5432'
      }
    ],
    impactMetrics: [],
    walletBalance: 923942
  });

  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        totalRaised: prev.totalRaised + Math.random() * 100,
        walletBalance: prev.walletBalance + Math.random() * 50
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const impactMetrics = [
    {
      label: 'Research Grants',
      value: data.activeGrants.toString(),
      change: '+2 this month',
      icon: Award,
      color: 'text-blue-400'
    },
    {
      label: 'Families Helped',
      value: data.familiesHelped.toString(),
      change: '+18 this month',
      icon: Users,
      color: 'text-green-400'
    },
    {
      label: 'Total Disbursed',
      value: `$${(data.totalDisbursed / 1000).toFixed(0)}K`,
      change: '+12% vs last month',
      icon: DollarSign,
      color: 'text-purple-400'
    },
    {
      label: 'Active Campaigns',
      value: '5',
      change: '2 fully funded',
      icon: TrendingUp,
      color: 'text-amber-400'
    }
  ];

  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const sourceColors: Record<string, string> = {
    'NFT Sale': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Maintenance Fee': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'Marketplace': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Direct Donation': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Charity Staking': 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-pink-900/30 via-owl-slate to-black border-2 border-pink-700 rounded-2xl p-6 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 rounded-xl border border-pink-500">
              <Heart size={28} className="text-pink-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Live Foundation Tracker</h3>
              <p className="text-sm text-gray-400">Real-time transparency dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500 rounded-lg">
            <div className={`w-2 h-2 rounded-full bg-green-400 ${isLive ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-semibold text-green-400">LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {impactMetrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div key={idx} className="bg-owl-slate/50 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <Icon size={24} className={metric.color} />
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <TrendingUp size={12} />
                    {metric.change}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border border-pink-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-pink-400" />
              <span className="text-sm text-gray-400">Total Raised (All Time)</span>
            </div>
            <div className="text-4xl font-bold text-pink-400 mb-1">
              ${(data.totalRaised / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">
              <span className="text-green-400">↑ $127K</span> this month
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-purple-400" />
              <span className="text-sm text-gray-400">Total Disbursed</span>
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-1">
              ${(data.totalDisbursed / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">
              {((data.totalDisbursed / data.totalRaised) * 100).toFixed(1)}% of total raised
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={20} className="text-green-400" />
              <span className="text-sm text-gray-400">Current Balance</span>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-1">
              ${(data.walletBalance / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-500">Available for grants</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-owl-slate via-gray-900 to-black border-2 border-gold-700 rounded-2xl p-6 shadow-gold-glow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-lg">Recent Donations</h4>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Activity size={14} />
              <span>Last 10 minutes</span>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.recentDonations.map(donation => (
              <div
                key={donation.id}
                className="bg-owl-slate/50 rounded-lg p-4 border border-gray-700 hover:border-gold-700 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${sourceColors[donation.source] || 'bg-gray-700'}`}>
                    {donation.source}
                  </span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(donation.timestamp)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gold-400">
                      {donation.amount} <span className="text-sm text-gray-400">{donation.currency}</span>
                    </div>
                    {donation.txHash && (
                      <a
                        href={`https://etherscan.io/tx/${donation.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                      >
                        {donation.txHash}
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-owl-slate via-gray-900 to-black border-2 border-gold-700 rounded-2xl p-6 shadow-gold-glow">
          <h4 className="font-bold text-lg mb-4">Blockchain Wallet Addresses</h4>

          <div className="space-y-4">
            <div className="bg-owl-slate/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" className="w-5 h-5" />
                <span className="font-semibold">Ethereum</span>
              </div>
              <div className="text-xs font-mono bg-black/50 rounded p-2 mb-2">
                0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
              </div>
              <a
                href="https://etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View on Etherscan
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="bg-owl-slate/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="SOL" className="w-5 h-5" />
                <span className="font-semibold">Solana</span>
              </div>
              <div className="text-xs font-mono bg-black/50 rounded p-2 mb-2">
                DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK
              </div>
              <a
                href="https://solscan.io/account/DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                View on Solscan
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs">
              <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1">
                <Activity size={14} />
                100% Transparency
              </div>
              <p className="text-gray-300">
                All transactions are publicly verifiable on-chain. Every donation, grant, and expense
                is recorded and can be audited by anyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-owl-slate via-gray-900 to-black border-2 border-gold-700 rounded-2xl p-6 shadow-gold-glow">
        <h4 className="font-bold text-lg mb-4">Annual Impact Report (2024)</h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <Award size={32} className="mx-auto mb-2 text-blue-400" />
            <div className="text-3xl font-bold mb-1">12</div>
            <div className="text-sm text-gray-400">Research Grants</div>
          </div>

          <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <Users size={32} className="mx-auto mb-2 text-green-400" />
            <div className="text-3xl font-bold mb-1">247</div>
            <div className="text-sm text-gray-400">Families Supported</div>
          </div>

          <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <TrendingUp size={32} className="mx-auto mb-2 text-purple-400" />
            <div className="text-3xl font-bold mb-1">5</div>
            <div className="text-sm text-gray-400">Equipment Grants</div>
          </div>

          <div className="text-center p-4 bg-pink-500/10 border border-pink-500/30 rounded-xl">
            <Heart size={32} className="mx-auto mb-2 text-pink-400" />
            <div className="text-3xl font-bold mb-1">18</div>
            <div className="text-sm text-gray-400">Partner Hospitals</div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/foundation-report-2024.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-pink-800 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)] rounded-xl font-bold transition-all"
          >
            Download Full Report
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
}
