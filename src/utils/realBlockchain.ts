import { supabase } from '../lib/supabase';

export interface BlockchainBalance {
  blockchain: string;
  asset: string;
  balance: string;
  usdValue: number;
  address: string;
}

export interface TransactionDetails {
  hash: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  timestamp: number;
  confirmations: number;
  status: 'pending' | 'confirmed' | 'failed';
  fee: string;
  blockNumber?: number;
}

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

const BLOCKCHAIN_RPCS = {
  bitcoin: process.env.VITE_BITCOIN_RPC || 'https://blockstream.info/api',
  ethereum: process.env.VITE_ETHEREUM_RPC || 'https://eth.llamarpc.com',
  solana: process.env.VITE_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
  tron: process.env.VITE_TRON_RPC || 'https://api.trongrid.io',
  xrp: process.env.VITE_XRP_RPC || 'https://s1.ripple.com:51234'
};

const PRICE_API = 'https://api.coingecko.com/api/v3';

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  TRX: 'tron',
  XRP: 'ripple',
  USDT: 'tether',
  USDC: 'usd-coin',
  TYT: 'custom'
};

export async function getBitcoinBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_RPCS.bitcoin}/address/${address}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const balance = (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000;
    const price = await getAssetPrice('BTC');

    return {
      blockchain: 'Bitcoin',
      asset: 'BTC',
      balance: balance.toFixed(8),
      usdValue: balance * price.price,
      address
    };
  } catch (error) {
    console.error('Bitcoin balance error:', error);
    return null;
  }
}

export async function getEthereumBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(BLOCKCHAIN_RPCS.ethereum, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      })
    });

    const data = await response.json();
    if (data.error) {
      return null;
    }

    const balanceWei = BigInt(data.result);
    const balance = Number(balanceWei) / 1e18;
    const price = await getAssetPrice('ETH');

    return {
      blockchain: 'Ethereum',
      asset: 'ETH',
      balance: balance.toFixed(8),
      usdValue: balance * price.price,
      address
    };
  } catch (error) {
    console.error('Ethereum balance error:', error);
    return null;
  }
}

export async function getSolanaBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(BLOCKCHAIN_RPCS.solana, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address]
      })
    });

    const data = await response.json();
    if (data.error) {
      return null;
    }

    const balance = data.result.value / 1e9;
    const price = await getAssetPrice('SOL');

    return {
      blockchain: 'Solana',
      asset: 'SOL',
      balance: balance.toFixed(8),
      usdValue: balance * price.price,
      address
    };
  } catch (error) {
    console.error('Solana balance error:', error);
    return null;
  }
}

export async function getTronBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(`${BLOCKCHAIN_RPCS.tron}/v1/accounts/${address}`);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const balance = (data.data?.[0]?.balance || 0) / 1e6;
    const price = await getAssetPrice('TRX');

    return {
      blockchain: 'Tron',
      asset: 'TRX',
      balance: balance.toFixed(6),
      usdValue: balance * price.price,
      address
    };
  } catch (error) {
    console.error('Tron balance error:', error);
    return null;
  }
}

export async function getXRPBalance(address: string): Promise<BlockchainBalance | null> {
  try {
    const response = await fetch(BLOCKCHAIN_RPCS.xrp, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'account_info',
        params: [{
          account: address,
          ledger_index: 'validated'
        }]
      })
    });

    const data = await response.json();
    if (data.error) {
      return null;
    }

    const balance = Number(data.result.account_data.Balance) / 1e6;
    const price = await getAssetPrice('XRP');

    return {
      blockchain: 'XRP Ledger',
      asset: 'XRP',
      balance: balance.toFixed(6),
      usdValue: balance * price.price,
      address
    };
  } catch (error) {
    console.error('XRP balance error:', error);
    return null;
  }
}

