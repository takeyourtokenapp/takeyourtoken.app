# ⚡ TYT v3 — QUICK START GUIDE

**Цель**: Запустить TYT v3 production за 3-4 недели

---

## 🚀 STEP-BY-STEP EXECUTION

### ✅ STEP 0: Current Status Check

```bash
# Проверяем текущее состояние
cd /your/project/tyt.app

# База данных
echo "✅ Supabase: 120+ tables deployed"

# Edge Functions
echo "✅ Edge Functions: 18 active"

# Frontend
echo "✅ Frontend: 60+ components ready"

# Contracts
echo "⚠️ Smart Contracts: Code ready, NOT deployed"
```

---

### 🔹 STEP 1: Deploy Smart Contracts (Day 1-2)

**Action**: Открыть НОВУЮ сессию bolt.new

**Prompt to Use**:
```
См. docs/AGENT_PROMPTS_V3.md → PROMPT 1 (contracts-agent)
```

**Или кратко**:
```
Deploy TYT v3 smart contracts to Polygon Amoy testnet:
- FeeConfig.sol (fee management)
- CharityVault.sol (donations)
- MinerNFT.sol (ERC-721 miners)
- RewardsMerkleRegistry.sol (rewards proofs)
- MinerMarketplace.sol (NFT trading)

Use Foundry. Configure 60/30/10 fee split (protocol/charity/academy).
Create deploy script, test, deploy to Amoy, verify on Polygonscan.
Output: deployments/amoy.json with addresses.
```

**Expected Output**:
```json
{
  "network": "polygon_amoy",
  "contracts": {
    "FeeConfig": { "address": "0x123..." },
    "CharityVault": { "address": "0x456..." },
    "MinerNFT": { "address": "0x789..." },
    "RewardsMerkleRegistry": { "address": "0xabc..." },
    "MinerMarketplace": { "address": "0xdef..." }
  }
}
```

**Merge Back**: Скопировать `amoy.json` в текущую сессию

---

### 🔹 STEP 2: Update .env (Day 2)

**Action**: Добавить contract addresses

```bash
# В файл .env добавить:
VITE_POLYGON_AMOY_CHAIN_ID=80002
VITE_POLYGON_AMOY_RPC=https://rpc-amoy.polygon.technology

VITE_CONTRACT_FEE_CONFIG=0x123...
VITE_CONTRACT_CHARITY_VAULT=0x456...
VITE_CONTRACT_MINER_NFT=0x789...
VITE_CONTRACT_REWARDS_REGISTRY=0xabc...
VITE_CONTRACT_MARKETPLACE=0xdef...

VITE_ALCHEMY_KEY=your_alchemy_key
```

**Verify**:
```bash
grep "VITE_CONTRACT" .env
# Должны увидеть все 5 адресов
```

---

### 🔹 STEP 3: Install Web3 Dependencies (Day 2)

```bash
npm install wagmi viem @rainbow-me/rainbowkit \
  @tanstack/react-query \
  ethers@^6
```

**Create Config**:
```typescript
// src/config/contracts.ts
export const CONTRACTS = {
  FEE_CONFIG: import.meta.env.VITE_CONTRACT_FEE_CONFIG as `0x${string}`,
  CHARITY_VAULT: import.meta.env.VITE_CONTRACT_CHARITY_VAULT as `0x${string}`,
  MINER_NFT: import.meta.env.VITE_CONTRACT_MINER_NFT as `0x${string}`,
  REWARDS_REGISTRY: import.meta.env.VITE_CONTRACT_REWARDS_REGISTRY as `0x${string}`,
  MARKETPLACE: import.meta.env.VITE_CONTRACT_MARKETPLACE as `0x${string}`,
} as const;

export const POLYGON_AMOY = {
  id: 80002,
  name: 'Polygon Amoy Testnet',
  network: 'polygon-amoy',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-amoy.polygon.technology'] },
    public: { http: ['https://rpc-amoy.polygon.technology'] },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
};
```

---

### 🔹 STEP 4: Export ABIs (Day 2)

```bash
cd contracts/evm
forge build

# Создать папку для ABIs
mkdir -p ../../src/abis

# Копировать ABIs
cp out/FeeConfig.sol/FeeConfig.json ../../src/abis/
cp out/CharityVault.sol/CharityVault.json ../../src/abis/
cp out/MinerNFT.sol/MinerNFT.json ../../src/abis/
cp out/RewardsMerkleRegistry.sol/RewardsMerkleRegistry.json ../../src/abis/
cp out/MinerMarketplace.sol/MinerMarketplace.json ../../src/abis/

echo "✅ ABIs exported"
```

---

### 🔹 STEP 5: Update Web3Context (Day 3)

**File**: `src/contexts/Web3Context.tsx`

**Replace with**:
```typescript
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains'; // или custom POLYGON_AMOY
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';

const { chains, publicClient } = configureChains(
  [polygonAmoy],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_KEY }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'TYT - TakeYourToken',
  projectId: 'your_walletconnect_project_id',
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export function Web3Provider({ children }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

---

### 🔹 STEP 6: Connect Miners Page (Day 3-4)

**File**: `src/pages/app/Miners.tsx`

**Replace Mock Data**:
```typescript
import { useContractRead } from 'wagmi';
import { CONTRACTS } from '@/config/contracts';
import MinerNFTABI from '@/abis/MinerNFT.json';

