import { useState, useMemo } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, RefreshCw, Wallet, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAggregatedBalances, useWallets } from '../../hooks/useAPI';
import AssetCard from './AssetCard';

const ASSET_PRICES: Record<string, number> = {
  BTC: 95000,
  ETH: 3500,
  SOL: 140,
  TRX: 0.15,
  XRP: 2.5,
  TON: 5.5,
  TYT: 0.05,
  USDT: 1,
  USDC: 1,
  DAI: 1
};

const ASSET_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  SOL: '◎',
  TRX: '⬣',
  XRP: '✕',
  TON: '💎',
  TYT: '🦉',
  USDT: '₮',
  USDC: '$',
  DAI: '◈'
};

interface WalletBalanceProps {
  onSelectAsset?: (asset: string) => void;
  compact?: boolean;
}

export default function WalletBalance({ onSelectAsset, compact = false }: WalletBalanceProps) {
  const { user } = useAuth();
  const [hideBalances, setHideBalances] = useState(false);
  const [sortBy, setSortBy] = useState<'balance' | 'name'>('balance');

  const { data: balances, isLoading: balancesLoading, error: balancesError, refetch } = useAggregatedBalances(user?.id);
  const { data: wallets, isLoading: walletsLoading } = useWallets(user?.id);

  const totalUsdValue = useMemo(() => {
    if (!balances) return 0;
    return balances.reduce((sum, b) => sum + b.usd_value, 0);
  }, [balances]);

  const sortedBalances = useMemo(() => {
    if (!balances) return [];

    const sorted = [...balances];

    if (sortBy === 'balance') {
      sorted.sort((a, b) => b.usd_value - a.usd_value);
    } else {
      sorted.sort((a, b) => a.currency.localeCompare(b.currency));
    }

    return sorted;
  }, [balances, sortBy]);

  const totalLocked = useMemo(() => {
    if (!balances) return 0;
    return balances.reduce((sum, b) => {
      const price = ASSET_PRICES[b.currency] || 0;
      return sum + (b.locked_balance * price);
    }, 0);
  }, [balances]);

  const handleRefresh = () => {
    refetch();
  };

  if (balancesError) {
    return (
      <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl p-8 border border-red-700/50">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle size={24} />
          <div>
            <div className="font-semibold">Failed to load balances</div>
            <div className="text-sm text-red-300">Please try again later</div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="text-gold-400" size={20} />
            <h3 className="text-lg font-bold text-white">Total Balance</h3>
          </div>
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="text-3xl font-bold text-white mb-2">
          {hideBalances ? '••••••' : `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </div>

        {!hideBalances && totalLocked > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Lock size={14} />
            <span>Locked: ${totalLocked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500/20 to-amber-500/20 flex items-center justify-center">
              <Wallet className="text-gold-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Portfolio Value</h2>
              <p className="text-sm text-gray-400">Total balance across all assets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={balancesLoading}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Refresh balances"
            >
              <RefreshCw size={18} className={balancesLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              title={hideBalances ? 'Show balances' : 'Hide balances'}
            >
              {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            {hideBalances ? '••••••••' : `$${totalUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>

          {!hideBalances && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-green-400">
                <TrendingUp size={16} />
                <span>Available: ${(totalUsdValue - totalLocked).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {totalLocked > 0 && (
                <div className="flex items-center gap-2 text-gold-400">
                  <Lock size={16} />
                  <span>Locked: ${totalLocked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">Sort by:</div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('balance')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'balance'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Balance
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'name'
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Name
            </button>
          </div>
        </div>
      </div>

      {balancesLoading || walletsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-6 border border-gray-700 animate-pulse">
              <div className="h-10 w-10 bg-gray-700 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-700 rounded mb-2 w-24"></div>
              <div className="h-4 bg-gray-700 rounded w-32"></div>
            </div>
          ))}
        </div>
      ) : sortedBalances.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
          <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Assets Yet</h3>
          <p className="text-gray-400 mb-6">Start by depositing funds to your wallet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedBalances.map((balance) => {
            const wallet = wallets?.find(w => w.asset === balance.currency);
            if (!wallet) return null;

            return (
              <AssetCard
                key={balance.currency}
                wallet={wallet}
                usdPrice={ASSET_PRICES[balance.currency] || 0}
                onSelect={() => onSelectAsset?.(balance.currency)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
