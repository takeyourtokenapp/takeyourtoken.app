import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeftRight, Info, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Network {
  code: string;
  name: string;
  icon: string;
  tokens: string[];
}

const NETWORKS: Network[] = [
  { code: 'SOL', name: 'Solana', icon: '◎', tokens: ['SOL', 'TYT', 'USDT'] },
  { code: 'ETH', name: 'Ethereum', icon: 'Ξ', tokens: ['ETH', 'USDT', 'wBTC'] },
  { code: 'BSC', name: 'BNB Chain', icon: '⬡', tokens: ['BNB', 'USDT', 'TYT'] },
  { code: 'MATIC', name: 'Polygon', icon: '⬢', tokens: ['MATIC', 'USDT', 'TYT'] },
  { code: 'TRX', name: 'TRON', icon: '⬣', tokens: ['TRX', 'USDT'] },
  { code: 'AVAX', name: 'Avalanche', icon: '🔺', tokens: ['AVAX', 'USDT'] },
  { code: 'TON', name: 'TON', icon: '💎', tokens: ['TON', 'USDT'] },
];

export default function Bridge() {
  const { user } = useAuth();
  const [fromNetwork, setFromNetwork] = useState<Network>(NETWORKS[0]);
  const [toNetwork, setToNetwork] = useState<Network>(NETWORKS[1]);
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('5-10');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      loadTransfers();
    }
  }, [user]);

  useEffect(() => {
    // Calculate estimated fee based on networks
    const baseFee = 0.5; // 0.5% base fee
    const networkFee = 0.2; // Additional network fee
    setEstimatedFee(baseFee + networkFee);
  }, [fromNetwork, toNetwork, selectedToken]);

  const loadTransfers = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('cross_chain_transfers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setTransfers(data);
    }
  };

  const handleSwapNetworks = () => {
    const temp = fromNetwork;
    setFromNetwork(toNetwork);
    setToNetwork(temp);
  };

  const handleBridge = async () => {
    if (!user || !amount || !toAddress) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('cross_chain_transfers')
        .insert({
          user_id: user.id,
          from_blockchain: fromNetwork.code.toLowerCase(),
          to_blockchain: toNetwork.code.toLowerCase(),
          token_symbol: selectedToken,
          amount: parseFloat(amount),
          bridge_fee: (parseFloat(amount) * estimatedFee) / 100,
          from_address: 'auto-generated', // Will be filled by backend
          to_address: toAddress,
          bridge_provider: 'wormhole',
          status: 'initiated',
        })
        .select()
        .single();

      if (error) throw error;

      alert('Bridge transfer initiated! Check history for status updates.');
      setAmount('');
      setToAddress('');
      loadTransfers();
    } catch (error: any) {
      console.error('Bridge error:', error);
      alert(error.message || 'Bridge transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const availableTokens = fromNetwork.tokens.filter(token =>
    toNetwork.tokens.includes(token)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'bridging': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Cross-Chain Bridge</h1>
        <p className="text-gray-400">Transfer assets between different blockchains seamlessly</p>
      </div>

      {/* Bridge Interface */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-8 border border-gray-700/50">
        <div className="space-y-6">
          {/* From Network */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">From Network</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {NETWORKS.map((network) => (
                <button
                  key={network.code}
                  onClick={() => network.code !== toNetwork.code && setFromNetwork(network)}
                  disabled={network.code === toNetwork.code}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    fromNetwork.code === network.code
                      ? 'border-[#D2A44C] bg-[#D2A44C]/10'
                      : network.code === toNetwork.code
                      ? 'border-gray-700/50 bg-gray-800/30 opacity-50 cursor-not-allowed'
                      : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{network.icon}</div>
                  <div className="text-sm font-medium text-white">{network.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapNetworks}
              className="p-3 rounded-full bg-gray-800 border border-gray-700 hover:border-[#D2A44C] hover:bg-gray-700 transition-all"
            >
              <ArrowLeftRight className="w-5 h-5 text-[#D2A44C]" />
            </button>
          </div>

          {/* To Network */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">To Network</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {NETWORKS.map((network) => (
                <button
                  key={network.code}
                  onClick={() => network.code !== fromNetwork.code && setToNetwork(network)}
                  disabled={network.code === fromNetwork.code}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    toNetwork.code === network.code
                      ? 'border-[#D2A44C] bg-[#D2A44C]/10'
                      : network.code === fromNetwork.code
                      ? 'border-gray-700/50 bg-gray-800/30 opacity-50 cursor-not-allowed'
                      : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                  }`}
                >
                  <div className="text-2xl mb-2">{network.icon}</div>
                  <div className="text-sm font-medium text-white">{network.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Token</label>
            <div className="flex gap-3">
              {availableTokens.map((token) => (
                <button
                  key={token}
                  onClick={() => setSelectedToken(token)}
                  className={`px-6 py-3 rounded-lg border-2 transition-all ${
                    selectedToken === token
                      ? 'border-[#D2A44C] bg-[#D2A44C]/10 text-white'
                      : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D2A44C]"
            />
          </div>

          {/* Destination Address */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Destination Address on {toNetwork.name}
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder={`Enter ${toNetwork.name} address`}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D2A44C]"
            />
          </div>

          {/* Bridge Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Bridge Fee:</span>
                  <span className="text-white font-medium">{estimatedFee}%</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Estimated Time:</span>
                  <span className="text-white font-medium">{estimatedTime} minutes</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Bridge Provider:</span>
                  <span className="text-white font-medium">Wormhole</span>
                </div>
                {amount && (
                  <div className="pt-2 border-t border-blue-500/20">
                    <div className="flex justify-between text-gray-300">
                      <span>You will receive:</span>
                      <span className="text-white font-medium">
                        ~{(parseFloat(amount) * (1 - estimatedFee / 100)).toFixed(6)} {selectedToken}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bridge Button */}
          <button
            onClick={handleBridge}
            disabled={loading || !amount || !toAddress || parseFloat(amount) <= 0}
            className="w-full py-4 bg-gradient-to-r from-[#D2A44C] to-yellow-600 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-[#D2A44C]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Bridge {selectedToken}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Transfer History */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Transfer History</h2>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[#D2A44C] hover:text-yellow-400 text-sm"
          >
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>

        {showHistory && (
          <div className="space-y-3">
            {transfers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No bridge transfers yet
              </div>
            ) : (
              transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {transfer.amount} {transfer.token_symbol}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-400 text-sm">
                          {transfer.from_blockchain.toUpperCase()} → {transfer.to_blockchain.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(transfer.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 ${getStatusColor(transfer.status)}`}>
                      {getStatusIcon(transfer.status)}
                      <span className="text-sm font-medium capitalize">{transfer.status}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
