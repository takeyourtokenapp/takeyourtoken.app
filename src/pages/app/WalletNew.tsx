import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallets, useAggregatedBalances } from '../../hooks/useAPI';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Network,
  History,
  TrendingUp,
  Zap
} from 'lucide-react';

import Wallet from './Wallet';
import Swap from './Swap';
import Bridge from './Bridge';

type WalletTab = 'wallet' | 'swap' | 'bridge';

interface TabConfig {
  id: WalletTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
}

const TABS: TabConfig[] = [
  {
    id: 'wallet',
    label: 'Wallet',
    description: 'View balances, deposit & withdraw',
    icon: WalletIcon,
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-orange-600/20'
  },
  {
    id: 'swap',
    label: 'Swap',
    description: 'Exchange tokens instantly',
    icon: ArrowRightLeft,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-600/20'
  },
  {
    id: 'bridge',
    label: 'Bridge',
    description: 'Cross-chain transfers',
    icon: Network,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-600/20'
  }
];

export default function WalletNew() {
  const { user } = useAuth();
  const { data: aggregatedBalances = [] } = useAggregatedBalances(user?.id);
  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');

  const totalBalance = aggregatedBalances.reduce((sum, balance) => {
    const usdValue = parseFloat(balance.usd_value || '0');
    return sum + usdValue;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Total Balance */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <WalletIcon size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ecosystem Wallet</h1>
                <p className="text-sm text-gray-400">Unified multi-chain wallet</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Total Portfolio</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-green-400 mt-1 flex items-center gap-1 justify-end">
              <TrendingUp size={14} />
              +5.2% (24h)
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-3 p-4 rounded-xl transition-all duration-200
                  ${isActive
                    ? `bg-gradient-to-br ${tab.gradient} border-2 border-current/40 shadow-lg scale-105`
                    : 'bg-gray-800/30 border-2 border-gray-700/30 hover:bg-gray-700/30 hover:border-gray-600/30'
                  }
                `}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/10' : 'bg-gray-700/50'}`}>
                  <Icon size={22} className={isActive ? tab.color : 'text-gray-500'} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>
                    {tab.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {tab.description}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'wallet' && <Wallet />}
        {activeTab === 'swap' && <Swap />}
        {activeTab === 'bridge' && <Bridge />}
      </div>
    </div>
  );
}
