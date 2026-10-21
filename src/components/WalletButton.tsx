import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { useWalletConnection } from '@/hooks/web3';
import { formatAddress } from '@/lib/web3/utils';

export function WalletButton() {
  const { address, isConnected, connect, disconnect, connectors, isPending, isCorrectChain } =
    useWalletConnection();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {!isCorrectChain && (
          <div className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            Wrong Network
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#D2A44C]/10 border border-[#D2A44C]/20 rounded-lg">
          <Wallet className="w-4 h-4 text-[#D2A44C]" />
          <span className="text-sm font-medium text-white">{formatAddress(address)}</span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.id}
          onClick={() => connect(connector.id)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-[#D2A44C] hover:bg-[#D2A44C]/90 text-[#0A1122] rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wallet className="w-4 h-4" />
          {isPending ? 'Connecting...' : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
