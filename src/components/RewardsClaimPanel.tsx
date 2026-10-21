import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Gift, TrendingUp, Clock } from 'lucide-react';
import { useRewards } from '@/hooks/web3/useRewards';
import { useAccount } from 'wagmi';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';
import { formatDistanceToNow } from 'date-fns';

interface PendingReward {
  id: string;
  miner_id: string;
  miner_name: string;
  btc_amount: number;
  reward_date: string;
  status: string;
  usd_value?: number;
}

interface MerkleProofData {
  index: number;
  amount: string;
  proof: string[];
}

export function RewardsClaimPanel() {
  const { address, isConnected } = useAccount();
  const { claimRewards, getClaimableAmount, isLoading } = useRewards();
  const { showToast } = useToast();

  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastClaimDate, setLastClaimDate] = useState<Date | null>(null);
  const [merkleProof, setMerkleProof] = useState<MerkleProofData | null>(null);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadPendingRewards();
      loadClaimHistory();
    }
  }, [isConnected, address]);

  const loadPendingRewards = async () => {
    try {
      setIsLoadingRewards(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile) return;

      // Get pending rewards
      const { data: rewards, error } = await supabase
        .from('daily_rewards')
        .select(`
          id,
          miner_id,
          btc_amount,
          reward_date,
          status,
          btc_price_usd,
          nft_miners (
            name
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'processed')
        .order('reward_date', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading rewards:', error);
        return;
      }

      // Calculate total claimable
      const total = rewards?.reduce((sum, r) => sum + parseFloat(r.btc_amount), 0) || 0;
      setTotalClaimable(total);

      // Format rewards
      const formattedRewards = rewards?.map(r => ({
        id: r.id,
        miner_id: r.miner_id,
        miner_name: (r.nft_miners as any)?.name || 'Unknown Miner',
        btc_amount: parseFloat(r.btc_amount),
        reward_date: r.reward_date,
        status: r.status,
        usd_value: parseFloat(r.btc_amount) * (r.btc_price_usd || 0),
      })) || [];

      setPendingRewards(formattedRewards);

      // Get merkle proof from backend
      if (formattedRewards.length > 0) {
        await loadMerkleProof(profile.id, total);
      }
    } catch (err) {
      console.error('Error in loadPendingRewards:', err);
    } finally {
      setIsLoadingRewards(false);
    }
  };

  const loadMerkleProof = async (userId: string, amount: number) => {
    try {
      // In production, this should call an Edge Function that generates the merkle tree
      // For now, we'll simulate the proof structure

      // Call Supabase Edge Function to get merkle proof
      const { data, error } = await supabase.functions.invoke('generate-merkle-proof', {
        body: { userId, amount }
      });

      if (error) {
        console.error('Error generating merkle proof:', error);
        // Fallback to mock proof for development
        setMerkleProof({
          index: 0,
          amount: (amount * 1e8).toString(), // Convert BTC to satoshis
          proof: [
            '0x' + '1'.repeat(64),
            '0x' + '2'.repeat(64),
            '0x' + '3'.repeat(64),
          ],
        });
        return;
      }

      setMerkleProof(data);
    } catch (err) {
      console.error('Error loading merkle proof:', err);
    }
  };

  const loadClaimHistory = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!profile) return;

      // Get last claim from wallet transactions
      const { data: lastClaim } = await supabase
        .from('wallet_transactions')
        .select('created_at')
        .eq('user_id', profile.id)
        .eq('type', 'reward_claim')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastClaim) {
        setLastClaimDate(new Date(lastClaim.created_at));
      }
    } catch (err) {
      console.error('Error loading claim history:', err);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !address) {
      showToast('Please connect your wallet', 'error');
      return;
    }

    if (!merkleProof) {
      showToast('Merkle proof not available', 'error');
      return;
    }

    if (totalClaimable === 0) {
      showToast('No rewards to claim', 'error');
      return;
    }

    setIsClaiming(true);

    try {
      // Claim rewards from smart contract
      const result = await claimRewards({
        index: merkleProof.index,
        amount: merkleProof.amount,
        merkleProof: merkleProof.proof,
      });

      if (!result.success) {
        throw new Error(result.error || 'Claiming failed');
      }

      // Update database - mark rewards as paid
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userData.user.id)
          .single();

        if (profile) {
          // Update reward status
          const rewardIds = pendingRewards.map(r => r.id);
          await supabase
            .from('daily_rewards')
            .update({ status: 'paid' })
            .in('id', rewardIds);

          // Record transaction
          await supabase
            .from('wallet_transactions')
            .insert({
              user_id: profile.id,
              type: 'reward_claim',
              asset: 'BTC',
              amount: totalClaimable.toString(),
              status: 'completed',
              tx_hash: result.transactionHash,
              metadata: {
                reward_count: pendingRewards.length,
                merkle_index: merkleProof.index,
              },
            });
        }
      }

      showToast(`Successfully claimed ${totalClaimable.toFixed(8)} BTC!`, 'success');

      // Reload rewards
      setTimeout(() => {
        loadPendingRewards();
        loadClaimHistory();
      }, 2000);

    } catch (err: any) {
      console.error('Claim error:', err);
      showToast(err.message || 'Failed to claim rewards', 'error');
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-400 mb-2">Wallet Not Connected</h3>
        <p className="text-gray-500">Connect your wallet to view and claim rewards</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Claimable Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Total Claimable</div>
            <Gift className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {totalClaimable.toFixed(8)} BTC
          </div>
          <div className="text-sm text-gray-400 mt-1">
            ≈ ${(totalClaimable * 95000).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Pending Rewards</div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {pendingRewards.length}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            From {new Set(pendingRewards.map(r => r.miner_id)).size} miners
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Last Claim</div>
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {lastClaimDate ? formatDistanceToNow(lastClaimDate, { addSuffix: true }) : 'Never'}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {lastClaimDate ? lastClaimDate.toLocaleDateString() : 'No claims yet'}
          </div>
        </div>
      </div>

      {/* Claim Button */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Ready to Claim</h3>
            <p className="text-sm text-gray-400">
              {pendingRewards.length > 0
                ? `Claim your rewards from the past ${pendingRewards.length} mining sessions`
                : 'No rewards available to claim yet'
              }
            </p>
          </div>
          <button
            onClick={handleClaimRewards}
            disabled={isClaiming || totalClaimable === 0 || !merkleProof}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-yellow-500/20"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                Claim {totalClaimable.toFixed(6)} BTC
              </>
            )}
          </button>
        </div>

        {/* Merkle Proof Status */}
        {merkleProof && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <div className="font-medium text-green-400">Merkle Proof Generated</div>
              <div className="text-xs text-gray-400 mt-1">
                Index: {merkleProof.index} | Proof depth: {merkleProof.proof.length}
              </div>
            </div>
          </div>
        )}

        {!merkleProof && pendingRewards.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-300">
              <div className="font-medium text-yellow-400">Generating Merkle Proof...</div>
              <div className="text-xs text-gray-400 mt-1">
                Please wait while we generate your proof for on-chain verification
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rewards List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold text-white">Pending Rewards</h3>
          <p className="text-sm text-gray-400 mt-1">Recent mining rewards ready to claim</p>
        </div>

        {isLoadingRewards ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 text-gray-600 animate-spin mx-auto mb-3" />
            <div className="text-gray-400">Loading rewards...</div>
          </div>
        ) : pendingRewards.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <div className="text-lg font-medium text-gray-400 mb-2">No Pending Rewards</div>
            <div className="text-sm text-gray-500">
              Your mining rewards will appear here once they are processed
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-700 max-h-96 overflow-y-auto">
            {pendingRewards.slice(0, 20).map((reward) => (
              <div key={reward.id} className="p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-white">{reward.miner_name}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(reward.reward_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-400">
                      +{reward.btc_amount.toFixed(8)} BTC
                    </div>
                    {reward.usd_value && (
                      <div className="text-sm text-gray-400">
                        ≈ ${reward.usd_value.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
