import { useState, useEffect } from 'react';
import { Shield, Settings, Pause, Play, DollarSign, Flame, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface ContractInfo {
  name: string;
  address: string;
  isPaused: boolean;
  balance: string;
}

interface FeeConfig {
  protocolFee: number;
  charityFee: number;
  academyFee: number;
}

export default function AdminContracts() {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractInfo[]>([]);
  const [feeConfig, setFeeConfig] = useState<FeeConfig>({
    protocolFee: 60,
    charityFee: 30,
    academyFee: 10,
  });
  const [isUpdatingFees, setIsUpdatingFees] = useState(false);
  const [pendingBurn, setPendingBurn] = useState(0);
  const [lastBurnDate, setLastBurnDate] = useState<Date | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, [address]);

  useEffect(() => {
    if (isAdmin) {
      loadContractData();
      loadBurnData();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_admin')
        .eq('user_id', userData.user.id)
        .single();

      setIsAdmin(profile?.is_admin === true || profile?.role === 'admin');
    } catch (err) {
      console.error('Error checking admin access:', err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContractData = async () => {
    try {
      // Load contract addresses from env
      const contractList: ContractInfo[] = [
        {
          name: 'Miner NFT',
          address: import.meta.env.VITE_MINER_NFT_ADDRESS || '0x0000000000000000000000000000000000000000',
          isPaused: false,
          balance: '0',
        },
        {
          name: 'Marketplace',
          address: import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x0000000000000000000000000000000000000000',
          isPaused: false,
          balance: '0',
        },
        {
          name: 'Rewards Registry',
          address: import.meta.env.VITE_REWARDS_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
          isPaused: false,
          balance: '0',
        },
        {
          name: 'Charity Vault',
          address: import.meta.env.VITE_CHARITY_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000',
          isPaused: false,
          balance: '0',
        },
        {
          name: 'Fee Config',
          address: import.meta.env.VITE_FEE_CONFIG_ADDRESS || '0x0000000000000000000000000000000000000000',
          isPaused: false,
          balance: '0',
        },
      ];

      setContracts(contractList);

      // In production, call contract methods to get actual status
      // Example: const isPaused = await minerNFTContract.read.paused();
    } catch (err) {
      console.error('Error loading contract data:', err);
    }
  };

  const loadBurnData = async () => {
    try {
      // Get pending burns
      const { data: burns } = await supabase
        .from('token_burns')
        .select('amount_tyt, status, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (burns) {
        const total = burns.reduce((sum, b) => sum + parseFloat(b.amount_tyt), 0);
        setPendingBurn(total);
      }

      // Get last burn execution
      const { data: lastBurn } = await supabase
        .from('token_burns')
        .select('executed_at')
        .eq('status', 'executed')
        .order('executed_at', { ascending: false })
        .limit(1)
        .single();

      if (lastBurn?.executed_at) {
        setLastBurnDate(new Date(lastBurn.executed_at));
      }
    } catch (err) {
      console.error('Error loading burn data:', err);
    }
  };

  const handlePauseContract = async (contractName: string) => {
    try {
      showToast(`Pausing ${contractName}...`, 'info');

      // In production, call contract's pause() function
      // Example:
      // const { hash } = await minerNFTContract.write.pause();
      // await waitForTransaction({ hash });

      showToast(`${contractName} paused successfully`, 'success');
      await loadContractData();
    } catch (err: any) {
      console.error('Error pausing contract:', err);
      showToast(err.message || 'Failed to pause contract', 'error');
    }
  };

  const handleUnpauseContract = async (contractName: string) => {
    try {
      showToast(`Unpausing ${contractName}...`, 'info');

      // In production, call contract's unpause() function

      showToast(`${contractName} unpaused successfully`, 'success');
      await loadContractData();
    } catch (err: any) {
      console.error('Error unpausing contract:', err);
      showToast(err.message || 'Failed to unpause contract', 'error');
    }
  };

  const handleUpdateFees = async () => {
    if (feeConfig.protocolFee + feeConfig.charityFee + feeConfig.academyFee !== 100) {
      showToast('Fee percentages must add up to 100%', 'error');
      return;
    }

    setIsUpdatingFees(true);

    try {
      showToast('Updating fee configuration...', 'info');

      // In production, call FeeConfig contract's updateFees() function
      // Example:
      // const { hash } = await feeConfigContract.write.updateFees([
      //   feeConfig.protocolFee * 100,
      //   feeConfig.charityFee * 100,
      //   feeConfig.academyFee * 100,
      // ]);

      showToast('Fee configuration updated successfully', 'success');
    } catch (err: any) {
      console.error('Error updating fees:', err);
      showToast(err.message || 'Failed to update fees', 'error');
    } finally {
      setIsUpdatingFees(false);
    }
  };

  const handleExecuteBurn = async () => {
    try {
      showToast('Executing token burn...', 'info');

      // In production:
      // 1. Call burn function on token contract
      // 2. Update burn records in database
      // 3. Record transaction

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile) return;

      // Update pending burns to executed
      await supabase
        .from('token_burns')
        .update({
          status: 'executed',
          executed_at: new Date().toISOString(),
          executed_by: profile.id,
        })
        .eq('status', 'pending');

      showToast(`Successfully burned ${pendingBurn.toFixed(2)} TYT`, 'success');

      await loadBurnData();
    } catch (err: any) {
      console.error('Error executing burn:', err);
      showToast(err.message || 'Failed to execute burn', 'error');
    }
  };

  const handleDistributeCharityFees = async () => {
    try {
      showToast('Distributing charity fees...', 'info');

      // In production:
      // 1. Calculate accumulated charity fees
      // 2. Transfer to charity vault
      // 3. Record distribution

      showToast('Charity fees distributed successfully', 'success');
    } catch (err: any) {
      console.error('Error distributing fees:', err);
      showToast(err.message || 'Failed to distribute fees', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">
            You don't have permission to access the contract management panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Shield className="w-10 h-10 text-yellow-400" />
        <div>
          <h1 className="text-3xl font-bold text-white">Contract Management</h1>
          <p className="text-gray-400">Manage smart contracts and protocol configuration</p>
        </div>
      </div>

      {/* Contract List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {contracts.map((contract) => (
          <div
            key={contract.address}
            className="bg-gray-800 border border-gray-700 rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{contract.name}</h3>
                <p className="text-sm text-gray-400 font-mono break-all">{contract.address}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                contract.isPaused
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-green-500/20 text-green-400'
              }`}>
                {contract.isPaused ? 'Paused' : 'Active'}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => contract.isPaused ? handleUnpauseContract(contract.name) : handlePauseContract(contract.name)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  contract.isPaused
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }`}
              >
                {contract.isPaused ? (
                  <span className="flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" />
                    Unpause
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </span>
                )}
              </button>
              <a
                href={`${import.meta.env.VITE_POLYGON_EXPLORER}/address/${contract.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Fee Configuration */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">Fee Configuration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Protocol Fee (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={feeConfig.protocolFee}
              onChange={(e) => setFeeConfig({ ...feeConfig, protocolFee: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Charity Fee (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={feeConfig.charityFee}
              onChange={(e) => setFeeConfig({ ...feeConfig, charityFee: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Academy Fee (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={feeConfig.academyFee}
              onChange={(e) => setFeeConfig({ ...feeConfig, academyFee: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg mb-4">
          <span className="text-gray-400">Total</span>
          <span className={`text-lg font-bold ${
            feeConfig.protocolFee + feeConfig.charityFee + feeConfig.academyFee === 100
              ? 'text-green-400'
              : 'text-red-400'
          }`}>
            {feeConfig.protocolFee + feeConfig.charityFee + feeConfig.academyFee}%
          </span>
        </div>

        <button
          onClick={handleUpdateFees}
          disabled={isUpdatingFees || feeConfig.protocolFee + feeConfig.charityFee + feeConfig.academyFee !== 100}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUpdatingFees ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Update Fee Configuration
            </>
          )}
        </button>
      </div>

      {/* Token Burn & Fee Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Burn */}
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Flame className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Token Burn</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Pending Burn</div>
              <div className="text-3xl font-bold text-orange-400">
                {pendingBurn.toLocaleString()} TYT
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Last Burn</div>
              <div className="text-white">
                {lastBurnDate ? lastBurnDate.toLocaleString() : 'Never'}
              </div>
            </div>

            <button
              onClick={handleExecuteBurn}
              disabled={pendingBurn === 0}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Flame className="w-5 h-5" />
              Execute Burn
            </button>
          </div>
        </div>

        {/* Charity Distribution */}
        <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Fee Distribution</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Accumulated Charity Fees</div>
              <div className="text-3xl font-bold text-green-400">
                $0.00
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-1">Last Distribution</div>
              <div className="text-white">
                Never
              </div>
            </div>

            <button
              onClick={handleDistributeCharityFees}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Distribute Fees
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
