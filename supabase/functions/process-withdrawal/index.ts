import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WithdrawalRequest {
  asset: string;
  amount: number;
  destination_address: string;
  network_code?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { asset, amount, destination_address, network_code }: WithdrawalRequest = await req.json();

    if (!asset || !amount || !destination_address) {
      throw new Error('Missing required fields: asset, amount, destination_address');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('kyc_tier, kyc_status')
      .eq('user_id', user.id)
      .maybeSingle();

    const kycTier = profile?.kyc_tier || 0;
    const kycStatus = profile?.kyc_status || 'not_submitted';

    if (kycStatus !== 'approved' && kycTier === 0) {
      throw new Error('KYC verification required for withdrawals');
    }

    const { data: statsData } = await supabase.rpc('get_user_withdrawal_stats', {
      p_user_id: user.id
    });

    if (!statsData) {
      throw new Error('Unable to fetch withdrawal limits');
    }

    const stats = typeof statsData === 'string' ? JSON.parse(statsData) : statsData;
    const limits = stats.limits;

    if (amount < parseFloat(limits.min_amount)) {
      throw new Error(`Minimum withdrawal amount is ${limits.min_amount} ${asset}`);
    }

    if (amount > parseFloat(limits.max_amount)) {
      throw new Error(`Maximum withdrawal amount is ${limits.max_amount} ${asset}`);
    }

    if (!stats.can_withdraw) {
      throw new Error('Daily withdrawal limit reached');
    }

    if (amount > parseFloat(stats.today_remaining)) {
      throw new Error(`Withdrawal amount exceeds daily limit. Available: ${stats.today_remaining} ${asset}`);
    }

    const { data: balance } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('asset', asset)
      .maybeSingle();

    const currentBalance = balance?.balance || 0;

    if (currentBalance < amount) {
      throw new Error(`Insufficient balance. Available: ${currentBalance} ${asset}`);
    }

    const feePercentage = 0.01;
    const feeAmount = amount * feePercentage;
    const netAmount = amount - feeAmount;

    const requiresApproval = limits.requires_approval || amount > 5000;

    const { data: withdrawalRequest, error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        asset: asset,
        amount: amount,
        destination_address: destination_address,
        network_code: network_code || asset,
        status: requiresApproval ? 'pending' : 'approved',
        kyc_tier: kycTier,
        requires_approval: requiresApproval,
        fee_amount: feeAmount,
        net_amount: netAmount,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    await supabase.rpc('update_withdrawal_tracking', {
      p_user_id: user.id,
      p_amount: amount
    });

    if (!requiresApproval) {
      const mockTxHash = `0x${crypto.randomUUID().replace(/-/g, '')}`;

      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          tx_hash: mockTxHash,
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawalRequest.id);

      await supabase
        .from('user_wallets')
        .update({
          balance: currentBalance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('asset', asset);

      return new Response(
        JSON.stringify({
          success: true,
          withdrawal_id: withdrawalRequest.id,
          status: 'completed',
          tx_hash: mockTxHash,
          amount: amount,
          fee: feeAmount,
          net_amount: netAmount,
          message: 'Withdrawal processed successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          withdrawal_id: withdrawalRequest.id,
          status: 'pending',
          amount: amount,
          fee: feeAmount,
          net_amount: netAmount,
          message: 'Withdrawal request submitted for admin approval'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});