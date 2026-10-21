import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TransactionService, { Transaction, TransactionFilters, TransactionType, TransactionStatus } from '../../utils/transactionService';
import { Download, Filter, Search, ExternalLink, ArrowUpRight, ArrowDownLeft, TrendingUp, X } from 'lucide-react';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TransactionFilters>({
    limit: 50,
    offset: 0
  });

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, filters]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    const { data } = await TransactionService.getUserTransactions(user.id, filters);
    if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const handleExportCSV = async () => {
    if (!user) return;

    const csv = await TransactionService.exportTransactionsToCSV(user.id, filters);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({ limit: 50, offset: 0 });
    setSearchQuery('');
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.description.toLowerCase().includes(query) ||
      tx.type.toLowerCase().includes(query) ||
      tx.currency.toLowerCase().includes(query) ||
      tx.tx_hash?.toLowerCase().includes(query)
    );
  });

  const getTypeIcon = (type: TransactionType) => {
    if (type === 'deposit' || type === 'mining_reward' || type === 'referral_bonus' || type === 'staking_reward') {
      return <ArrowDownLeft className="w-5 h-5 text-green-400" />;
    } else if (type === 'withdrawal') {
      return <ArrowUpRight className="w-5 h-5 text-red-400" />;
    } else {
      return <TrendingUp className="w-5 h-5 text-blue-400" />;
    }
  };

  const getAmountColor = (type: TransactionType) => {
    if (type === 'deposit' || type === 'mining_reward' || type === 'referral_bonus' || type === 'staking_reward') {
      return 'text-green-400';
    } else if (type === 'withdrawal' || type === 'maintenance_payment') {
      return 'text-red-400';
    } else {
      return 'text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-gray-400">View and export your complete transaction history</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
              filterOpen
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by description, type, currency, or TX hash..."
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Filters Panel */}
      {filterOpen && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Transaction Type</label>
              <select
                value={filters.type as string || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="mining_reward">Mining Reward</option>
                <option value="maintenance_payment">Maintenance</option>
                <option value="nft_purchase">NFT Purchase</option>
                <option value="marketplace_buy">Marketplace Buy</option>
                <option value="marketplace_sell">Marketplace Sell</option>
                <option value="upgrade">Upgrade</option>
                <option value="reinvest">Reinvest</option>
                <option value="foundation_donation">Foundation</option>
                <option value="referral_bonus">Referral</option>
                <option value="staking_reward">Staking</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status as string || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={filters.currency || ''}
                onChange={(e) => handleFilterChange('currency', e.target.value || undefined)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Currencies</option>
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="TYT">TYT Token</option>
                <option value="USDT">Tether (USDT)</option>
                <option value="USD">US Dollar</option>
                <option value="ETH">Ethereum</option>
                <option value="SOL">Solana</option>
                <option value="TRX">TRON</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-2">No transactions found</p>
            <p className="text-sm">Try adjusting your filters or make your first transaction!</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredTransactions.map((tx) => {
                    const statusDisplay = TransactionService.getTransactionStatusDisplay(tx.status);
                    const explorerUrl = tx.blockchain && tx.tx_hash
                      ? TransactionService.getBlockchainExplorerUrl(tx.blockchain, tx.tx_hash)
                      : null;

                    return (
                      <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(tx.type)}
                            <span className="font-medium">
                              {TransactionService.getTransactionTypeDisplay(tx.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-300 text-sm">{tx.description}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${getAmountColor(tx.type)}`}>
                            {TransactionService.formatAmount(tx.amount, tx.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                            ${statusDisplay.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : ''}
                            ${statusDisplay.color === 'blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : ''}
                            ${statusDisplay.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : ''}
                            ${statusDisplay.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : ''}
                            ${statusDisplay.color === 'gray' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/50' : ''}
                          `}>
                            {statusDisplay.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {new Date(tx.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {explorerUrl && (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                            >
                              View on Chain
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-800">
              {filteredTransactions.map((tx) => {
                const statusDisplay = TransactionService.getTransactionStatusDisplay(tx.status);
                const explorerUrl = tx.blockchain && tx.tx_hash
                  ? TransactionService.getBlockchainExplorerUrl(tx.blockchain, tx.tx_hash)
                  : null;

                return (
                  <div key={tx.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(tx.type)}
                        <div>
                          <div className="font-semibold">
                            {TransactionService.getTransactionTypeDisplay(tx.type)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(tx.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                        ${statusDisplay.color === 'green' ? 'bg-green-500/20 text-green-400' : ''}
                        ${statusDisplay.color === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${statusDisplay.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                        ${statusDisplay.color === 'red' ? 'bg-red-500/20 text-red-400' : ''}
                      `}>
                        {statusDisplay.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300">{tx.description}</p>

                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-lg ${getAmountColor(tx.type)}`}>
                        {TransactionService.formatAmount(tx.amount, tx.currency)}
                      </span>
                      {explorerUrl && (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 text-xs"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="bg-gray-900/50 border-t border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange('offset', Math.max(0, (filters.offset || 0) - (filters.limit || 50)))}
                  disabled={(filters.offset || 0) === 0}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('offset', (filters.offset || 0) + (filters.limit || 50))}
                  disabled={filteredTransactions.length < (filters.limit || 50)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
