import { http, createConfig } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

export const config = createConfig({
  chains: [polygonAmoy],
  connectors: [
    injected(),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'TYT Platform',
        description: 'Web3 Mining Platform • Token Economy • Children\'s Brain Cancer Foundation',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://tyt.app',
        icons: ['https://tyt.app/favicon.svg']
      }
    })
  ],
  transports: {
    [polygonAmoy.id]: http(import.meta.env.VITE_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology')
  }
});

export const contractAddresses = {
  feeConfig: (import.meta.env.VITE_CONTRACT_FEE_CONFIG || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  charityVault: (import.meta.env.VITE_CONTRACT_CHARITY_VAULT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  minerNFT: (import.meta.env.VITE_CONTRACT_MINER_NFT || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  rewardsMerkle: (import.meta.env.VITE_CONTRACT_REWARDS_MERKLE || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  marketplace: (import.meta.env.VITE_CONTRACT_MARKETPLACE || '0x0000000000000000000000000000000000000000') as `0x${string}`
} as const;

export const isContractsConfigured = Object.values(contractAddresses).every(
  addr => addr !== '0x0000000000000000000000000000000000000000'
);

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
