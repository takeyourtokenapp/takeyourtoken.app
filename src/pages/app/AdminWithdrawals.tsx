import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, Filter, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  to_address: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  kyc_tier: string;
  requested_at: string;
  user_email?: string;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, [filter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('withdrawal_requests')
        .select(`
          *,
          user:users(email)
        `)
        .order('requested_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setWithdrawals(
        data?.map((w: any) => ({
          ...w,
          user_email: w.user?.email
        })) || []
      );
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      showToast('Failed to load withdrawals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'processing',
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      showToast('Withdrawal approved and processing', 'success');
      fetchWithdrawals();

      // TODO: Trigger actual blockchain transaction
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      showToast('Failed to approve withdrawal', 'error');
    }
  };

  const handleReject = async (withdrawalId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          processed_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      showToast('Withdrawal rejected', 'success');
      fetchWithdrawals();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      showToast('Failed to reject withdrawal', 'error');
    }
  };

  const filteredWithdrawals = withdrawals.filter(w =>
    searchQuery === '' ||
    w.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.to_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: withdrawals.filter(w => w.status === 'pending').length,
    processing: withdrawals.filter(w => w.status === 'processing').length,
    totalAmount: withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0)
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Withdrawal Management</h1>
        <p className="text-gray-400">Review and approve user withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Pending Approval</span>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Processing</span>
            <CheckCircle className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.processing}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Total Pending Value</span>
            <span className="text-xs text-gray-500">USD</span>
          </div>
          <div className="text-3xl font-bold text-green-400">
            ${stats.totalAmount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by email or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('processing')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'processing'
                  ? 'bg-blue-500 text-black font-bold'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Processing
            </button>
          </div>
        </div>
      </div>

      {/* Withdrawals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading withdrawals...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No withdrawals found</p>
          </div>
        ) : (
          filteredWithdrawals.map((withdrawal) => (
            <WithdrawalCard
              key={withdrawal.id}
              withdrawal={withdrawal}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>
    </div>
  );
}

function WithdrawalCard({
  withdrawal,
  onApprove,
  onReject
}: {
  withdrawal: Withdrawal;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'completed':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const color = getStatusColor(withdrawal.status);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-3 py-1 bg-${color}-500/20 border border-${color}-500/50 rounded-full text-sm font-semibold text-${color}-400`}>
              {withdrawal.status.toUpperCase()}
            </div>
            <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm text-purple-400">
              {withdrawal.kyc_tier}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">User</p>
              <p className="font-semibold">{withdrawal.user_email || 'Unknown'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Amount</p>
              <p className="font-semibold text-green-400">
                {withdrawal.amount} {withdrawal.currency}
              </p>
            </div>

            <div className="md:col-span-2">
              <p className="text-sm text-gray-400 mb-1">Destination Address</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm break-all">{withdrawal.to_address}</p>
                <a
                  href={`https://blockchain.com/address/${withdrawal.to_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300"
                >
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Requested</p>
              <p className="text-sm">{new Date(withdrawal.requested_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {withdrawal.status === 'pending' && (
          <div className="flex flex-col gap-2 md:w-40">
            <button
              onClick={() => onApprove(withdrawal.id)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              <CheckCircle size={18} />
              Approve
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
            >
              <XCircle size={18} />
              Reject
            </button>
          </div>
        )}
      </div>

      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reject Withdrawal</h3>
            <p className="text-gray-400 mb-4">Please provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 mb-4"
              rows={4}
              placeholder="e.g., Insufficient KYC verification, Suspicious activity, etc."
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onReject(withdrawal.id, rejectReason);
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                disabled={!rejectReason}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
