import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallets, useAggregatedBalances, useLedgerHistory } from '../../hooks/useAPI';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Network,
  History,
  TrendingUp,
  Zap
} from 'lucide-react';
import WalletBalance from '../../components/wallet/WalletBalance';
import WalletDeposit from '../../components/wallet/WalletDeposit';
import WalletWithdraw from '../../components/wallet/WalletWithdraw';
import WalletSwap from '../../components/wallet/WalletSwap';
import WalletBridge from '../../components/wallet/WalletBridge';
import WalletHistory from '../../components/wallet/WalletHistory';

type WalletTab = 'balance' | 'deposit' | 'withdraw' | 'swap' | 'bridge' | 'history';

interface TabConfig {
  id: WalletTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  gradient: string;
}

const TABS: TabConfig[] = [
  {
    id: 'balance',
    label: 'Balance',
    icon: WalletIcon,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-600/20'
  },
  {
    id: 'deposit',
    label: 'Deposit',
    icon: ArrowDownLeft,
    color: 'text-green-400',
    gradient: 'from-green-500/20 to-emerald-600/20'
  },
  {
    id: 'withdraw',
    label: 'Withdraw',
    icon: ArrowUpRight,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-600/20'
  },
  {
    id: 'swap',
    label: 'Swap',
    icon: ArrowRightLeft,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-pink-600/20'
  },
  {
    id: 'bridge',
    label: 'Bridge',
    icon: Network,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-blue-600/20'
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    color: 'text-gray-400',
    gradient: 'from-gray-500/20 to-slate-600/20'
  }
];

export default function WalletUnified() {
  const { user } = useAuth();
  const { data: wallets = [], isLoading, refetch } = useWallets(user?.id);
  const { data: aggregatedBalances = [] } = useAggregatedBalances(user?.id);
  const { data: ledgerHistory = [] } = useLedgerHistory(user?.id, { limit: 50 });

  const [activeTab, setActiveTab] = useState<WalletTab>('balance');

  const totalBalance = aggregatedBalances.reduce((sum, balance) => {
    const usdValue = parseFloat(balance.usd_value || '0');
    return sum + usdValue;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <WalletIcon size={28} className="text-white" />
            </div>
            Ecosystem Wallet
          </h1>
          <p className="text-gray-400 mt-2">Unified wallet for all your crypto needs</p>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30 rounded-xl p-6 min-w-[280px]">
          <div className="text-sm text-gray-400 mb-1">Total Portfolio Value</div>
          <div className="text-3xl font-bold text-white flex items-center gap-2">
            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <Zap size={12} />
            +5.2% (24h)
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-2 backdrop-blur-sm">
        <div className="grid grid-cols-6 gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center gap-2 py-4 px-4 rounded-lg transition-all duration-200
                  ${isActive
                    ? `bg-gradient-to-br ${tab.gradient} border border-current/30 shadow-lg scale-105`
                    : 'hover:bg-gray-700/50 border border-transparent'
                  }
                `}
              >
                <Icon size={24} className={isActive ? tab.color : 'text-gray-500'} />
                <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'balance' && (
          <WalletBalance
            onSelectAsset={(asset) => {
              setActiveTab('deposit');
            }}
          />
        )}

        {activeTab === 'deposit' && (
          <WalletDeposit
            onSuccess={refetch}
          />
        )}

        {activeTab === 'withdraw' && (
          <WalletWithdraw
            onSuccess={refetch}
          />
        )}

        {activeTab === 'swap' && (
          <WalletSwap
            onSuccess={refetch}
          />
        )}

        {activeTab === 'bridge' && (
          <WalletBridge
            onSuccess={refetch}
          />
        )}

        {activeTab === 'history' && (
          <WalletHistory />
        )}
      </div>
    </div>
  );
}
