import { apiClient } from './client';

export interface MerkleProof {
  epoch: number;
  user_address: string;
  amount: string;
  proof: string[];
  merkle_root: string;
}

export interface RewardEpoch {
  epoch: number;
  start_time: string;
  end_time: string;
  total_rewards: string;
  merkle_root: string;
  status: 'pending' | 'active' | 'expired';
  participants_count: number;
}

export interface UserRewards {
  user_address: string;
  total_claimed: string;
  pending_rewards: string;
  epochs: {
    epoch: number;
    amount: string;
    claimed: boolean;
    claim_tx?: string;
  }[];
}

export const rewardsAPI = {
  getMerkleProof: async (address: string, epoch: number): Promise<MerkleProof> => {
    return apiClient.get<MerkleProof>(`/api/v1/rewards/proof/${address}/${epoch}`);
  },

  getCurrentEpoch: async (): Promise<RewardEpoch> => {
    return apiClient.get<RewardEpoch>('/api/v1/rewards/epoch/current');
  },

  getEpoch: async (epoch: number): Promise<RewardEpoch> => {
    return apiClient.get<RewardEpoch>(`/api/v1/rewards/epoch/${epoch}`);
  },

  getUserRewards: async (address: string): Promise<UserRewards> => {
    return apiClient.get<UserRewards>(`/api/v1/rewards/user/${address}`);
  },

  getPendingRewards: async (address: string): Promise<{ amount: string; epochs: number[] }> => {
    return apiClient.get(`/api/v1/rewards/user/${address}/pending`);
  },

  verifyProof: async (
    address: string,
    epoch: number,
    amount: string,
    proof: string[]
  ): Promise<{ valid: boolean }> => {
    return apiClient.post('/api/v1/rewards/verify', {
      address,
      epoch,
      amount,
      proof
    });
  }
};
