import { useState } from 'react';
import { Copy, CheckCircle2, ExternalLink, QrCode, Info, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface DepositAddressCardProps {
  network: {
    network_code: string;
    network_name: string;
    native_symbol: string;
    explorer_url: string;
    chain_id?: string;
  };
  address?: string;
  qrCode?: string;
  derivationPath?: string;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

export function DepositAddressCard({
  network,
  address,
  qrCode,
  derivationPath,
  onGenerate,
  isGenerating,
}: DepositAddressCardProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const { showToast } = useToast();

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    showToast('Address copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getExplorerAddressUrl = () => {
    if (!address || !network.explorer_url) return '#';
    return `${network.explorer_url}/address/${address}`;
  };

  const getNetworkColor = (code: string) => {
    const colors: Record<string, string> = {
      BTC: 'from-orange-500 to-yellow-500',
      ETH: 'from-blue-500 to-purple-500',
      TRON: 'from-red-500 to-pink-500',
      SOL: 'from-purple-500 to-cyan-500',
      XRP: 'from-blue-400 to-cyan-400',
      BSC: 'from-yellow-500 to-orange-500',
      POLYGON: 'from-purple-600 to-pink-500',
    };
    return colors[code] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getNetworkColor(network.network_code)} flex items-center justify-center shadow-lg`}>
            <span className="text-white font-bold text-lg">
              {network.native_symbol.slice(0, 2)}
            </span>
          </div>
          <div>
            <div className="font-bold text-lg text-white">{network.network_name}</div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{network.native_symbol}</span>
              {network.chain_id && (
                <>
                  <span>•</span>
                  <span>Chain ID: {network.chain_id}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {address && (
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="Toggle QR Code"
          >
            <QrCode className="w-5 h-5 text-gray-300" />
          </button>
        )}
      </div>

      {/* Address Section */}
      {address ? (
        <div className="space-y-4">
          {/* QR Code */}
          {showQR && qrCode && (
            <div className="bg-white rounded-lg p-4 flex justify-center">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
          )}

          {/* Address Input */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block font-medium">
              Deposit Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={address}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={copyAddress}
                className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors flex items-center justify-center min-w-[48px]"
                title="Copy Address"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </button>
              <a
                href={getExplorerAddressUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center min-w-[48px]"
                title="View on Explorer"
              >
                <ExternalLink className="w-5 h-5 text-gray-300" />
              </a>
            </div>
          </div>

          {/* Derivation Path */}
          {derivationPath && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="text-gray-400 mb-1">HD Wallet Derivation Path:</div>
                <div className="font-mono text-blue-400">{derivationPath}</div>
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-300">
              <div className="font-semibold text-yellow-400 mb-1">Important:</div>
              <ul className="space-y-1 text-gray-400">
                <li>• Only send {network.native_symbol} to this address</li>
                <li>• Deposits are automatically credited after confirmations</li>
                <li>• Minimum deposit varies by network</li>
                <li>• 1% platform fee applies (30% → Foundation, 10% → Academy)</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 mb-4">
              No deposit address generated yet
            </p>
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  Generate Address
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Network Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4 text-xs">
        <div>
          <div className="text-gray-500 mb-1">Network</div>
          <div className="text-white font-medium">{network.network_name}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-1">Status</div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
