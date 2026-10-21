import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BitcoinData {
  price: {
    usd: number;
    eur: number;
    timestamp: number;
  };
  network: {
    difficulty: number;
    hashrate: number;
    blockHeight: number;
    blockReward: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const includeNetwork = url.searchParams.get('network') === 'true';

    // Fetch Bitcoin price from CoinGecko
    const priceResponse = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur&include_last_updated_at=true'
    );

    if (!priceResponse.ok) {
      throw new Error('Failed to fetch Bitcoin price');
    }

    const priceData = await priceResponse.json();

    const result: BitcoinData = {
      price: {
        usd: priceData.bitcoin.usd,
        eur: priceData.bitcoin.eur,
        timestamp: Date.now()
      },
      network: {
        difficulty: 0,
        hashrate: 0,
        blockHeight: 0,
        blockReward: 3.125
      }
    };

    // Optionally fetch network stats
    if (includeNetwork) {
      try {
        const [difficultyRes, hashrateRes, blockHeightRes] = await Promise.all([
          fetch('https://blockchain.info/q/getdifficulty'),
          fetch('https://blockchain.info/q/hashrate'),
          fetch('https://blockchain.info/q/getblockcount')
        ]);

        const difficulty = await difficultyRes.json();
        const hashrate = await hashrateRes.json();
        const blockHeight = await blockHeightRes.json();

        result.network = {
          difficulty,
          hashrate: hashrate / 1000000000000000000, // Convert to EH/s
          blockHeight,
          blockReward: 3.125 // Post-2024 halving
        };
      } catch (error) {
        console.error('Error fetching network stats:', error);
        // Use fallback values
        result.network = {
          difficulty: 73197634206448,
          hashrate: 550,
          blockHeight: 820000,
          blockReward: 3.125
        };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error('Error in get-bitcoin-price:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        fallback: {
          price: { usd: 43500, eur: 40000, timestamp: Date.now() },
          network: { difficulty: 73197634206448, hashrate: 550, blockHeight: 820000, blockReward: 3.125 }
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