function MinersPage() {
  const { address } = useAccount();

  // Read user's miners from blockchain
  const { data: minerCount } = useContractRead({
    address: CONTRACTS.MINER_NFT,
    abi: MinerNFTABI.abi,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: minerIds } = useContractRead({
    address: CONTRACTS.MINER_NFT,
    abi: MinerNFTABI.abi,
    functionName: 'tokensOfOwner', // если есть enumerable
    args: [address],
  });

  // Для каждого tokenId загрузить MinerData
  // ...
}
```

---

### 🔹 STEP 7: Test E2E Flow (Day 5-6)

**Test Scenario 1: Mint Miner**
```bash
1. User connects wallet (MetaMask)
2. User goes to /app/miners
3. User clicks "Mint Miner"
4. Transaction sent to MinerNFT.mintMiner()
5. User sees new miner in UI
6. Verify on Polygonscan
```

**Test Scenario 2: Claim Rewards**
```bash
1. Admin publishes Merkle root to RewardsMerkleRegistry
2. User goes to /app/rewards
3. User sees claimable rewards
4. User clicks "Claim"
5. Frontend fetches Merkle proof from Supabase
6. Transaction sent with proof
7. User receives BTC/TYT
```

**Test Scenario 3: List on Marketplace**
```bash
1. User goes to /app/marketplace
2. User clicks "Sell My Miner"
3. Sets price in TYT
4. Approves NFT transfer
5. Transaction sent to Marketplace.listMiner()
6. Listing appears on marketplace
7. Another user buys it
8. Fee distributed: 60% protocol / 30% charity / 10% academy
```

---

### 🔹 STEP 8: Build & Deploy (Day 7)

```bash
# Build production
npm run build

# Check dist/ folder
ls -la dist/

# Deploy to Hostinger
scp -r dist/* user@your-server:/var/www/tyt.app/

# Configure nginx
sudo nano /etc/nginx/sites-available/tyt.app
# Add SSL (certbot)
sudo certbot --nginx -d tyt.app -d www.tyt.app

# Restart nginx
sudo systemctl restart nginx

# Verify
curl https://tyt.app
```

---

## 🎯 SUCCESS CRITERIA

### ✅ System is LIVE when:

1. **Contracts Deployed** ✅
   - All 5 contracts on Polygon Amoy
   - Verified on Polygonscan
   - Fee profiles configured

2. **Frontend Connected** ✅
   - Users can connect wallet
   - Mint miner NFT works
   - Marketplace listing works
   - Claim rewards works

3. **Fees Working** ✅
   - 10% deposit fee collected
   - Split 60/30/10 to protocol/charity/academy
   - Charity vault balance visible on Foundation page

4. **Database Synced** ✅
   - On-chain events → Supabase tables
   - Realtime updates in UI

5. **Monitoring Active** ✅
   - Sentry for errors
   - Analytics for user activity
   - Blockchain indexer running

---

## 📊 PROGRESS TRACKING

```
[ ] Step 1: Deploy contracts (2 days)
[ ] Step 2: Update .env (1 hour)
[ ] Step 3: Install Web3 deps (1 hour)
[ ] Step 4: Export ABIs (30 min)
[ ] Step 5: Update Web3Context (2 hours)
[ ] Step 6: Connect Miners page (1 day)
[ ] Step 7: Test E2E (2 days)
[ ] Step 8: Production deploy (1 day)

TOTAL: ~7 days of focused work
```

---

## 🚨 BLOCKERS & SOLUTIONS

### Blocker 1: "No deployer wallet"
**Solution**:
```bash
cast wallet new
# Fund with MATIC from https://faucet.polygon.technology/
```

### Blocker 2: "Web3 connection fails"
**Solution**:
```bash
# Check .env has correct RPC URL
# Check wallet is connected to Amoy network (chainId 80002)
# Check contract addresses are correct
```

### Blocker 3: "Transaction reverts"
**Solution**:
```bash
# Check contract has proper role assignments
# Check user has approved token spending
# Check fee calculation is correct
# Use Polygonscan to debug transaction
```

---

## 📞 SUPPORT & RESOURCES

**Polygon Amoy**:
- RPC: https://rpc-amoy.polygon.technology
- Explorer: https://amoy.polygonscan.com
- Faucet: https://faucet.polygon.technology/

**Wagmi Docs**: https://wagmi.sh/
**RainbowKit**: https://www.rainbowkit.com/
**Viem**: https://viem.sh/

**TYT Docs**:
- `V3_INTEGRATION_STATUS.md` — Full status report
- `docs/AGENT_PROMPTS_V3.md` — All prompts
- `TYT_V2_MASTER_BLUEPRINT.md` — Architecture

---

## ✨ FINAL NOTES

**TYT v3 is 75% complete.**

Remaining work:
- Deploy contracts (PRIORITY #1)
- Connect frontend to blockchain
- Test thoroughly
- Launch to limited users
- Iterate based on feedback

**Timeline**: 3-4 weeks to production
**Team Size**: 1 full-time developer
**Budget**: ~$500 (deployment gas, server, domains)

**After Launch**:
- Deploy to Polygon Mainnet
- Integrate with pump.fun (TYT token on Solana)
- Launch foundation campaigns
- Scale marketing
- Onboard 10,000 users in Q1 2025

---

*🦉 Built with care by TYT Team*
*For questions: See V3_INTEGRATION_STATUS.md*
