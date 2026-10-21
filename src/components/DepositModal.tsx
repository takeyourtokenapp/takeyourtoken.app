import { useState, useEffect } from 'react';
import { X, Copy, CheckCircle2, QrCode, Bitcoin, DollarSign, Info, Loader2, ExternalLink, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { bitcoinService } from '../utils/api/bitcoinService';
import { lightningService } from '../utils/api/lightningService';
import {
  getSupportedNetworks,
  generateDepositAddress,
  type BlockchainNetwork
} from '../utils/blockchainDeposits';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: 'USD' | 'BTC' | 'USDT';
  onSuccess?: () => void;
}

type DepositMethod = 'bank' | 'card' | 'crypto' | 'lightning';

export function DepositModal({ isOpen, onClose, currency, onSuccess }: DepositModalProps) {
  const { user } = useAuth();
  const [depositMethod, setDepositMethod] = useState<DepositMethod>('crypto');
  const [selectedNetwork, setSelectedNetwork] = useState<BlockchainNetwork | null>(null);
  const [networks, setNetworks] = useState<BlockchainNetwork[]>([]);
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [lightningInvoice, setLightningInvoice] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addressType, setAddressType] = useState<'native_segwit' | 'taproot'>('native_segwit');

  useEffect(() => {
    if (isOpen && currency !== 'USD') {
      loadNetworks();
    }
  }, [isOpen, currency]);

  const loadNetworks = async () => {
    try {
      const networksData = await getSupportedNetworks();
      const filtered = networksData.filter(n => {
        if (currency === 'BTC') {
          return n.asset === 'BTC';
        }
        if (currency === 'USDT') {
          return n.asset === 'USDT';
        }
        return false;
      });
      setNetworks(filtered);
      if (filtered.length > 0) {
        setSelectedNetwork(filtered[0]);
      }
    } catch (error) {
      console.error('Failed to load networks:', error);
    }
  };

  const handleGenerateAddress = async () => {
    if (!user || !selectedNetwork) return;

    setLoading(true);
    try {
      if (selectedNetwork.blockchain === 'BTC' && depositMethod === 'crypto') {
        const btcAddress = await bitcoinService.generateDepositAddress(
          user.id,
          addressType,
          `${currency} Deposit`
        );
        setDepositAddress(btcAddress.address);
      } else {
        const result = await generateDepositAddress(
          user.id,
          selectedNetwork.blockchain,
          selectedNetwork.asset
        );
        setDepositAddress(result.address);
      }
      onSuccess?.();
    } catch (error) {
      console.error('Failed to generate address:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLightningInvoice = async () => {
    if (!user || !amount) return;

    setLoading(true);
    try {
      const sats = Math.floor(parseFloat(amount) * 100000000);
      const invoice = await lightningService.createInvoice({
        userId: user.id,
        amountSats: sats,
        description: 'Deposit to TYT',
        expirySeconds: 3600
      });
      setLightningInvoice(invoice.paymentRequest);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to generate Lightning invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setDepositAddress('');
    setLightningInvoice('');
    setAmount('');
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-gray-900 to-black border border-yellow-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm p-6 border-b border-yellow-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currency === 'BTC' ? (
              <Bitcoin className="w-6 h-6 text-yellow-500" />
            ) : (
              <DollarSign className="w-6 h-6 text-yellow-500" />
            )}
            <h2 className="text-2xl font-bold text-white">
              Deposit {currency}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {currency === 'USD' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDepositMethod('bank')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    depositMethod === 'bank'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-white">Bank Transfer</div>
                    <div className="text-xs text-gray-400 mt-1">1-3 business days</div>
                  </div>
                </button>

                <button
                  onClick={() => setDepositMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    depositMethod === 'card'
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-white">Card</div>
                    <div className="text-xs text-gray-400 mt-1">Instant</div>
                  </div>
                </button>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    Fiat deposits are coming soon. For now, please use crypto deposits.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currency === 'BTC' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setDepositMethod('crypto')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      depositMethod === 'crypto'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Bitcoin className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm font-medium text-white">Bitcoin</div>
                    <div className="text-xs text-gray-400 mt-1">Layer 1</div>
                  </button>

                  <button
                    onClick={() => setDepositMethod('lightning')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      depositMethod === 'lightning'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                    <div className="text-sm font-medium text-white">Lightning</div>
                    <div className="text-xs text-gray-400 mt-1">Instant</div>
                  </button>
                </div>
              )}

              {depositMethod === 'crypto' && (
                <div className="space-y-4">
                  {currency === 'BTC' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setAddressType('native_segwit')}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            addressType === 'native_segwit'
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-sm font-medium text-white">Native SegWit</div>
                          <div className="text-xs text-gray-400 mt-1">bc1q... (lowest fees)</div>
                        </button>

                        <button
                          onClick={() => setAddressType('taproot')}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            addressType === 'taproot'
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-sm font-medium text-white">Taproot</div>
                          <div className="text-xs text-gray-400 mt-1">bc1p... (most private)</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {networks.length > 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Network
                      </label>
                      <select
                        value={selectedNetwork?.id || ''}
                        onChange={(e) => {
                          const network = networks.find(n => n.id === e.target.value);
                          setSelectedNetwork(network || null);
                        }}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500"
                      >
                        {networks.map(network => (
                          <option key={network.id} value={network.id}>
                            {network.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!depositAddress ? (
                    <button
                      onClick={handleGenerateAddress}
                      disabled={loading || !selectedNetwork}
                      className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <QrCode className="w-5 h-5" />
                          Generate Deposit Address
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Your deposit address:</div>
                        <div className="p-3 bg-black/50 rounded-lg font-mono text-sm text-yellow-500 break-all mb-3">
                          {depositAddress}
                        </div>
                        <button
                          onClick={() => handleCopy(depositAddress)}
                          className="w-full px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Address
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-200">
                            Send {currency} to this address. Deposits are automatically detected and credited after confirmations.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {depositMethod === 'lightning' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Amount (BTC)
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      min="0.00000001"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.001"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500"
                    />
                  </div>

                  {!lightningInvoice ? (
                    <button
                      onClick={handleGenerateLightningInvoice}
                      disabled={loading || !amount || parseFloat(amount) <= 0}
                      className="w-full px-6 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-black disabled:text-gray-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5" />
                          Generate Lightning Invoice
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                        <div className="text-sm text-gray-400 mb-2">Lightning Invoice:</div>
                        <div className="p-3 bg-black/50 rounded-lg font-mono text-xs text-yellow-500 break-all mb-3 max-h-32 overflow-y-auto">
                          {lightningInvoice}
                        </div>
                        <button
                          onClick={() => handleCopy(lightningInvoice)}
                          className="w-full px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Invoice
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <div className="flex gap-3">
                          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-200">
                            Pay this invoice from your Lightning wallet. Payment will be instant and credited immediately.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