export async function getAssetPrice(symbol: string): Promise<PriceData> {
  try {
    if (symbol === 'TYT') {
      return await getTYTPriceFromPumpFun();
    }

    const coinId = COIN_IDS[symbol];
    if (!coinId) {
      return {
        symbol,
        price: 0,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now()
      };
    }

    const cacheKey = `price_${symbol}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.lastUpdated < 60000) {
        return data;
      }
    }

    const response = await fetch(
      `${PRICE_API}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    );

    const data = await response.json();
    const coinData = data[coinId];

    const priceData: PriceData = {
      symbol,
      price: coinData?.usd || 0,
      change24h: coinData?.usd_24h_change || 0,
      volume24h: coinData?.usd_24h_vol || 0,
      marketCap: coinData?.usd_market_cap || 0,
      lastUpdated: Date.now()
    };

    sessionStorage.setItem(cacheKey, JSON.stringify(priceData));
    return priceData;
  } catch (error) {
    console.error(`Price fetch error for ${symbol}:`, error);
    return {
      symbol,
      price: 0,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: Date.now()
    };
  }
}

export async function getTYTPriceFromPumpFun(): Promise<PriceData> {
  try {
    const TYT_TOKEN_ADDRESS = process.env.VITE_TYT_TOKEN_ADDRESS || 'TYTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

    const response = await fetch(`https://frontend-api.pump.fun/coins/${TYT_TOKEN_ADDRESS}`);

    if (!response.ok) {
      return {
        symbol: 'TYT',
        price: 0.05,
        change24h: 0,
        volume24h: 0,
        marketCap: 0,
        lastUpdated: Date.now()
      };
    }

    const data = await response.json();

    return {
      symbol: 'TYT',
      price: data.usd_price || 0.05,
      change24h: data.price_change_24h || 0,
      volume24h: data.volume_24h || 0,
      marketCap: data.market_cap || 0,
      lastUpdated: Date.now()
    };
  } catch (error) {
    console.error('pump.fun API error:', error);
    return {
      symbol: 'TYT',
      price: 0.05,
      change24h: 0,
      volume24h: 0,
      marketCap: 0,
      lastUpdated: Date.now()
    };
  }
}

export async function getAllBalances(addresses: Record<string, string>): Promise<BlockchainBalance[]> {
  const balances: BlockchainBalance[] = [];

  if (addresses.bitcoin) {
    const btcBalance = await getBitcoinBalance(addresses.bitcoin);
    if (btcBalance) balances.push(btcBalance);
  }

  if (addresses.ethereum) {
    const ethBalance = await getEthereumBalance(addresses.ethereum);
    if (ethBalance) balances.push(ethBalance);
  }

  if (addresses.solana) {
    const solBalance = await getSolanaBalance(addresses.solana);
    if (solBalance) balances.push(solBalance);
  }

  if (addresses.tron) {
    const trxBalance = await getTronBalance(addresses.tron);
    if (trxBalance) balances.push(trxBalance);
  }

  if (addresses.xrp) {
    const xrpBalance = await getXRPBalance(addresses.xrp);
    if (xrpBalance) balances.push(xrpBalance);
  }

  return balances;
}

export async function getTransactionDetails(
  blockchain: string,
  txHash: string
): Promise<TransactionDetails | null> {
  try {
    switch (blockchain.toLowerCase()) {
      case 'bitcoin':
        return await getBitcoinTransaction(txHash);
      case 'ethereum':
        return await getEthereumTransaction(txHash);
      case 'solana':
        return await getSolanaTransaction(txHash);
      case 'tron':
        return await getTronTransaction(txHash);
      case 'xrp':
        return await getXRPTransaction(txHash);
      default:
        return null;
    }
  } catch (error) {
    console.error('Transaction details error:', error);
    return null;
  }
}

async function getBitcoinTransaction(txHash: string): Promise<TransactionDetails | null> {
  const response = await fetch(`${BLOCKCHAIN_RPCS.bitcoin}/tx/${txHash}`);
  const data = await response.json();

  return {
    hash: data.txid,
    from: data.vin[0]?.prevout?.scriptpubkey_address || 'unknown',
    to: data.vout[0]?.scriptpubkey_address || 'unknown',
    amount: (data.vout[0]?.value / 100000000).toFixed(8),
    asset: 'BTC',
    timestamp: data.status.block_time * 1000,
    confirmations: data.status.confirmed ? data.status.block_height : 0,
    status: data.status.confirmed ? 'confirmed' : 'pending',
    fee: (data.fee / 100000000).toFixed(8),
    blockNumber: data.status.block_height
  };
}

