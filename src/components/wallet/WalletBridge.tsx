import { useState, useEffect } from 'react';
import { Network, ArrowRight, Loader2, Info, AlertCircle, CheckCircle2, Clock, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWallets } from '../../hooks/useAPI';
import { supabase } from '../../lib/supabase';

interface Chain {
  id: string;
  name: string;
  icon: string;
  assets: string[];
  bridgeFee: number;
  estimatedTime: string;
}

const CHAINS: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: 'Ξ',
    assets: ['ETH', 'USDT', 'USDC', 'TYT'],
    bridgeFee: 0.005,
    estimatedTime: '10-15 min'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    icon: '⬣',
    assets: ['MATIC', 'USDT', 'USDC', 'TYT'],
    bridgeFee: 0.002,
    estimatedTime: '5-10 min'
  },
  {
    id: 'solana',
    name: 'Solana',
    icon: '◎',
    assets: ['SOL', 'USDT', 'TYT'],
    bridgeFee: 0.001,
    estimatedTime: '2-5 min'
  },
  {
    id: 'tron',
    name: 'TRON',
    icon: '⬣',
    assets: ['TRX', 'USDT'],
    bridgeFee: 0.001,
    estimatedTime: '3-5 min'
  },
  {
    id: 'ton',
    name: 'TON',
    icon: '💎',
    assets: ['TON', 'USDT'],
    bridgeFee: 0.002,
    estimatedTime: '5-8 min'
  }
];

interface WalletBridgeProps {
  onSuccess?: () => void;
}

export default function WalletBridge({ onSuccess }: WalletBridgeProps) {
  const { user } = useAuth();
  const { data: wallets, refetch } = useWallets(user?.id);

  const [fromChain, setFromChain] = useState('ethereum');
  const [toChain, setToChain] = useState('polygon');
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);

  const fromChainData = CHAINS.find(c => c.id === fromChain);
  const toChainData = CHAINS.find(c => c.id === toChain);

  const availableAssets = fromChainData?.assets.filter(a => toChainData?.assets.includes(a)) || [];

  useEffect(() => {
    if (!availableAssets.includes(asset) && availableAssets.length > 0) {
      setAsset(availableAssets[0]);
    }
  }, [fromChain, toChain]);

  const wallet = wallets?.find(w => w.asset === asset);
  const availableBalance = parseFloat(wallet?.balance || '0');

  const bridgeFee = fromChainData?.bridgeFee || 0;
  const amountNum = parseFloat(amount) || 0;
  const feeAmount = amountNum * bridgeFee;
  const protocolFee = feeAmount * 0.6;
  const charityFee = feeAmount * 0.3;
  const academyFee = feeAmount * 0.1;
  const netAmount = amountNum - feeAmount;

  const handleBridge = async () => {
    if (!user || !amount || !destinationAddress) {
      setError('Please fill in all fields');
      return;
    }

    if (amountNum <= 0 || amountNum > availableBalance) {
      setError('Invalid amount or insufficient balance');
      return;
    }

    if (fromChain === toChain) {
      setError('Source and destination chains must be different');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: bridgeError } = await supabase
        .from('cross_chain_transfers')
        .insert({
          user_id: user.id,
          source_chain: fromChain,
          destination_chain: toChain,
          asset,
          amount: amountNum,
          destination_address: destinationAddress,
          bridge_fee: feeAmount,
          net_amount: netAmount,
          status: 'pending',
          initiated_at: new Date().toISOString()
        });

      if (bridgeError) throw bridgeError;

      const { error: ledgerError } = await supabase.rpc('record_bridge_transfer', {
        p_user_id: user.id,
        p_asset: asset,
        p_amount: amountNum,
        p_fee: feeAmount,
        p_from_chain: fromChain,
        p_to_chain: toChain
      });

      if (ledgerError) throw ledgerError;

      setSuccess(true);
      setAmount('');
      setDestinationAddress('');
      refetch();
      onSuccess?.();

      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (err: any) {
      console.error('Bridge failed:', err);
      setError(err.message || 'Failed to initiate bridge transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const handleFlipChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Network className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Cross-Chain Bridge</h2>
            <p className="text-sm text-gray-400">Transfer assets between blockchains</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-green-200">
              Bridge transfer initiated! Estimated completion: {fromChainData?.estimatedTime}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">From Chain</span>
              <span className="text-xs text-gray-400">
                Balance: {availableBalance.toFixed(4)} {asset}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setFromChain(chain.id)}
                  disabled={chain.id === toChain}
                  className={`p-3 rounded-lg text-left transition-all ${
                    fromChain === chain.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : chain.id === toChain
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{chain.icon}</span>
                    <span className="font-semibold">{chain.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.0001"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded bg-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <button
              onClick={handleFlipChains}
              className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 border-4 border-gray-900 transition-all hover:rotate-180 duration-300"
            >
              <ArrowRight className="text-purple-400" size={20} />
            </button>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">To Chain</span>
              <span className="text-xs text-gray-400">
                Receive: {netAmount.toFixed(4)} {asset}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setToChain(chain.id)}
                  disabled={chain.id === fromChain}
                  className={`p-3 rounded-lg text-left transition-all ${
                    toChain === chain.id
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : chain.id === fromChain
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{chain.icon}</span>
                    <span className="font-semibold">{chain.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              placeholder={`Destination address on ${toChainData?.name}`}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Asset to Bridge
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableAssets.map((assetOption) => (
                <button
                  key={assetOption}
                  onClick={() => setAsset(assetOption)}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    asset === assetOption
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {assetOption}
                </button>
              ))}
            </div>
          </div>
        </div>

        {amount && parseFloat(amount) > 0 && (
          <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Bridge Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Bridge Amount:</span>
                <span className="font-mono text-white">{amountNum.toFixed(6)} {asset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bridge Fee ({(bridgeFee * 100).toFixed(1)}%):</span>
                <span className="font-mono text-purple-400">-{feeAmount.toFixed(6)} {asset}</span>
              </div>
              <div className="ml-4 space-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>• Protocol (60%):</span>
                  <span className="font-mono">{protocolFee.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>• Charity (30%):</span>
                  <span className="font-mono">{charityFee.toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>• Academy (10%):</span>
                  <span className="font-mono">{academyFee.toFixed(6)}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Time:</span>
                <span className="text-white">{fromChainData?.estimatedTime}</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-2 font-semibold">
                <span className="text-white">You will receive:</span>
                <span className="font-mono text-green-400">{netAmount.toFixed(6)} {asset}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleBridge}
          disabled={loading || !amount || !destinationAddress || parseFloat(amount) <= 0 || parseFloat(amount) > availableBalance || fromChain === toChain}
          className="w-full mt-6 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Bridging...
            </>
          ) : (
            <>
              <Network size={20} />
              Bridge {asset} to {toChainData?.name}
            </>
          )}
        </button>

        <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-200">
              <div className="font-semibold mb-2">How Bridge Works:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Assets are locked on source chain</li>
                <li>Equivalent amount minted on destination chain</li>
                <li>Fully decentralized and secure</li>
                <li>Track progress in transaction history</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-200">
              <div className="font-semibold mb-2">Important Notes:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Verify destination address carefully</li>
                <li>Bridge transfers cannot be reversed</li>
                <li>Processing time varies by network congestion</li>
                <li>Keep transaction ID for support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
