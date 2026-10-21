import { useState, useEffect } from 'react';
import {
  Wallet,
  Bitcoin,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronRight,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAccountBalances, getLedgerHistory, type AccountBalance, type LedgerEntry } from '../utils/api/walletLedgerService';
import { useToast } from '../contexts/ToastContext';

const CURRENCY_CONFIG: Record<string, { symbol: string; color: string; decimals: number }> = {
  BTC: { symbol: 'BTC', color: 'orange', decimals: 8 },
  TYT: { symbol: 'TYT', color: 'amber', decimals: 2 },
  USDT: { symbol: 'USDT', color: 'green', decimals: 2 },
  ETH: { symbol: 'ETH', color: 'blue', decimals: 6 },
  SOL: { symbol: 'SOL', color: 'purple', decimals: 4 },
  TRX: { symbol: 'TRX', color: 'red', decimals: 2 }
};

export default function WalletBalances() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [recentActivity, setRecentActivity] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadWalletData();
    }
  }, [user?.id]);

  async function loadWalletData() {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [balanceData, historyData] = await Promise.all([
        getAccountBalances(user.id),
        getLedgerHistory(user.id, { limit: 10 })
      ]);

      setBalances(balanceData);
      setRecentActivity(historyData);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatBalance(amount: number, currency: string): string {
    const config = CURRENCY_CONFIG[currency] || { decimals: 4 };
    return amount.toFixed(config.decimals);
  }

  function getColorClass(currency: string): string {
    const config = CURRENCY_CONFIG[currency];
    if (!config) return 'text-gray-400';

    const colorMap: Record<string, string> = {
      orange: 'text-orange-400',
      amber: 'text-amber-400',
      green: 'text-green-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      red: 'text-red-400'
    };

    return colorMap[config.color] || 'text-gray-400';
  }

  function getTotalUsdValue(): number {
    return balances.reduce((total, balance) => {
      const mockPrices: Record<string, number> = {
        BTC: 100000,
        TYT: 0.001,
        USDT: 1,
        ETH: 3500,
        SOL: 200,
        TRX: 0.15
      };
      return total + (balance.total * (mockPrices[balance.currency] || 0));
    }, 0);
  }

  async function copyAddress(address: string) {
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    showToast('Address copied to clipboard', 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Portfolio Value</p>
              <h2 className="text-3xl font-bold">${getTotalUsdValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <button
            onClick={loadWalletData}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Unlock className="w-4 h-4" />
              Available
            </div>
            <div className="font-semibold">
              ${balances.reduce((sum, b) => sum + b.available * (b.currency === 'BTC' ? 100000 : b.currency === 'USDT' ? 1 : 0.001), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <Lock className="w-4 h-4" />
              Locked
            </div>
            <div className="font-semibold">
              ${balances.reduce((sum, b) => sum + b.locked * (b.currency === 'BTC' ? 100000 : b.currency === 'USDT' ? 1 : 0.001), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
              <RefreshCw className="w-4 h-4" />
              Pending
            </div>
            <div className="font-semibold">
              ${balances.reduce((sum, b) => sum + b.pending * (b.currency === 'BTC' ? 100000 : b.currency === 'USDT' ? 1 : 0.001), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-amber-400" />
          Asset Balances
        </h3>

        <div className="space-y-3">
          {balances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No balances yet</p>
              <p className="text-sm">Deposit funds to get started</p>
            </div>
          ) : (
            balances.map((balance) => (
              <div
                key={`${balance.currency}-${balance.network}`}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedCurrency === balance.currency
                    ? 'bg-gray-800 border-amber-500/50'
                    : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                }`}
                onClick={() => setSelectedCurrency(selectedCurrency === balance.currency ? null : balance.currency)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      balance.currency === 'BTC' ? 'from-orange-400 to-orange-600' :
                      balance.currency === 'TYT' ? 'from-amber-400 to-amber-600' :
                      balance.currency === 'USDT' ? 'from-green-400 to-green-600' :
                      balance.currency === 'ETH' ? 'from-blue-400 to-blue-600' :
                      balance.currency === 'SOL' ? 'from-purple-400 to-purple-600' :
                      'from-gray-400 to-gray-600'
                    } flex items-center justify-center`}>
                      {balance.currency === 'BTC' ? (
                        <Bitcoin className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-bold text-xs">{balance.currency.slice(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{balance.currency}</div>
                      <div className="text-sm text-gray-400">
                        {balance.network || 'Multi-chain'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${getColorClass(balance.currency)}`}>
                      {formatBalance(balance.total, balance.currency)} {balance.currency}
                    </div>
                    <div className="text-sm text-gray-400">
                      ${(balance.total * (balance.currency === 'BTC' ? 100000 : balance.currency === 'USDT' ? 1 : 0.001)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {selectedCurrency === balance.currency && (
                  <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Available</span>
                      <div className="font-medium">{formatBalance(balance.available, balance.currency)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Locked</span>
                      <div className="font-medium">{formatBalance(balance.locked, balance.currency)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Pending</span>
                      <div className="font-medium">{formatBalance(balance.pending, balance.currency)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            Recent Activity
          </h3>
          <button className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {recentActivity.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivity.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.credit > 0
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {entry.credit > 0 ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium capitalize">
                      {entry.entry_type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  entry.credit > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {entry.credit > 0 ? '+' : '-'}{(entry.credit || entry.debit).toFixed(6)} {entry.currency}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
