# TYT Platform v3 - Quick Start

## Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or WalletConnect compatible wallet
- Polygon Amoy testnet MATIC (get from faucet)

## Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
# Edit .env and add your values
```

## Required Environment Variables

```env
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_key>
VITE_WALLETCONNECT_PROJECT_ID=<get_from_walletconnect.com>
VITE_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Key Features

### 1. Wallet Connection
- Connect MetaMask or WalletConnect
- Automatic network detection (Polygon Amoy)
- Address display and disconnect

### 2. NFT Miners
- Mint miners with custom power and efficiency
- Upgrade existing miners
- View miner metadata

### 3. Marketplace
- List miners for sale (TYT token)
- Buy miners from other users
- Cancel listings

### 4. Rewards
- Claim daily mining rewards
- Merkle proof verification
- Automatic distribution

### 5. Charity Foundation
- Donate to children's brain cancer research
- View total donations
- Track personal contributions

## Project Structure

```
src/
├── components/          # React components
│   └── WalletButton.tsx
├── hooks/
│   └── web3/           # Web3 hooks
│       ├── useWalletConnection.ts
│       ├── useMinerNFT.ts
│       ├── useMarketplace.ts
│       ├── useRewards.ts
│       └── useCharityVault.ts
├── lib/
│   ├── web3/           # Web3 configuration
│   ├── api/            # API clients
│   └── contracts/      # ABIs
└── pages/              # App pages
```

## Smart Contracts (Polygon Amoy)

Contracts will be deployed to:
- FeeConfig: Fee distribution
- CharityVault: Foundation donations
- MinerNFT: NFT miners (ERC-721)
- RewardsMerkleRegistry: Reward claims
- MinerMarketplace: Trading

## API Endpoints

```
/api/v1/ledger          # Balance management
/api/v1/indexer         # Blockchain events
/api/v1/rewards         # Merkle proofs
```

## Testing

1. Connect wallet to Polygon Amoy testnet
2. Get testnet MATIC from faucet
3. Mint a test miner
4. List on marketplace
5. Claim rewards (if eligible)
6. Make a donation

## Resources

- [Full Documentation](./V3_INTEGRATION_COMPLETE.md)
- [Polygon Amoy Faucet](https://faucet.polygon.technology/)
- [WalletConnect Project ID](https://cloud.walletconnect.com/)
- [Supabase Setup](https://supabase.com/)

## Support

Need help? Check the full integration guide or contact support.
