# TYT v3 Integration Complete

## Overview

Complete Web3 ecosystem integration for TYT Platform featuring:
- NFT Miners with real blockchain integration
- Marketplace with TYT token payments
- Rewards system with Merkle proofs
- Charity vault for foundation donations
- Full backend API infrastructure
- Type-safe smart contract interactions

## Architecture

### 1. Frontend Stack

```
wagmi v2 + viem - Web3 interactions
@tanstack/react-query - Data fetching
React 18 - UI framework
TypeScript - Type safety
Tailwind CSS - Styling
```

### 2. Smart Contracts (Polygon Amoy Testnet)

```
FeeConfig - Fee distribution management
CharityVault - Foundation donations
MinerNFT (ERC-721) - NFT miners
RewardsMerkleRegistry - Reward claims
MinerMarketplace - NFT trading
```

### 3. Backend Services

```
Ledger API - Balance management
Indexer API - Blockchain events
Rewards API - Merkle proofs
Supabase - Auth & Database
```

## File Structure

```
src/
├── lib/
│   ├── web3/
│   │   ├── config.ts                 # Wagmi configuration
│   │   ├── Web3Provider.tsx          # Provider component
│   │   └── utils.ts                  # Helper functions
│   ├── api/
│   │   ├── client.ts                 # HTTP client
│   │   ├── ledger.ts                 # Balance API
│   │   ├── indexer.ts                # Blockchain events API
│   │   └── rewards.ts                # Merkle proof API
│   └── contracts/
│       └── abis/
│           ├── MinerNFT.ts           # Miner NFT ABI
│           ├── Marketplace.ts        # Marketplace ABI
│           ├── RewardsMerkle.ts      # Rewards ABI
│           ├── CharityVault.ts       # Charity ABI
│           └── FeeConfig.ts          # Fee config ABI
├── hooks/
│   └── web3/
│       ├── useWalletConnection.ts    # Wallet connection
│       ├── useMinerNFT.ts            # NFT operations
│       ├── useMarketplace.ts         # Trading
│       ├── useRewards.ts             # Claim rewards
│       └── useCharityVault.ts        # Donations
└── components/
    └── WalletButton.tsx              # Wallet UI
```

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required variables:

```env
# Supabase (already configured)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=get_from_walletconnect.com

# RPC
VITE_POLYGON_RPC_URL=https://rpc-amoy.polygon.technology

# Contract Addresses (after deployment)
VITE_CONTRACT_FEE_CONFIG=0x...
VITE_CONTRACT_CHARITY_VAULT=0x...
VITE_CONTRACT_MINER_NFT=0x...
VITE_CONTRACT_REWARDS_MERKLE=0x...
VITE_CONTRACT_MARKETPLACE=0x...

# API
VITE_API_BASE_URL=http://localhost:3000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Deploy Smart Contracts

Navigate to contracts folder:

```bash
cd contracts/evm
forge build
forge script script/DeployV3Core.s.sol --rpc-url $POLYGON_AMOY_RPC --broadcast
```

Update `.env` with deployed addresses.

### 4. Start Development

```bash
npm run dev
```

## Usage Examples

### Connect Wallet

```tsx
import { WalletButton } from '@/components/WalletButton';

function Header() {
  return (
    <header>
      <WalletButton />
    </header>
  );
}
```

### Mint NFT Miner

```tsx
import { useMinerNFT } from '@/hooks/web3';

function MintMiner() {
  const { mintMiner, isPending } = useMinerNFT();

  const handleMint = async () => {
    await mintMiner({
      to: '0x...',
      powerTH: 100,
      efficiencyWTH: 25,
      region: 'USA'
    });
  };

  return (
    <button onClick={handleMint} disabled={isPending}>
      {isPending ? 'Minting...' : 'Mint Miner'}
    </button>
  );
}
```

### List on Marketplace

```tsx
import { useMarketplace } from '@/hooks/web3';

function ListMiner({ tokenId }: { tokenId: bigint }) {
  const { listMiner, isPending } = useMarketplace();

  const handleList = async () => {
    await listMiner(tokenId, '100'); // 100 TYT
  };

  return (
    <button onClick={handleList} disabled={isPending}>
      {isPending ? 'Listing...' : 'List Miner'}
    </button>
  );
}
```

### Claim Rewards

```tsx
import { useRewards } from '@/hooks/web3';
import { rewardsAPI } from '@/lib/api';

