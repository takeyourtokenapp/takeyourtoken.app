import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// Blockchain RPC endpoints
const RPC_URLS = {
  bitcoin: 'https://blockstream.info/api',
  ethereum: `https://eth-mainnet.g.alchemy.com/v2/${Deno.env.get('ALCHEMY_API_KEY')}`,
  solana: 'https://api.mainnet-beta.solana.com',
  tron: 'https://api.trongrid.io',
  xrp: 'https://s1.ripple.com:51234',
};

async function checkBitcoinBalance(address: string): Promise<number> {
  const response = await fetch(`${RPC_URLS.bitcoin}/address/${address}`);
  const data = await response.json();
  const balanceSat = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
  return balanceSat / 100000000; // Convert to BTC
}

async function checkEthereumBalance(address: string): Promise<number> {
  const response = await fetch(RPC_URLS.ethereum, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1,
    }),
  });
  const data = await response.json();
  const balanceWei = parseInt(data.result, 16);
  return balanceWei / 1e18; // Convert to ETH
}

async function checkSolanaBalance(address: string): Promise<number> {
  const response = await fetch(RPC_URLS.solana, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getBalance',
      params: [address],
      id: 1,
    }),
  });
  const data = await response.json();
  const balanceLamports = data.result.value;
  return balanceLamports / 1e9; // Convert to SOL
}

async function checkTronBalance(address: string): Promise<number> {
  const response = await fetch(`${RPC_URLS.tron}/v1/accounts/${address}`, {
    headers: {
      'TRON-PRO-API-KEY': Deno.env.get('TRONGRID_API_KEY') || '',
    },
  });
  const data = await response.json();
  const balanceSun = data.data?.[0]?.balance || 0;
  return balanceSun / 1e6; // Convert to TRX
}

async function checkXRPBalance(address: string): Promise<number> {
  const response = await fetch(RPC_URLS.xrp, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'account_info',
      params: [{ account: address, ledger_index: 'validated' }],
    }),
  });
  const data = await response.json();
  const balanceDrops = parseInt(data.result.account_data.Balance);
  return balanceDrops / 1e6; // Convert to XRP
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { blockchain, address, asset = 'native' } = await req.json();

    if (!blockchain || !address) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let balance = 0;
    let error = null;

    try {
      switch (blockchain.toLowerCase()) {
        case 'btc':
        case 'bitcoin':
          balance = await checkBitcoinBalance(address);
          break;
        case 'eth':
        case 'ethereum':
          balance = await checkEthereumBalance(address);
          break;
        case 'sol':
        case 'solana':
          balance = await checkSolanaBalance(address);
          break;
        case 'trx':
        case 'tron':
          balance = await checkTronBalance(address);
          break;
        case 'xrp':
        case 'ripple':
          balance = await checkXRPBalance(address);
          break;
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
    } catch (err: any) {
      console.error(`Error checking ${blockchain} balance:`, err);
      error = err.message;
      balance = 0;
    }

    return new Response(
      JSON.stringify({
        success: error === null,
        balance,
        blockchain,
        address,
        asset,
        error,
        checked_at: new Date().toISOString(),
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