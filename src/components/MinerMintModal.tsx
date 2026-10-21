import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useMinerNFT } from '@/hooks/web3/useMinerNFT';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface MinerMintModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionData: {
    name: string;
    symbol: string;
    base_hashrate: number;
    base_efficiency: number;
    floor_price: number;
    floor_price_currency: string;
  };
}

interface MintStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  txHash?: string;
}

export function MinerMintModal({ isOpen, onClose, collectionId, collectionData }: MinerMintModalProps) {
  const { address, isConnected } = useAccount();
  const { mintMiner, isLoading, error: web3Error } = useMinerNFT();
  const { showToast } = useToast();

  const [minerName, setMinerName] = useState('');
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);
  const [steps, setSteps] = useState<MintStep[]>([
    { id: 'approve', label: 'Approve Payment', status: 'pending' },
    { id: 'mint', label: 'Mint NFT Miner', status: 'pending' },
    { id: 'database', label: 'Register in Database', status: 'pending' },
    { id: 'complete', label: 'Miner Ready', status: 'pending' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMinting, setIsMinting] = useState(false);

  useEffect(() => {
    if (isOpen && isConnected) {
      estimateGasCost();
    }
  }, [isOpen, isConnected]);

  const estimateGasCost = async () => {
    try {
      // Estimate gas for minting
      const gasEstimate = await window.ethereum?.request({
        method: 'eth_estimateGas',
        params: [{
          from: address,
          to: import.meta.env.VITE_MINER_NFT_ADDRESS,
          data: '0x', // Mint function call data
        }],
      });

      if (gasEstimate) {
        const gasInEth = (parseInt(gasEstimate, 16) * 50) / 1e18; // Assuming 50 gwei
        setEstimatedGas(gasInEth.toFixed(6));
      }
    } catch (err) {
      console.error('Gas estimation failed:', err);
      setEstimatedGas('0.001'); // Fallback estimate
    }
  };

  const updateStepStatus = (stepId: string, status: MintStep['status'], txHash?: string) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, status, txHash } : step
    ));
  };

  const handleMint = async () => {
    if (!isConnected || !address) {
      showToast('Please connect your wallet first', 'error');
      return;
    }

    if (!minerName.trim()) {
      showToast('Please enter a name for your miner', 'error');
      return;
    }

    setIsMinting(true);
    setCurrentStep(0);

    try {
      // Step 1: Approve payment (if using ERC20)
      updateStepStatus('approve', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate approval
      updateStepStatus('approve', 'completed');
      setCurrentStep(1);

      // Step 2: Mint NFT on blockchain
      updateStepStatus('mint', 'processing');
      const result = await mintMiner({
        to: address,
        hashrate: collectionData.base_hashrate,
        efficiency: collectionData.base_efficiency,
        powerLevel: 1,
      });

      if (!result.success || !result.tokenId) {
        throw new Error('Minting failed');
      }

      updateStepStatus('mint', 'completed', result.transactionHash);
      setCurrentStep(2);

      // Step 3: Register in database
      updateStepStatus('database', 'processing');

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get user's profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Insert miner into database
      const { error: dbError } = await supabase
        .from('nft_miners')
        .insert({
          token_id: result.tokenId.toString(),
          owner_id: profile.id,
          collection_id: collectionId,
          name: minerName,
          hashrate: collectionData.base_hashrate,
          efficiency: collectionData.base_efficiency,
          power_level: 1,
          maintenance_rate: collectionData.base_hashrate * 0.5, // $0.50 per TH/s per day
          purchase_price: collectionData.floor_price,
          purchase_currency: collectionData.floor_price_currency,
          status: 'active',
        });

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error('Failed to register miner in database');
      }

      updateStepStatus('database', 'completed');
      setCurrentStep(3);

      // Step 4: Complete
      updateStepStatus('complete', 'completed');

      showToast('Miner minted successfully!', 'success');

      // Wait a bit before closing
      setTimeout(() => {
        onClose();
        // Refresh the page or update miners list
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error('Minting error:', err);
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error');
      }
      showToast(err.message || 'Failed to mint miner', 'error');
    } finally {
      setIsMinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-yellow-500/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">Mint {collectionData.symbol} Miner</h2>
            <p className="text-sm text-gray-400 mt-1">{collectionData.name}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isMinting}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Miner Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Hashrate</div>
              <div className="text-xl font-bold text-yellow-400">{collectionData.base_hashrate} TH/s</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Efficiency</div>
              <div className="text-xl font-bold text-green-400">{collectionData.base_efficiency} W/TH</div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-400">Price</div>
              <div className="text-xl font-bold text-white">
                ${collectionData.floor_price.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Miner Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Miner Name
            </label>
            <input
              type="text"
              value={minerName}
              onChange={(e) => setMinerName(e.target.value)}
              placeholder={`My ${collectionData.symbol} Miner`}
              disabled={isMinting}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
              maxLength={50}
            />
          </div>

          {/* Gas Estimate */}
          {estimatedGas && (
            <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <div className="text-sm text-gray-300">Estimated Gas Fee</div>
                <div className="text-lg font-bold text-blue-400">{estimatedGas} MATIC</div>
              </div>
            </div>
          )}

          {/* Minting Steps */}
          {isMinting && (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    step.status === 'completed'
                      ? 'bg-green-500/10 border-green-500/30'
                      : step.status === 'processing'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : step.status === 'error'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : step.status === 'processing' ? (
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin flex-shrink-0" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <div className={`font-medium ${
                      step.status === 'completed' ? 'text-green-400' :
                      step.status === 'processing' ? 'text-yellow-400' :
                      step.status === 'error' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </div>
                    {step.txHash && (
                      <a
                        href={`${import.meta.env.VITE_POLYGON_EXPLORER}/tx/${step.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline"
                      >
                        View Transaction
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-yellow-400">Wallet Not Connected</div>
                <div className="text-sm text-gray-400 mt-1">
                  Please connect your Web3 wallet to mint miners
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {web3Error && !isMinting && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-400">Minting Failed</div>
                <div className="text-sm text-gray-400 mt-1">{web3Error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            NFT will be minted to: <span className="text-white font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isMinting}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleMint}
              disabled={!isConnected || isMinting || !minerName.trim()}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isMinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Mint Miner
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
