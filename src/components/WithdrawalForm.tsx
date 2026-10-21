import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Shield, TrendingDown, Loader2, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface WithdrawalLimits {
  kyc_tier: number;
  limits: {
    min_amount: number;
    max_amount: number;
    daily_limit: number;
    weekly_limit: number;
    monthly_limit: number;
    requires_approval: boolean;
  };
  today_used: number;
  today_remaining: number;
  can_withdraw: boolean;
}

interface WithdrawalFormProps {
  availableAssets: Array<{
    asset: string;
    balance: number;
  }>;
  onSuccess: () => void;
}

export function WithdrawalForm({ availableAssets, onSuccess }: WithdrawalFormProps) {
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [networkCode, setNetworkCode] = useState('BTC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadWithdrawalLimits();
  }, []);

  const loadWithdrawalLimits = async () => {
    setIsLoadingLimits(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_withdrawal_stats', {
        p_user_id: user.id
      });

      if (error) throw error;

      const stats = typeof data === 'string' ? JSON.parse(data) : data;
      setLimits(stats);
    } catch (error) {
      console.error('Error loading limits:', error);
      showToast('Failed to load withdrawal limits', 'error');
    } finally {
      setIsLoadingLimits(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !destinationAddress) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (limits && amountNum > limits.today_remaining) {
      showToast(`Amount exceeds daily limit. Available: ${limits.today_remaining}`, 'error');
      return;
    }

    const asset = availableAssets.find(a => a.asset === selectedAsset);
    if (!asset || amountNum > asset.balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-withdrawal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            asset: selectedAsset,
            amount: amountNum,
            destination_address: destinationAddress,
            network_code: networkCode,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      if (result.status === 'pending') {
        showToast('Withdrawal request submitted for admin approval', 'info');
      } else {
        showToast('Withdrawal processed successfully!', 'success');
      }

      setAmount('');
      setDestinationAddress('');
      loadWithdrawalLimits();
      onSuccess();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      showToast(error.message || 'Withdrawal failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFee = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    return amountNum * 0.01;
  };

  const calculateNetAmount = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return 0;
    return amountNum - calculateFee();
  };

  const getKycTierInfo = (tier: number) => {
    const tiers = [
      { name: 'Not Verified', color: 'text-red-400', bgColor: 'bg-red-500/10' },
      { name: 'Basic KYC', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
      { name: 'Advanced KYC', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
      { name: 'Full KYC', color: 'text-green-400', bgColor: 'bg-green-500/10' },
    ];
    return tiers[tier] || tiers[0];
  };

  const selectedBalance = availableAssets.find(a => a.asset === selectedAsset)?.balance || 0;

  return (
    <div className="space-y-6">
      {/* KYC Tier & Limits Card */}
      {isLoadingLimits ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Loading limits...</span>
        </div>
      ) : limits ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${getKycTierInfo(limits.kyc_tier).bgColor} flex items-center justify-center`}>
                <Shield className={`w-6 h-6 ${getKycTierInfo(limits.kyc_tier).color}`} />
              </div>
              <div>
                <div className="font-bold text-white">{getKycTierInfo(limits.kyc_tier).name}</div>
                <div className="text-sm text-gray-400">Tier {limits.kyc_tier}</div>
              </div>
            </div>
            {limits.limits.requires_approval && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">Requires Approval</span>
              </div>
            )}
          </div>

          {/* Limits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Today Used</div>
              <div className="text-lg font-bold text-white">${limits.today_used.toFixed(2)}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Today Remaining</div>
              <div className="text-lg font-bold text-green-400">${limits.today_remaining.toFixed(2)}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Daily Limit</div>
              <div className="text-lg font-bold text-white">${limits.limits.daily_limit.toLocaleString()}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Per Transaction</div>
              <div className="text-xs text-gray-400">
                ${limits.limits.min_amount} - ${limits.limits.max_amount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Warning if can't withdraw */}
          {!limits.can_withdraw && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-300">
                Daily withdrawal limit reached. Limit resets at midnight UTC.
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Withdrawal Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Withdraw Funds</h3>

        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Asset
          </label>
          <select
            value={selectedAsset}
            onChange={(e) => {
              setSelectedAsset(e.target.value);
              setNetworkCode(e.target.value);
            }}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            {availableAssets.map(asset => (
              <option key={asset.asset} value={asset.asset}>
                {asset.asset} (Available: {asset.balance.toFixed(8)})
              </option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
            <button
              type="button"
              onClick={() => setAmount(selectedBalance.toString())}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded hover:bg-yellow-500/30 transition-colors"
            >
              MAX
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Available: {selectedBalance.toFixed(8)} {selectedAsset}</span>
            {limits && (
              <span>Min: ${limits.limits.min_amount} | Max: ${limits.limits.max_amount.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Destination Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Destination Address
          </label>
          <input
            type="text"
            value={destinationAddress}
            onChange={(e) => setDestinationAddress(e.target.value)}
            placeholder="Enter wallet address"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Network Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Network
          </label>
          <select
            value={networkCode}
            onChange={(e) => setNetworkCode(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ERC-20)</option>
            <option value="TRON">Tron (TRC-20)</option>
            <option value="BSC">Binance Smart Chain (BEP-20)</option>
            <option value="SOL">Solana</option>
          </select>
        </div>

        {/* Fee Breakdown */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-4 bg-gray-900/50 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Withdrawal Amount:</span>
              <span className="text-white font-medium">{parseFloat(amount).toFixed(8)} {selectedAsset}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Network Fee (1%):</span>
              <span className="text-yellow-400 font-medium">{calculateFee().toFixed(8)} {selectedAsset}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between font-bold">
              <span className="text-white">You Will Receive:</span>
              <span className="text-green-400">{calculateNetAmount().toFixed(8)} {selectedAsset}</span>
            </div>
          </div>
        )}

        {/* Important Notice */}
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-300">
            <div className="font-semibold text-yellow-400 mb-1">Important:</div>
            <ul className="space-y-1">
              <li>• Double-check the destination address and network</li>
              <li>• Withdrawals are irreversible once processed</li>
              <li>• Processing time: 10-30 minutes</li>
              {limits?.limits.requires_approval && <li>• Tier {limits.kyc_tier} requires admin approval</li>}
            </ul>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !limits?.can_withdraw || !amount || !destinationAddress}
          className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <TrendingDown className="w-5 h-5" />
              {limits?.limits.requires_approval ? 'Submit for Approval' : 'Withdraw Now'}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
