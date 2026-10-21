import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllBalances,
  getAssetPrice,
  getTYTPriceFromPumpFun,
  syncUserBalances,
  type BlockchainBalance,
  type PriceData
} from '../utils/realBlockchain';
import { supabase } from '../lib/supabase';

export function useRealBalances() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<BlockchainBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadBalances = useCallback(async () => {
    if (!user) {
      setBalances([]);
      setLoading(false);
      return;
    }

    try {
      const { data: addresses } = await supabase
        .from('blockchain_deposit_addresses')
        .select('network_code, address')
        .eq('user_id', user.id);

      if (!addresses || addresses.length === 0) {
        setBalances([]);
        setLoading(false);
        return;
      }

      const addressMap: Record<string, string> = {};
      addresses.forEach(addr => {
        addressMap[addr.network_code.toLowerCase()] = addr.address;
      });

      const realBalances = await getAllBalances(addressMap);
      setBalances(realBalances);
      setLoading(false);
    } catch (error) {
      console.error('Load balances error:', error);
      setLoading(false);
    }
  }, [user]);

  const syncBalances = useCallback(async () => {
    if (!user) return;

    setSyncing(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setSyncing(false);
        return;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/sync-real-balances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        await loadBalances();
      }
    } catch (error) {
      console.error('Sync balances error:', error);
    } finally {
      setSyncing(false);
    }
  }, [user, loadBalances]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  return { balances, loading, syncing, refresh: loadBalances, sync: syncBalances };
}

export function useAssetPrice(symbol: string) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrice() {
      setLoading(true);
      const data = await getAssetPrice(symbol);
      setPriceData(data);
      setLoading(false);
    }

    loadPrice();

    const interval = setInterval(loadPrice, 60000);

    return () => clearInterval(interval);
  }, [symbol]);

  return { priceData, loading };
}

export function useTYTPrice() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrice() {
      setLoading(true);
      const data = await getTYTPriceFromPumpFun();
      setPriceData(data);
      setLoading(false);
    }

    loadPrice();

    const interval = setInterval(loadPrice, 30000);

    return () => clearInterval(interval);
  }, []);

  return { priceData, loading };
}

export function useMultiAssetPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPrices() {
      setLoading(true);
      const priceMap: Record<string, PriceData> = {};

      await Promise.all(
        symbols.map(async (symbol) => {
          const data = await getAssetPrice(symbol);
          priceMap[symbol] = data;
        })
      );

      setPrices(priceMap);
      setLoading(false);
    }

    if (symbols.length > 0) {
      loadPrices();

      const interval = setInterval(loadPrices, 60000);

      return () => clearInterval(interval);
    }
  }, [symbols.join(',')]);

  return { prices, loading };
}

export function usePortfolioValue() {
  const { balances } = useRealBalances();
  const [totalValue, setTotalValue] = useState(0);
  const [change24h, setChange24h] = useState(0);

  useEffect(() => {
    const total = balances.reduce((sum, balance) => sum + balance.usdValue, 0);
    setTotalValue(total);
  }, [balances]);

  return { totalValue, change24h };
}
