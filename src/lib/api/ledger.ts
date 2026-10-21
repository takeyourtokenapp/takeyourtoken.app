import { apiClient } from './client';

export interface Balance {
  asset: string;
  available: string;
  locked: string;
  total: string;
}

export interface BalanceResponse {
  user_id: string;
  balances: Balance[];
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  asset: string;
  amount: string;
  type: 'credit' | 'debit';
  category: string;
  reference_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  page: number;
  per_page: number;
}

export const ledgerAPI = {
  getBalances: async (userId: string): Promise<BalanceResponse> => {
    return apiClient.get<BalanceResponse>(`/api/v1/ledger/users/${userId}/balances`);
  },

  getBalance: async (userId: string, asset: string): Promise<Balance> => {
    return apiClient.get<Balance>(`/api/v1/ledger/users/${userId}/balances/${asset}`);
  },

  getTransactionHistory: async (
    userId: string,
    params?: {
      asset?: string;
      type?: 'credit' | 'debit';
      category?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<TransactionHistory> => {
    return apiClient.get<TransactionHistory>(
      `/api/v1/ledger/users/${userId}/transactions`,
      { params }
    );
  },

  getTransaction: async (userId: string, transactionId: string): Promise<Transaction> => {
    return apiClient.get<Transaction>(
      `/api/v1/ledger/users/${userId}/transactions/${transactionId}`
    );
  }
};
