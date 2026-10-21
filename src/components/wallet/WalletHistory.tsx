import { useState, useMemo } from 'react';
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Network,
  Filter,
  Download,
  Search,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLedgerHistory } from '../../hooks/useAPI';
import type { LedgerEntry } from '../../types/database';

const ENTRY_TYPE_ICONS: Record<string, any> = {
  'deposit': ArrowDownLeft,
  'withdrawal': ArrowUpRight,
  'swap': ArrowRightLeft,
  'bridge': Network,
  'reward': CheckCircle2,
  'fee': XCircle,
  'stake': CheckCircle2,
  'unstake': ArrowUpRight
};

const ENTRY_TYPE_COLORS: Record<string, string> = {
  'deposit': 'text-green-400',
  'withdrawal': 'text-orange-400',
  'swap': 'text-blue-400',
  'bridge': 'text-purple-400',
  'reward': 'text-gold-400',
  'fee': 'text-red-400',
  'stake': 'text-cyan-400',
  'unstake': 'text-amber-400'
};

const STATUS_COLORS: Record<string, string> = {
  'completed': 'text-green-400 bg-green-900/20 border-green-500/50',
  'pending': 'text-amber-400 bg-amber-900/20 border-amber-500/50',
  'failed': 'text-red-400 bg-red-900/20 border-red-500/50'
};

interface WalletHistoryProps {
  compact?: boolean;
  limit?: number;
}

export default function WalletHistory({ compact = false, limit }: WalletHistoryProps) {
  const { user } = useAuth();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: entries, isLoading, refetch } = useLedgerHistory(user?.id, {
    limit: limit || 100,
    entryType: filterType !== 'all' ? filterType : undefined,
    currency: filterCurrency !== 'all' ? filterCurrency : undefined
  });

  const filteredEntries = useMemo(() => {
    if (!entries) return [];

    let filtered = [...entries];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.currency.toLowerCase().includes(query) ||
        entry.entry_type.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) ||
        entry.reference_id?.toLowerCase().includes(query)
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.created_at) >= new Date(dateFrom));
    }

    if (dateTo) {
      filtered = filtered.filter(entry => new Date(entry.created_at) <= new Date(dateTo));
    }

    return filtered;
  }, [entries, searchQuery, dateFrom, dateTo]);

  const currencies = useMemo(() => {
    if (!entries) return [];
    const unique = new Set(entries.map(e => e.currency));
    return Array.from(unique).sort();
  }, [entries]);

  const entryTypes = useMemo(() => {
    if (!entries) return [];
    const unique = new Set(entries.map(e => e.entry_type));
    return Array.from(unique).sort();
  }, [entries]);

  const handleExport = () => {
    if (!filteredEntries || filteredEntries.length === 0) return;

    const csv = [
      ['Date', 'Type', 'Currency', 'Amount', 'Balance', 'Description'].join(','),
      ...filteredEntries.map(entry => [
        new Date(entry.created_at).toISOString(),
        entry.entry_type,
        entry.currency,
        entry.amount,
        entry.balance_after,
        entry.description || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes}m ago`;
      }
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const TransactionRow = ({ entry }: { entry: LedgerEntry }) => {
    const Icon = ENTRY_TYPE_ICONS[entry.entry_type] || History;
    const color = ENTRY_TYPE_COLORS[entry.entry_type] || 'text-gray-400';
    const isCredit = parseFloat(entry.amount) > 0;

    return (
      <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
        <div className={`w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-white capitalize">
              {entry.entry_type.replace('_', ' ')}
            </div>
            {entry.reference_id && (
              <span className="text-xs text-gray-500 font-mono truncate max-w-[100px]">
                #{entry.reference_id.slice(0, 8)}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400 truncate">
            {entry.description || `${entry.entry_type} transaction`}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatDate(entry.created_at)}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-lg font-semibold ${isCredit ? 'text-green-400' : 'text-gray-300'}`}>
            {isCredit ? '+' : ''}{parseFloat(entry.amount).toFixed(entry.currency === 'BTC' ? 8 : 4)} {entry.currency}
          </div>
          <div className="text-xs text-gray-500">
            Balance: {parseFloat(entry.balance_after || '0').toFixed(entry.currency === 'BTC' ? 8 : 4)}
          </div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No transactions yet
          </div>
        ) : (
          filteredEntries.slice(0, limit || 5).map((entry) => (
            <TransactionRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <History className="text-gray-300" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Transaction History</h2>
              <p className="text-sm text-gray-400">
                {filteredEntries.length} transaction{filteredEntries.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <Loader2 size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleExport}
              disabled={filteredEntries.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Export CSV"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {entryTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Currency</label>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Currencies</option>
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {(filterType !== 'all' || filterCurrency !== 'all' || searchQuery || dateFrom || dateTo) && (
            <button
              onClick={() => {
                setFilterType('all');
                setFilterCurrency('all');
                setSearchQuery('');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Transactions Found</h3>
              <p className="text-gray-400">
                {searchQuery || filterType !== 'all' || filterCurrency !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Your transaction history will appear here'}
              </p>
            </div>
          ) : (
            <>
              {filteredEntries.map((entry) => (
                <TransactionRow key={entry.id} entry={entry} />
              ))}

              {filteredEntries.length >= (limit || 100) && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-400">
                    Showing {filteredEntries.length} transactions. Use filters to refine results.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
