import { useState, useEffect } from 'react';
import { ArrowUpRight, AlertCircle, CheckCircle2, Loader2, Shield, Info, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallets, useFeeConfiguration } from '../../hooks/useAPI';
import { supabase } from '../../lib/supabase';

const ASSET_PRICES: Record<string, number> = {
  BTC: 95000,
  ETH: 3500,
  SOL: 140,
  TRX: 0.15,
  XRP: 2.5,
  TON: 5.5,
  TYT: 0.05,
  USDT: 1
};

const MIN_WITHDRAWALS: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.001,
  SOL: 0.01,
  TRX: 1,
  XRP: 1,
  TON: 0.1,
  TYT: 1,
  USDT: 1
};

interface WalletWithdrawProps {
  selectedAsset?: string;
  onSuccess?: () => void;
}

export default function WalletWithdraw({ selectedAsset, onSuccess }: WalletWithdrawProps) {
  const { user } = useAuth();
  const { data: wallets, isLoading: walletsLoading } = useWallets(user?.id);
  const { data: feeConfig } = useFeeConfiguration('withdraw.default');

  const [asset, setAsset] = useState(selectedAsset || 'BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('mainnet');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [memo, setMemo] = useState('');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycRequired, setKycRequired] = useState(false);
  const [withdrawalLimits, setWithdrawalLimits] = useState<any>(null);

  useEffect(() => {
    if (selectedAsset) {
      setAsset(selectedAsset);
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (user) {
      checkWithdrawalLimits();
    }
  }, [user, asset]);

  const checkWithdrawalLimits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('withdrawal_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('kyc_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.kyc_status !== 'approved') {
          setKycRequired(true);
        }
      } else {
        setWithdrawalLimits(data);
      }
    } catch (err) {
      console.error('Failed to check limits:', err);
    }
  };

  const currentWallet = wallets?.find(w => w.asset === asset);
  const availableBalance = parseFloat(currentWallet?.balance || '0');
  const lockedBalance = parseFloat(currentWallet?.locked_balance || '0');
  const minWithdrawal = MIN_WITHDRAWALS[asset] || 0;

  const feePercentage = feeConfig?.[0]?.fee_bps_total ? feeConfig[0].fee_bps_total / 10000 : 0.01;
  const amountNum = parseFloat(amount) || 0;
  const feeAmount = amountNum * feePercentage;
  const protocolFee = feeAmount * 0.6;
  const charityFee = feeAmount * 0.3;
  const academyFee = feeAmount * 0.1;
  const netAmount = amountNum - feeAmount;

  const isValidAddress = address.length > 10;
  const isValidAmount = amountNum >= minWithdrawal && amountNum <= availableBalance;

  const handleWithdraw = async () => {
    if (!user || !isValidAddress || !isValidAmount) {
      setError('Please check your input values');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: withdrawError } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          asset,
          amount: amountNum,
          destination_address: address,
          network,
          memo: memo || null,
          status: 'pending',
          fee_amount: feeAmount,
          net_amount: netAmount
        })
        .select()
        .single();

      if (withdrawError) throw withdrawError;

      const { error: ledgerError } = await supabase.rpc('record_withdrawal_request', {
        p_user_id: user.id,
        p_asset: asset,
        p_amount: amountNum,
        p_fee: feeAmount,
        p_request_id: data.id
      });

      if (ledgerError) throw ledgerError;

      setSuccess(true);
      setAmount('');
      setAddress('');
      setMemo('');
      onSuccess?.();

      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('Withdrawal failed:', err);
      setError(err.message || 'Failed to process withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  if (kycRequired) {
    return (
      <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/20 rounded-xl p-8 border border-amber-500/50">
        <div className="flex items-start gap-4">
          <Shield className="text-amber-400 flex-shrink-0 mt-1" size={32} />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">KYC Verification Required</h3>
            <p className="text-amber-200 mb-4">
              To withdraw funds, you need to complete KYC verification. This is required by regulations to prevent fraud and money laundering.
            </p>
            <a
              href="/app/kyc"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold transition-all"
            >
              <Shield size={18} />
              Complete KYC Verification
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <ArrowUpRight className="text-orange-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Withdraw Funds</h2>
            <p className="text-sm text-gray-400">Send crypto to external address</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-green-200">
              Withdrawal request submitted successfully! It will be processed within 24 hours.
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Asset
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['BTC', 'ETH', 'TYT', 'USDT', 'SOL', 'TRX', 'XRP', 'TON'].map((assetOption) => {
                const wallet = wallets?.find(w => w.asset === assetOption);
                const balance = parseFloat(wallet?.balance || '0');

                return (
                  <button
                    key={assetOption}
                    onClick={() => setAsset(assetOption)}
                    disabled={balance === 0}
                    className={`p-3 rounded-lg font-medium transition-all ${
                      asset === assetOption
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                        : balance === 0
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div>{assetOption}</div>
                    <div className="text-xs opacity-70 mt-1">{balance.toFixed(4)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Available Balance
            </label>
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {availableBalance.toFixed(asset === 'BTC' ? 8 : 4)} {asset}
                  </div>
                  <div className="text-sm text-gray-400">
                    ≈ ${(availableBalance * (ASSET_PRICES[asset] || 0)).toFixed(2)} USD
                  </div>
                </div>
                {lockedBalance > 0 && (
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Locked</div>
                    <div className="text-lg font-semibold text-gold-400">
                      {lockedBalance.toFixed(asset === 'BTC' ? 8 : 4)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Withdrawal Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: ${minWithdrawal} ${asset}`}
                step={asset === 'BTC' ? '0.0001' : '0.01'}
                min={minWithdrawal}
                max={availableBalance}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
              <button
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-orange-500/20 text-orange-400 text-sm font-medium hover:bg-orange-500/30 transition-colors"
              >
                MAX
              </button>
            </div>
            {amountNum > 0 && (
              <div className="text-xs text-gray-400 mt-1">
                ≈ ${(amountNum * (ASSET_PRICES[asset] || 0)).toFixed(2)} USD
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Enter ${asset} address`}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 font-mono text-sm"
            />
          </div>

          {['XRP', 'TON'].includes(asset) && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Memo / Tag (Optional)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Enter memo or destination tag"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Network
            </label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
            >
              <option value="mainnet">Mainnet</option>
              {asset === 'BTC' && <option value="lightning">Lightning Network</option>}
              {asset === 'ETH' && <option value="polygon">Polygon</option>}
            </select>
          </div>
        </div>

        {amountNum > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-3">Transaction Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Withdrawal Amount:</span>
                <span className="font-mono text-white">{amountNum.toFixed(8)} {asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Fee (1%):</span>
                <span className="font-mono text-orange-400">-{feeAmount.toFixed(8)} {asset}</span>
              </div>
              <div className="ml-4 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>• Protocol (60%):</span>
                  <span className="font-mono">{protocolFee.toFixed(8)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>• Charity (30%):</span>
                  <span className="font-mono">{charityFee.toFixed(8)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>• Academy (10%):</span>
                  <span className="font-mono">{academyFee.toFixed(8)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2 font-semibold">
                <span className="text-white">You will receive:</span>
                <span className="font-mono text-green-400">{netAmount.toFixed(8)} {asset}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={loading || !isValidAddress || !isValidAmount}
          className="w-full py-4 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            <>
              <ArrowUpRight size={20} />
              Withdraw {asset}
            </>
          )}
        </button>

        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-200">
              <div className="font-semibold mb-2">Processing Time:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Standard withdrawals: 24-48 hours</li>
                <li>Lightning Network: Instant</li>
                <li>VIP members: Priority processing</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-200">
              <div className="font-semibold mb-2">Important Notes:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Double-check the destination address</li>
                <li>Minimum withdrawal: {minWithdrawal} {asset}</li>
                <li>Withdrawals are processed manually for security</li>
                <li>A 1% fee applies (60% protocol, 30% charity, 10% academy)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