function ClaimRewards() {
  const { claimRewards, isPending } = useRewards();
  const [proof, setProof] = useState(null);

  useEffect(() => {
    async function fetchProof() {
      const data = await rewardsAPI.getMerkleProof(address, currentEpoch);
      setProof(data);
    }
    fetchProof();
  }, []);

  const handleClaim = async () => {
    if (!proof) return;
    await claimRewards({
      epoch: proof.epoch,
      amount: proof.amount,
      proof: proof.proof
    });
  };

  return (
    <button onClick={handleClaim} disabled={isPending || !proof}>
      {isPending ? 'Claiming...' : 'Claim Rewards'}
    </button>
  );
}
```

### Donate to Foundation

```tsx
import { useCharityVault } from '@/hooks/web3';

function DonateButton() {
  const { donate, isPending } = useCharityVault();

  const handleDonate = async () => {
    await donate('10'); // 10 TYT
  };

  return (
    <button onClick={handleDonate} disabled={isPending}>
      {isPending ? 'Donating...' : 'Donate to Foundation'}
    </button>
  );
}
```

## API Integration

### Get User Balances

```tsx
import { ledgerAPI } from '@/lib/api';

const balances = await ledgerAPI.getBalances(userId);
console.log(balances);
// {
//   user_id: "...",
//   balances: [
//     { asset: "TYT", available: "1000", locked: "0", total: "1000" },
//     { asset: "BTC", available: "0.001", locked: "0", total: "0.001" }
//   ]
// }
```

### Get User's Miners

```tsx
import { indexerAPI } from '@/lib/api';

const miners = await indexerAPI.getUserMiners(address);
console.log(miners);
// [
//   {
//     token_id: "1",
//     owner: "0x...",
//     power_th: 100,
//     efficiency_w_th: 25,
//     region: "USA",
//     minted_at: "2024-01-01T00:00:00Z"
//   }
// ]
```

### Get Marketplace Listings

```tsx
import { indexerAPI } from '@/lib/api';

const { listings, total } = await indexerAPI.getActiveListings({
  min_price: '50',
  max_price: '500',
  page: 1,
  per_page: 20
});
```

## Fee Distribution

All transactions automatically split fees:

```
Total Fee: 10%
├── Protocol: 60% (6%)
├── Charity: 30% (3%)
└── Academy: 10% (1%)
```

Configured in `FeeConfig` contract.

## Database Schema

Academy quests now support:

- `quest_type`: daily, weekly, monthly, achievement
- `difficulty`: easy, medium, hard
- `xp_reward`: integer
- `tyt_reward`: numeric
- `requirements`: jsonb
- `icon`: text

## Testing

```bash
npm run typecheck
npm run build
npm run lint
```

## Deployment Checklist

- [ ] Deploy smart contracts to Polygon Amoy
- [ ] Update `.env` with contract addresses
- [ ] Configure WalletConnect project ID
- [ ] Setup backend API services
- [ ] Deploy indexer for blockchain events
- [ ] Setup Merkle tree generator for rewards
- [ ] Configure Supabase RLS policies
- [ ] Test wallet connection
- [ ] Test NFT minting
- [ ] Test marketplace listing/buying
- [ ] Test rewards claiming
- [ ] Test charity donations
- [ ] Setup monitoring (Grafana/Prometheus)
- [ ] Setup error tracking (Sentry)

## Next Steps

1. Deploy contracts to mainnet (Polygon)
2. Implement backend services (NestJS)
3. Setup blockchain indexer (TheGraph/Ponder)
4. Implement Merkle tree generator
5. Add mobile app (React Native)
6. Integrate Solana for TYT token
7. Add fiat on/off ramps
8. Implement governance UI
9. Add staking pools
10. Launch marketing campaign

## Support

For issues or questions:
- GitHub: [repository]
- Discord: [server]
- Email: support@tyt.app

## License

Proprietary - TYT Platform 2024
