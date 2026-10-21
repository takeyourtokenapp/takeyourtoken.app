import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Bitcoin, Zap, Wallet, Globe, TrendingUp, Star, ChevronRight, Check } from 'lucide-react';

interface NetworkMetadata {
  network_code: string;
  description: string;
  average_block_time_seconds: number;
  base_fee_percentage: number;
  min_deposit_amount: number;
  min_withdrawal_amount: number;
  supports_memos: boolean;
  supports_smart_contracts: boolean;
  is_featured: boolean;
  display_order: number;
}

interface BlockchainNetwork {
  network_code: string;
  network_name: string;
  native_symbol: string;
  explorer_url: string;
  supports_tokens: boolean;
  is_active: boolean;
  metadata?: NetworkMetadata;
}

interface SupportedToken {
  token_symbol: string;
  token_name: string;
  contract_address: string | null;
  decimals: number;
  min_deposit_amount: number;
}

interface NetworkSelectorProps {
  selectedNetwork: string;
  onNetworkSelect: (networkCode: string) => void;
  onTokenSelect?: (token: SupportedToken) => void;
  showTokens?: boolean;
}

export default function NetworkSelector({
  selectedNetwork,
  onNetworkSelect,
  onTokenSelect,
  showTokens = false
}: NetworkSelectorProps) {
  const [networks, setNetworks] = useState<BlockchainNetwork[]>([]);
  const [tokens, setTokens] = useState<SupportedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'featured' | 'all'>('featured');

  useEffect(() => {
    loadNetworks();
  }, []);

  useEffect(() => {
    if (showTokens && selectedNetwork) {
      loadTokens(selectedNetwork);
    }
  }, [selectedNetwork, showTokens]);

  const loadNetworks = async () => {
    try {
      setIsLoading(true);
      const { data: networksData, error: networksError } = await supabase
        .from('blockchain_networks')
        .select('*')
        .eq('is_active', true)
        .order('network_name');

      if (networksError) throw networksError;

      const { data: metadataData, error: metadataError } = await supabase
        .from('network_metadata')
        .select('*')
        .order('display_order');

      if (metadataError) throw metadataError;

      const networksWithMetadata = (networksData || []).map(network => {
        const metadata = (metadataData || []).find(m => m.network_code === network.network_code);
        return {
          ...network,
          metadata
        };
      });

      networksWithMetadata.sort((a, b) => {
        const orderA = a.metadata?.display_order ?? 999;
        const orderB = b.metadata?.display_order ?? 999;
        return orderA - orderB;
      });

      setNetworks(networksWithMetadata);
    } catch (error) {
      console.error('Error loading networks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTokens = async (networkCode: string) => {
    try {
      const { data, error } = await supabase
        .from('supported_tokens')
        .select('*')
        .eq('network_code', networkCode)
        .eq('is_active', true);

      if (error) throw error;
      setTokens(data || []);
    } catch (error) {
      console.error('Error loading tokens:', error);
      setTokens([]);
    }
  };

  const getNetworkIcon = (networkCode: string) => {
    const icons: Record<string, string> = {
      BTC: '₿',
      BTC_LIGHTNING: '⚡',
      BTC_LIQUID: '💧',
      ETH: '⟠',
      TRON: '◆',
      SOL: '◎',
      POLYGON: '⬡',
      BSC: '💠',
      TON: '💎',
      XRP: '✕',
      ARBITRUM: '🔷',
      OPTIMISM: '🔴',
      AVALANCHE: '🔺'
    };
    return icons[networkCode] || '🌐';
  };

  const getNetworkColor = (networkCode: string) => {
    const colors: Record<string, string> = {
      BTC: 'from-orange-500 to-yellow-600',
      BTC_LIGHTNING: 'from-purple-500 to-pink-500',
      BTC_LIQUID: 'from-blue-500 to-cyan-500',
      ETH: 'from-blue-600 to-purple-600',
      TRON: 'from-red-500 to-pink-500',
      SOL: 'from-purple-600 to-blue-500',
      POLYGON: 'from-purple-500 to-indigo-500',
      BSC: 'from-yellow-500 to-orange-500',
      TON: 'from-blue-500 to-indigo-600',
      XRP: 'from-gray-700 to-gray-900',
      ARBITRUM: 'from-blue-500 to-blue-700',
      OPTIMISM: 'from-red-500 to-pink-600',
      AVALANCHE: 'from-red-600 to-orange-500'
    };
    return colors[networkCode] || 'from-gray-600 to-gray-800';
  };

  const filteredNetworks = viewMode === 'featured'
    ? networks.filter(n => n.metadata?.is_featured)
    : networks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold mb-1">Select Network</h3>
          <p className="text-sm text-gray-400">
            {filteredNetworks.length} network{filteredNetworks.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('featured')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'featured'
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                : 'bg-gray-800 text-gray-400 hover:text-gray-300'
            }`}
          >
            <Star size={16} />
            Featured
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'all'
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/50'
                : 'bg-gray-800 text-gray-400 hover:text-gray-300'
            }`}
          >
            <Globe size={16} />
            All
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNetworks.map((network) => {
          const isSelected = network.network_code === selectedNetwork;
          const icon = getNetworkIcon(network.network_code);
          const gradient = getNetworkColor(network.network_code);

          return (
            <button
              key={network.network_code}
              onClick={() => onNetworkSelect(network.network_code)}
              className={`relative group text-left p-4 rounded-xl transition-all border-2 ${
                isSelected
                  ? 'bg-gradient-to-br from-gold-900/30 to-amber-900/30 border-gold-500'
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="p-1 bg-gold-500 rounded-full">
                    <Check size={14} className="text-black" />
                  </div>
                </div>
              )}

              {network.metadata?.is_featured && (
                <div className="absolute top-3 right-3">
                  <Star size={16} className="text-gold-400 fill-gold-400" />
                </div>
              )}

              <div className="flex items-start gap-3 mb-3">
                <div className={`p-3 bg-gradient-to-br ${gradient} rounded-xl text-3xl`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white mb-1 truncate">
                    {network.network_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/30">
                      {network.native_symbol}
                    </span>
                    {network.supports_tokens && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30">
                        Tokens
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {network.metadata?.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">
                  {network.metadata.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                {network.metadata?.average_block_time_seconds ? (
                  <span>~{network.metadata.average_block_time_seconds}s blocks</span>
                ) : (
                  <span>Instant</span>
                )}
                {network.metadata?.base_fee_percentage && (
                  <span>{(network.metadata.base_fee_percentage * 100).toFixed(2)}% fee</span>
                )}
              </div>

              {network.metadata?.supports_smart_contracts && (
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-purple-400">
                    <Zap size={12} />
                    Smart Contracts
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showTokens && tokens.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-gold-400" />
            Available Tokens on {networks.find(n => n.network_code === selectedNetwork)?.network_name}
          </h4>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {tokens.map((token) => (
              <button
                key={token.token_symbol}
                onClick={() => onTokenSelect?.(token)}
                className="p-3 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 hover:border-gold-500 rounded-lg transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{token.token_symbol}</span>
                  <ChevronRight size={16} className="text-gray-600 group-hover:text-gold-400 transition-colors" />
                </div>
                <div className="text-xs text-gray-400 mb-2">{token.token_name}</div>
                <div className="text-xs text-gray-500">
                  Min: {token.min_deposit_amount} {token.token_symbol}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
