import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const ASSET_PRICES: Record<string, number> = {
  'BTC': 95000,
  'ETH': 3500,
  'SOL': 140,
  'BNB': 600,
  'MATIC': 1.15,
  'TRX': 0.15,
  'TYT': 0.05,
  'USDT': 1,
  'USDC': 1,
  'XRP': 2.5
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { from_asset, to_asset } = await req.json();

    if (!from_asset || !to_asset) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fromPrice = ASSET_PRICES[from_asset] || 1;
    const toPrice = ASSET_PRICES[to_asset] || 1;
    const rate = fromPrice / toPrice;

    const volatility = (Math.random() - 0.5) * 0.02;
    const adjustedRate = rate * (1 + volatility);

    return new Response(
      JSON.stringify({
        success: true,
        rate: adjustedRate,
        from_asset,
        to_asset,
        from_price: fromPrice,
        to_price: toPrice,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});