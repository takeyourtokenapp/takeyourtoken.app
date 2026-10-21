import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TronWebhookPayload {
  transaction_id: string;
  block_number: number;
  block_timestamp: number;
  from_address: string;
  to_address: string;
  amount: string;
  token_address?: string;
  token_symbol?: string;
  confirmations: number;
}

interface DepositResult {
  success: boolean;
  deposit_id?: string;
  amount_credited?: number;
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET') || 'change-in-production';
    const providedSecret = req.headers.get('X-Webhook-Secret');
    
    if (providedSecret !== webhookSecret) {
      console.warn('Invalid webhook secret');
    }

    const payload = await req.json();
    console.log('Received webhook:', JSON.stringify(payload));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let txData: TronWebhookPayload;
    let networkCode: string;

    if (payload.network === 'TRON' || payload.transaction_id?.startsWith('0x')) {
      networkCode = 'TRON';
      txData = {
        transaction_id: payload.transaction_id || payload.txID,
        block_number: payload.block_number || payload.blockNumber,
        block_timestamp: payload.block_timestamp || payload.timestamp,
        from_address: payload.from_address || payload.from,
        to_address: payload.to_address || payload.to,
        amount: payload.amount || payload.value,
        token_address: payload.token_address || payload.tokenAddress,
        token_symbol: payload.token_symbol || payload.tokenSymbol || 'TRX',
        confirmations: payload.confirmations || 0,
      };
    } else {
      throw new Error('Unsupported network or invalid payload');
    }

    const { data: depositAddress } = await supabase
      .from('user_deposit_addresses')
      .select('id, user_id, network_code')
      .eq('address', txData.to_address)
      .eq('network_code', networkCode)
      .single();

    if (!depositAddress) {
      console.log('Address not found in system:', txData.to_address);
      return new Response(
        JSON.stringify({ success: false, error: 'Address not registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    const { data: existingDeposit } = await supabase
      .from('blockchain_deposits')
      .select('id')
      .eq('tx_hash', txData.transaction_id)
      .single();

    if (existingDeposit) {
      console.log('Duplicate transaction:', txData.transaction_id);
      return new Response(
        JSON.stringify({ success: true, deposit_id: existingDeposit.id, message: 'Already processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amountDecimal = parseFloat(txData.amount) / 1_000_000;
    
    const asset = txData.token_symbol || 'TRX';

    const { data: network } = await supabase
      .from('blockchain_networks')
      .select('min_confirmations')
      .eq('network_code', networkCode)
      .single();

    const requiredConfirmations = network?.min_confirmations || 19;
    const isConfirmed = txData.confirmations >= requiredConfirmations;

    const depositData = {
      user_id: depositAddress.user_id,
      deposit_address_id: depositAddress.id,
      network_code: networkCode,
      tx_hash: txData.transaction_id,
      from_address: txData.from_address,
      to_address: txData.to_address,
      asset: asset,
      amount: amountDecimal,
      confirmations: txData.confirmations,
      status: isConfirmed ? 'confirmed' : 'pending',
      block_number: txData.block_number,
      block_timestamp: new Date(txData.block_timestamp * 1000).toISOString(),
    };

    const { data: newDeposit, error: depositError } = await supabase
      .from('blockchain_deposits')
      .insert(depositData)
      .select('id')
      .single();

    if (depositError) {
      throw depositError;
    }

    if (isConfirmed) {
      const { data: feeData } = await supabase.rpc('calculate_deposit_fees', {
        p_amount: amountDecimal,
        p_asset: asset,
      });

      if (!feeData || feeData.length === 0) {
        throw new Error('Failed to calculate fees');
      }

      const fees = feeData[0];

      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', depositAddress.user_id)
        .eq('asset', asset)
        .single();

      const currentBalance = wallet?.balance || 0;
      const newBalance = parseFloat(currentBalance) + fees.amount_user;

      const { error: walletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: depositAddress.user_id,
          asset: asset,
          balance: newBalance,
        });

      if (walletError) {
        throw walletError;
      }

      const { data: transaction, error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: depositAddress.user_id,
          wallet_id: wallet?.id,
          type: 'deposit',
          asset: asset,
          amount: amountDecimal,
          balance_after: newBalance,
          status: 'completed',
          fee: fees.fee_total,
          metadata: {
            blockchain_tx: txData.transaction_id,
            network: networkCode,
            fee_breakdown: {
              protocol: fees.fee_protocol,
              charity: fees.fee_charity,
              academy: fees.fee_academy,
            },
          },
        })
        .select('id')
        .single();

      if (txError) {
        throw txError;
      }

      await supabase.from('protocol_revenue').insert({
        source_type: 'deposit',
        asset: asset,
        amount: fees.fee_protocol,
        amount_usd: fees.fee_protocol,
        transaction_id: transaction.id,
      });

      await supabase.from('charity_flows').insert([
        {
          user_id: depositAddress.user_id,
          source_type: 'deposit',
          asset: asset,
          amount: fees.fee_charity,
          amount_usd: fees.fee_charity,
          flow_type: 'charity',
          transaction_id: transaction.id,
        },
        {
          user_id: depositAddress.user_id,
          source_type: 'deposit',
          asset: asset,
          amount: fees.fee_academy,
          amount_usd: fees.fee_academy,
          flow_type: 'academy',
          transaction_id: transaction.id,
        },
      ]);

      await supabase
        .from('blockchain_deposits')
        .update({
          status: 'credited',
          wallet_transaction_id: transaction.id,
          fee_charged: fees.fee_total,
          amount_credited: fees.amount_user,
          credited_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', newDeposit.id);

      const result: DepositResult = {
        success: true,
        deposit_id: newDeposit.id,
        amount_credited: fees.amount_user,
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          deposit_id: newDeposit.id,
          message: `Pending confirmations: ${txData.confirmations}/${requiredConfirmations}`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});