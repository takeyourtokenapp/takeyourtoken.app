import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

/**
 * Generate Merkle Proof for user rewards
 * 
 * This function generates a merkle proof for claiming rewards on-chain.
 * In production, this should:
 * 1. Build complete merkle tree from all pending rewards
 * 2. Calculate leaf hash for user's claim
 * 3. Generate merkle proof path
 * 4. Return proof array and index
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { userId, amount } = await req.json();

    if (!userId || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all pending rewards for this user
    const { data: rewards, error } = await supabase
      .from('daily_rewards')
      .select('id, btc_amount, user_id')
      .eq('user_id', userId)
      .eq('status', 'processed');

    if (error) {
      console.error('Error fetching rewards:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rewards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rewards || rewards.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No pending rewards found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // In production, implement proper merkle tree generation
    // For now, generate a mock proof structure
    const totalBtc = rewards.reduce((sum, r) => sum + parseFloat(r.btc_amount), 0);
    const amountInSatoshis = Math.floor(totalBtc * 1e8);

    // Generate mock merkle proof (32-byte hashes)
    // In production, use actual merkle tree library
    const proof = [
      '0x' + generateRandomHash(),
      '0x' + generateRandomHash(),
      '0x' + generateRandomHash(),
    ];

    // Calculate user's index in the merkle tree
    // In production, this should be based on actual tree construction
    const index = 0;

    const response = {
      index,
      amount: amountInSatoshis.toString(),
      proof,
      metadata: {
        rewardCount: rewards.length,
        totalBtc: totalBtc.toFixed(8),
        generatedAt: new Date().toISOString(),
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error('Error generating merkle proof:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to generate random 32-byte hash (for development)
function generateRandomHash(): string {
  const chars = '0123456789abcdef';
  let hash = '';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * PRODUCTION IMPLEMENTATION NOTES:
 * 
 * 1. Use a proper merkle tree library (e.g., merkletreejs)
 * 2. Store merkle root on-chain via RewardsMerkleRegistry
 * 3. Build tree from all users' rewards in epoch
 * 4. Generate leaf as keccak256(abi.encodePacked(address, amount))
 * 5. Calculate proof path from leaf to root
 * 6. Verify proof before returning
 * 
 * Example with merkletreejs:
 * 
 * import { MerkleTree } from 'npm:merkletreejs@latest';
 * import { keccak256 } from 'npm:js-sha3@latest';
 * 
 * const leaves = allUserRewards.map(r => 
 *   keccak256(Buffer.from(r.address + r.amount.toString()))
 * );
 * const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
 * const root = tree.getRoot().toString('hex');
 * const proof = tree.getProof(userLeaf).map(p => '0x' + p.data.toString('hex'));
 */