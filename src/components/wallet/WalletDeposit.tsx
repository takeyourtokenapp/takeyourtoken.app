import { useState, useEffect } from 'react';
import { ArrowDownLeft, Copy, QrCode, CheckCircle2, AlertCircle, Loader2, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSupportedNetworks,
  getDepositAddresses,
  generateDepositAddress,
  getExplorerAddressUrl,
  type BlockchainNetwork,
  type DepositAddress
} from '../../utils/blockchainDeposits';
import { useDepositFeePreview } from '../../hooks/useAPI';

const NETWORK_ASSETS: Record<string, string[]> = {
  'bitcoin': ['BTC'],
  'ethereum': ['ETH', 'USDT', 'USDC', 'TYT'],
  'polygon': ['MATIC', 'USDT', 'USDC'],
  'solana': ['SOL', 'USDT', 'TYT'],
  'tron': ['TRX', 'USDT'],
  'ripple': ['XRP'],
  'ton': ['TON', 'USDT']
};

interface WalletDepositProps {
  selectedAsset?: string;
  onSuccess?: () => void;
}

export default function WalletDeposit({ selectedAsset, onSuccess }: WalletDepositProps) {
  const { user } = useAuth();
  const [networks, setNetworks] = useState<BlockchainNetwork[]>([]);
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [selectedAssetState, setSelectedAssetState] = useState<string>(selectedAsset || 'BTC');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimateAmount, setEstimateAmount] = useState<number>(100);

  const { data: feePreview } = useDepositFeePreview(estimateAmount, selectedAssetState);

  useEffect(() => {
    loadNetworks();
    loadAddresses();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      setSelectedAssetState(selectedAsset);
      const network = findNetworkForAsset(selectedAsset);
      if (network) {
        setSelectedNetwork(network);
      }
    }
  }, [selectedAsset]);

  const loadNetworks = async () => {
    setLoading(true);
    try {
      const data = await getSupportedNetworks();
      setNetworks(data);

      if (data.length > 0 && !selectedNetwork) {
        setSelectedNetwork(data[0].network_code);
      }
    } catch (err) {
      console.error('Failed to load networks:', err);
      setError('Failed to load blockchain networks');
    } finally {
      setLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await getDepositAddresses();
      setAddresses(data);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  };

  const findNetworkForAsset = (asset: string): string => {
    for (const [network, assets] of Object.entries(NETWORK_ASSETS)) {
      if (assets.includes(asset)) {
        return network;
      }
    }
    return 'bitcoin';
  };

  const handleGenerateAddress = async () => {
    if (!selectedNetwork) return;

    setGenerating(true);
    setError(null);

    try {
      const result = await generateDepositAddress(selectedNetwork);

      if (result.success && result.address) {
        await loadAddresses();
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to generate address');
      }
    } catch (err: any) {
      console.error('Failed to generate address:', err);
      setError(err.message || 'Failed to generate deposit address');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const currentAddress = addresses.find(a => a.network_code === selectedNetwork);
  const currentNetwork = networks.find(n => n.network_code === selectedNetwork);
  const availableAssets = NETWORK_ASSETS[selectedNetwork] || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
            <ArrowDownLeft className="text-green-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Deposit Funds</h2>
            <p className="text-sm text-gray-400">Send crypto to your wallet address</p>
          </div>
        </div>

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
              {['BTC', 'ETH', 'TYT', 'USDT', 'SOL', 'TRX', 'XRP', 'TON'].map((asset) => (
                <button
                  key={asset}
                  onClick={() => {
                    setSelectedAssetState(asset);
                    const network = findNetworkForAsset(asset);
                    setSelectedNetwork(network);
                  }}
                  className={`p-3 rounded-lg font-medium transition-all ${
                    selectedAssetState === asset
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Network
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {networks
                  .filter(n => NETWORK_ASSETS[n.network_code]?.includes(selectedAssetState))
                  .map((network) => (
                    <button
                      key={network.network_code}
                      onClick={() => setSelectedNetwork(network.network_code)}
                      className={`p-4 rounded-lg text-left transition-all ${
                        selectedNetwork === network.network_code
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-semibold">{network.network_name}</div>
                      <div className="text-xs opacity-70 mt-1">
                        Min confirmations: {network.min_confirmations}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {currentAddress ? (
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Your {currentNetwork?.network_name} Address</h3>
              {currentAddress.is_verified && (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle2 size={14} />
                  Verified
                </span>
              )}
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="font-mono text-sm text-white break-all flex-1">
                  {currentAddress.address}
                </div>
                <button
                  onClick={() => handleCopyAddress(currentAddress.address)}
                  className="flex-shrink-0 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  title="Copy address"
                >
                  {copiedAddress === currentAddress.address ? (
                    <CheckCircle2 className="text-green-400" size={18} />
                  ) : (
                    <Copy className="text-gray-300" size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.open(getExplorerAddressUrl(selectedNetwork, currentAddress.address), '_blank')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <ExternalLink size={16} />
                View on Explorer
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
              >
                <QrCode size={16} />
                Show QR Code
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <button
              onClick={handleGenerateAddress}
              disabled={generating || !selectedNetwork}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {generating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating Address...
                </>
              ) : (
                <>
                  <ArrowDownLeft size={20} />
                  Generate Deposit Address
                </>
              )}
            </button>
            <p className="text-sm text-gray-400 mt-4">
              Click to generate a unique deposit address for this network
            </p>
          </div>
        )}

        {feePreview && (
          <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1 text-sm">
                <div className="font-semibold text-blue-300 mb-2">Fee Structure (10% total)</div>
                <div className="space-y-1 text-blue-200">
                  <div className="flex justify-between">
                    <span>Protocol (60%):</span>
                    <span className="font-mono">{feePreview.protocol_fee || 0} {selectedAssetState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Charity (30%):</span>
                    <span className="font-mono">{feePreview.charity_fee || 0} {selectedAssetState}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Academy (10%):</span>
                    <span className="font-mono">{feePreview.academy_fee || 0} {selectedAssetState}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-500/30 pt-2 mt-2 font-semibold">
                    <span>You receive:</span>
                    <span className="font-mono text-green-400">{feePreview.net_amount || 0} {selectedAssetState}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-amber-200">
              <div className="font-semibold mb-2">Important Notes:</div>
              <ul className="list-disc list-inside space-y-1">
                <li>Only send {selectedAssetState} to this address</li>
                <li>Sending other assets may result in permanent loss</li>
                <li>Wait for {currentNetwork?.min_confirmations || 1} confirmations before using funds</li>
                <li>A 10% deposit fee applies (60% protocol, 30% charity, 10% academy)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
