import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MonitorResult {
  success: boolean;
  checked_addresses?: number;
  new_deposits?: number;
  processed_deposits?: number;
  errors?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET') || 'change-in-production';
    const providedSecret = req.headers.get('X-Cron-Secret') || req.url.split('secret=')[1];
    
    if (providedSecret !== cronSecret) {
      console.warn('Invalid cron secret');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: addresses } = await supabase
      .from('user_deposit_addresses')
      .select('id, user_id, network_code, address, last_checked_at')
      .eq('is_verified', true)
      .order('last_checked_at', { ascending: true, nullsFirst: true })
      .limit(50);

    if (!addresses || addresses.length === 0) {
      return new Response(
        JSON.stringify({ success: true, checked_addresses: 0, message: 'No addresses to monitor' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let newDeposits = 0;
    let processedDeposits = 0;
    const errors: string[] = [];

    for (const addr of addresses) {
      try {
        if (addr.network_code === 'TRON') {
          const tronApiUrl = `https://api.trongrid.io/v1/accounts/${addr.address}/transactions/trc20?limit=20`;
          const tronResponse = await fetch(tronApiUrl, {
            headers: {
              'TRON-PRO-API-KEY': Deno.env.get('TRONGRID_API_KEY') || '',
            },
          });

          if (!tronResponse.ok) {
            errors.push(`TRON API error for ${addr.address}: ${tronResponse.statusText}`);
            continue;
          }

          const tronData = await tronResponse.json();

          if (tronData.data && Array.isArray(tronData.data)) {
            for (const tx of tronData.data) {
              if (tx.to === addr.address && tx.type === 'Transfer') {
                const { data: existing } = await supabase
                  .from('blockchain_deposits')
                  .select('id')
                  .eq('tx_hash', tx.transaction_id)
                  .single();

                if (!existing) {
                  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/blockchain-webhook`;
                  
                  const webhookPayload = {
                    network: 'TRON',
                    transaction_id: tx.transaction_id,
                    block_number: tx.block_timestamp,
                    block_timestamp: Math.floor(tx.block_timestamp / 1000),
                    from_address: tx.from,
                    to_address: tx.to,
                    amount: tx.value,
                    token_address: tx.token_info?.address,
                    token_symbol: tx.token_info?.symbol || 'TRX',
                    confirmations: 20,
                  };

                  const webhookResponse = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Webhook-Secret': Deno.env.get('WEBHOOK_SECRET') || 'change-in-production',
                    },
                    body: JSON.stringify(webhookPayload),
                  });

                  if (webhookResponse.ok) {
                    newDeposits++;
                    processedDeposits++;
                  } else {
                    errors.push(`Webhook failed for tx ${tx.transaction_id}`);
                  }
                }
              }
            }
          }

          const nativeUrl = `https://api.trongrid.io/v1/accounts/${addr.address}/transactions?limit=20`;
          const nativeResponse = await fetch(nativeUrl, {
            headers: {
              'TRON-PRO-API-KEY': Deno.env.get('TRONGRID_API_KEY') || '',
            },
          });

          if (nativeResponse.ok) {
            const nativeData = await nativeResponse.json();
            
            if (nativeData.data && Array.isArray(nativeData.data)) {
              for (const tx of nativeData.data) {
                if (
                  tx.ret?.[0]?.contractRet === 'SUCCESS' &&
                  tx.raw_data?.contract?.[0]?.parameter?.value?.to_address
                ) {
                  const toAddr = tx.raw_data.contract[0].parameter.value.to_address;
                  
                  const tronWeb = (await import('npm:tronweb@6.0.0')).default;
                  const convertedAddr = tronWeb.address.fromHex('41' + toAddr);
                  
                  if (convertedAddr === addr.address) {
                    const { data: existing } = await supabase
                      .from('blockchain_deposits')
                      .select('id')
                      .eq('tx_hash', tx.txID)
                      .single();

                    if (!existing) {
                      const amount = tx.raw_data.contract[0].parameter.value.amount || 0;
                      const fromAddr = tronWeb.address.fromHex(
                        '41' + tx.raw_data.contract[0].parameter.value.owner_address
                      );

                      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/blockchain-webhook`;
                      
                      const webhookPayload = {
                        network: 'TRON',
                        transaction_id: tx.txID,
                        block_number: tx.blockNumber,
                        block_timestamp: Math.floor(tx.block_timestamp / 1000),
                        from_address: fromAddr,
                        to_address: addr.address,
                        amount: amount.toString(),
                        token_symbol: 'TRX',
                        confirmations: 20,
                      };

                      const webhookResponse = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'X-Webhook-Secret': Deno.env.get('WEBHOOK_SECRET') || 'change-in-production',
                        },
                        body: JSON.stringify(webhookPayload),
                      });

                      if (webhookResponse.ok) {
                        newDeposits++;
                        processedDeposits++;
                      }
                    }
                  }
                }
              }
            }
          }
        }

        await supabase
          .from('user_deposit_addresses')
          .update({ last_checked_at: new Date().toISOString() })
          .eq('id', addr.id);
      } catch (error) {
        errors.push(`Error checking ${addr.address}: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    const result: MonitorResult = {
      success: true,
      checked_addresses: addresses.length,
      new_deposits: newDeposits,
      processed_deposits: processedDeposits,
      errors: errors.length > 0 ? errors : undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Monitor deposits error:', error);
    
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