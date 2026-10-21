import { apiClient } from './client';

export interface MinerNFTMetadata {
  token_id: string;
  owner: string;
  power_th: number;
  efficiency_w_th: number;
  region: string;
  minted_at: string;
  metadata_uri?: string;
}

export interface MarketplaceListing {
  listing_id: string;
  token_id: string;
  seller: string;
  price: string;
  status: 'active' | 'sold' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BlockchainEvent {
  id: string;
  event_type: string;
  contract_address: string;
  transaction_hash: string;
  block_number: number;
  log_index: number;
  data: Record<string, unknown>;
  created_at: string;
}

export const indexerAPI = {
  getUserMiners: async (address: string): Promise<MinerNFTMetadata[]> => {
    return apiClient.get<MinerNFTMetadata[]>(`/api/v1/indexer/miners/owner/${address}`);
  },

  getMinerMetadata: async (tokenId: string): Promise<MinerNFTMetadata> => {
    return apiClient.get<MinerNFTMetadata>(`/api/v1/indexer/miners/${tokenId}`);
  },

  getActiveListings: async (params?: {
    min_price?: string;
    max_price?: string;
    region?: string;
    page?: number;
    per_page?: number;
  }): Promise<{ listings: MarketplaceListing[]; total: number }> => {
    return apiClient.get('/api/v1/indexer/marketplace/listings', { params });
  },

  getListing: async (listingId: string): Promise<MarketplaceListing> => {
    return apiClient.get<MarketplaceListing>(`/api/v1/indexer/marketplace/listings/${listingId}`);
  },

  getUserListings: async (address: string): Promise<MarketplaceListing[]> => {
    return apiClient.get<MarketplaceListing[]>(`/api/v1/indexer/marketplace/seller/${address}`);
  },

  getEvents: async (params?: {
    event_type?: string;
    contract_address?: string;
    from_block?: number;
    to_block?: number;
    page?: number;
    per_page?: number;
  }): Promise<{ events: BlockchainEvent[]; total: number }> => {
    return apiClient.get('/api/v1/indexer/events', { params });
  }
};