async function getEthereumTransaction(txHash: string): Promise<TransactionDetails | null> {
  const response = await fetch(BLOCKCHAIN_RPCS.ethereum, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1
    })
  });

  const data = await response.json();
  const tx = data.result;

  if (!tx) return null;

  const receipt = await fetch(BLOCKCHAIN_RPCS.ethereum, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 1
    })
  }).then(r => r.json());

  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to || 'contract creation',
    amount: (Number(BigInt(tx.value)) / 1e18).toFixed(8),
    asset: 'ETH',
    timestamp: Date.now(),
    confirmations: receipt.result ? 1 : 0,
    status: receipt.result ? (receipt.result.status === '0x1' ? 'confirmed' : 'failed') : 'pending',
    fee: (Number(BigInt(tx.gas)) * Number(BigInt(tx.gasPrice)) / 1e18).toFixed(8),
    blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : undefined
  };
}

async function getSolanaTransaction(txHash: string): Promise<TransactionDetails | null> {
  const response = await fetch(BLOCKCHAIN_RPCS.solana, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getTransaction',
      params: [txHash, { encoding: 'json' }]
    })
  });

  const data = await response.json();
  const tx = data.result;

  if (!tx) return null;

  return {
    hash: txHash,
    from: tx.transaction.message.accountKeys[0] || 'unknown',
    to: tx.transaction.message.accountKeys[1] || 'unknown',
    amount: ((tx.meta.postBalances[1] - tx.meta.preBalances[1]) / 1e9).toFixed(8),
    asset: 'SOL',
    timestamp: tx.blockTime * 1000,
    confirmations: tx.confirmations || 0,
    status: tx.meta.err ? 'failed' : 'confirmed',
    fee: (tx.meta.fee / 1e9).toFixed(8)
  };
}

async function getTronTransaction(txHash: string): Promise<TransactionDetails | null> {
  const response = await fetch(`${BLOCKCHAIN_RPCS.tron}/v1/transactions/${txHash}`);
  const data = await response.json();

  if (!data.data) return null;

  const tx = data.data[0];

  return {
    hash: tx.txID,
    from: tx.raw_data.contract[0].parameter.value.owner_address || 'unknown',
    to: tx.raw_data.contract[0].parameter.value.to_address || 'unknown',
    amount: ((tx.raw_data.contract[0].parameter.value.amount || 0) / 1e6).toFixed(6),
    asset: 'TRX',
    timestamp: tx.block_timestamp,
    confirmations: tx.ret[0].contractRet === 'SUCCESS' ? 1 : 0,
    status: tx.ret[0].contractRet === 'SUCCESS' ? 'confirmed' : 'failed',
    fee: ((tx.ret[0].fee || 0) / 1e6).toFixed(6)
  };
}

async function getXRPTransaction(txHash: string): Promise<TransactionDetails | null> {
  const response = await fetch(BLOCKCHAIN_RPCS.xrp, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'tx',
      params: [{
        transaction: txHash,
        binary: false
      }]
    })
  });

  const data = await response.json();
  const tx = data.result;

  if (!tx) return null;

  return {
    hash: tx.hash,
    from: tx.Account,
    to: tx.Destination,
    amount: (Number(tx.Amount) / 1e6).toFixed(6),
    asset: 'XRP',
    timestamp: Date.now(),
    confirmations: tx.validated ? 1 : 0,
    status: tx.validated ? 'confirmed' : 'pending',
    fee: (Number(tx.Fee) / 1e6).toFixed(6)
  };
}

export async function syncUserBalances(userId: string): Promise<void> {
  try {
    const { data: addresses } = await supabase
      .from('blockchain_deposit_addresses')
      .select('network_code, address')
      .eq('user_id', userId);

    if (!addresses || addresses.length === 0) {
      return;
    }

    const addressMap: Record<string, string> = {};
    addresses.forEach(addr => {
      addressMap[addr.network_code.toLowerCase()] = addr.address;
    });

    const balances = await getAllBalances(addressMap);

    for (const balance of balances) {
      await supabase
        .from('custodial_wallets')
        .upsert({
          user_id: userId,
          asset: balance.asset,
          balance: balance.balance,
          blockchain: balance.blockchain.toLowerCase(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,asset'
        });
    }
  } catch (error) {
    console.error('Balance sync error:', error);
  }
}
