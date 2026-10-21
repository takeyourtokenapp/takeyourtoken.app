# 🚀 TYT V2 DEPLOYMENT GUIDE

Complete guide for deploying TYT Ecosystem V2 smart contracts to Polygon.

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment](#post-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 PREREQUISITES

### Required Tools

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Verify installation
forge --version
cast --version

# 3. Install dependencies
cd contracts/evm
forge install
```

### Required Accounts

1. **Alchemy Account** (Recommended)
   - Sign up: https://www.alchemy.com/
   - Create new app → Polygon Amoy
   - Copy API key

2. **PolygonScan Account**
   - Sign up: https://polygonscan.com/
   - Go to API Keys section
   - Create new API key

3. **Wallet with Testnet MATIC**
   - Export private key from MetaMask
   - Get testnet MATIC from faucet

---

## ⚙️ ENVIRONMENT SETUP

### Step 1: Get Testnet MATIC

```bash
# 1. Visit Polygon Faucet
https://faucet.polygon.technology/

# 2. Select "Polygon Amoy"
# 3. Enter your wallet address
# 4. Request 0.5 MATIC

# 5. Verify balance
cast balance YOUR_ADDRESS --rpc-url https://rpc-amoy.polygon.technology/
```

### Step 2: Get Alchemy API Key

```bash
# 1. Go to https://www.alchemy.com/
# 2. Sign up / Log in
# 3. Create New App
#    - Chain: Polygon
#    - Network: Polygon Amoy
# 4. View Key → Copy HTTP URL

# Your RPC URL will look like:
# https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
```

### Step 3: Get PolygonScan API Key

```bash
# 1. Go to https://polygonscan.com/
# 2. Sign up / Log in
# 3. My Profile → API Keys
# 4. Add → Create new API key
# 5. Copy the API key
```

### Step 4: Create .env File

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

### Step 5: Configure .env

```bash
# ============================================
# REQUIRED VALUES
# ============================================

# Your wallet private key (from MetaMask)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Alchemy RPC URL
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY

# PolygonScan API Key
POLYGONSCAN_API_KEY=YOUR_API_KEY_HERE

# ============================================
# WALLET ADDRESSES
# ============================================

# Set to your deployer address for testing
PROTOCOL_TREASURY=0xYOUR_ADDRESS
CHARITY_VAULT=0xYOUR_ADDRESS
ACADEMY_VAULT=0xYOUR_ADDRESS
ADMIN_ADDRESS=0xYOUR_ADDRESS

# ============================================
# FEE CONFIGURATION
# ============================================

# Default fees (100 basis points = 1%)
MINT_FEE_BPS=150          # 1.5%
MARKETPLACE_FEE_BPS=250   # 2.5%
WITHDRAWAL_FEE_BPS=50     # 0.5%
MAINTENANCE_FEE_BPS=100   # 1.0%
DEPOSIT_FEE_BPS=100       # 1.0%

# Timelock (seconds)
TIMELOCK_DURATION=172800  # 2 days
```

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Code Review

- [ ] All contracts compile without errors
- [ ] All tests pass
- [ ] Gas optimization reviewed
- [ ] Security considerations addressed
- [ ] Comments and documentation complete

```bash
# Run checks
forge build
forge test
```

### Configuration Review

- [ ] `.env` file created and configured
- [ ] All wallet addresses valid
- [ ] Fee percentages correct (must sum to 100%)
- [ ] Timelock duration appropriate
- [ ] RPC URL working
- [ ] PolygonScan API key valid

### Testnet Preparation

- [ ] Deployer wallet has sufficient MATIC (0.5+ recommended)
- [ ] Network connectivity verified
- [ ] Block explorer accessible

```bash
# Check balance
cast balance $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL

# Check RPC connection
cast block-number --rpc-url $AMOY_RPC_URL
```

---

## 🚀 DEPLOYMENT STEPS

### Option 1: Deploy with Verification (Recommended)

```bash
# Full deployment with automatic verification
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig \
  --rpc-url $AMOY_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  -vvvv

# Expected output:
# ✅ FeeConfigGovernance deployed: 0x...
# ✅ CharityVault deployed: 0x...
# ✅ AcademyVault deployed: 0x...
# ✅ MinerNFT deployed: 0x...
# ✅ MinerMarketplace deployed: 0x...
# ✅ RewardsMerkleRegistry deployed: 0x...
# ✅ All contracts verified on PolygonScan
```

### Option 2: Deploy without Verification

```bash
# Deploy first, verify later
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig \
  --rpc-url $AMOY_RPC_URL \
  --broadcast \
  -vvvv
```

### Option 3: Dry Run (Simulation Only)

```bash
# Test deployment without broadcasting
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig \
  --rpc-url $AMOY_RPC_URL \
  -vvvv
```

### Deployment Output

The script will save deployment addresses to:
```
deployments/amoy.json
```

Example:
```json
{
  "feeConfig": "0x1234...",
  "charityVault": "0x5678...",
  "academyVault": "0x9abc...",
  "minerNFT": "0xdef0...",
  "marketplace": "0x1111...",
  "rewardsMerkle": "0x2222...",
  "deployer": "0x3333...",
  "timestamp": "2025-12-14T15:30:00Z",
  "network": "amoy"
}
```

---

## 📝 POST-DEPLOYMENT

### Step 1: Verify Deployment

```bash
# Check deployment file
cat deployments/amoy.json

# Verify each contract exists
cast code $FEE_CONFIG_ADDRESS --rpc-url $AMOY_RPC_URL
cast code $MINER_NFT_ADDRESS --rpc-url $AMOY_RPC_URL
cast code $MARKETPLACE_ADDRESS --rpc-url $AMOY_RPC_URL
```

### Step 2: Verify Contract Settings

```bash
# Check FeeConfig
cast call $FEE_CONFIG_ADDRESS "protocolTreasury()" --rpc-url $AMOY_RPC_URL
cast call $FEE_CONFIG_ADDRESS "charityVault()" --rpc-url $AMOY_RPC_URL
cast call $FEE_CONFIG_ADDRESS "academyVault()" --rpc-url $AMOY_RPC_URL

# Check fee profiles (0 = mint, 1 = marketplace, etc.)
cast call $FEE_CONFIG_ADDRESS "getFeeProfile(uint8)(uint16,uint16,uint16,uint16)" 0 --rpc-url $AMOY_RPC_URL

# Check MinerNFT
cast call $MINER_NFT_ADDRESS "name()" --rpc-url $AMOY_RPC_URL
cast call $MINER_NFT_ADDRESS "feeConfig()" --rpc-url $AMOY_RPC_URL
```

### Step 3: Update Frontend Configuration

Update `project/.env`:

```bash
# Add contract addresses from deployment
VITE_FEE_CONFIG_ADDRESS=0x...
VITE_CHARITY_VAULT_ADDRESS=0x...
VITE_ACADEMY_VAULT_ADDRESS=0x...
VITE_MINER_NFT_ADDRESS=0x...
VITE_MARKETPLACE_ADDRESS=0x...
VITE_REWARDS_MERKLE_ADDRESS=0x...

# Network configuration
VITE_CHAIN_ID=80002
VITE_NETWORK_NAME=Polygon Amoy
VITE_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
VITE_EXPLORER_URL=https://amoy.polygonscan.com
```

### Step 4: Test Contract Interactions

```bash
# Test mint NFT
cast send $MINER_NFT_ADDRESS \
  "mint(address,uint256,uint256,uint8)" \
  $YOUR_ADDRESS 100 35 0 \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY \
  --value 0.01ether

# Check NFT balance
cast call $MINER_NFT_ADDRESS \
  "balanceOf(address)" \
  $YOUR_ADDRESS \
  --rpc-url $AMOY_RPC_URL

# Check fee distribution
cast call $FEE_CONFIG_ADDRESS \
  "protocolBalance()" \
  --rpc-url $AMOY_RPC_URL
```

---

## ✅ VERIFICATION

### Manual Verification (if auto-verify failed)

```bash
# Verify FeeConfigGovernance
forge verify-contract \
  $FEE_CONFIG_ADDRESS \
  src/FeeConfigGovernance.sol:FeeConfigGovernance \
  --chain-id 80002 \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address,uint256)" $PROTOCOL $CHARITY $ACADEMY $TIMELOCK)

# Verify MinerNFT
forge verify-contract \
  $MINER_NFT_ADDRESS \
  src/MinerNFT.sol:MinerNFT \
  --chain-id 80002 \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address)" $FEE_CONFIG_ADDRESS)

# Verify Marketplace
forge verify-contract \
  $MARKETPLACE_ADDRESS \
  src/MinerMarketplace.sol:MinerMarketplace \
  --chain-id 80002 \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" $MINER_NFT_ADDRESS $FEE_CONFIG_ADDRESS)
```

### Check Verification Status

```bash
# View on PolygonScan
https://amoy.polygonscan.com/address/$CONTRACT_ADDRESS

# Should see:
# ✅ Contract Source Code Verified
# ✅ Read Contract functions available
# ✅ Write Contract functions available
```

---

## 🧪 TESTING ON TESTNET

### Create Test Scenario

```bash
# 1. Mint a miner NFT
cast send $MINER_NFT_ADDRESS \
  "mint(address,uint256,uint256,uint8)" \
  $YOUR_ADDRESS 100 35 0 \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY \
  --value 0.01ether

# 2. Check NFT ID
TOKEN_ID=$(cast call $MINER_NFT_ADDRESS "tokenOfOwnerByIndex(address,uint256)" $YOUR_ADDRESS 0 --rpc-url $AMOY_RPC_URL)

# 3. Approve marketplace
cast send $MINER_NFT_ADDRESS \
  "approve(address,uint256)" \
  $MARKETPLACE_ADDRESS $TOKEN_ID \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY

# 4. List on marketplace
cast send $MARKETPLACE_ADDRESS \
  "listMiner(uint256,uint256,address)" \
  $TOKEN_ID 1000000000000000000 0x0000000000000000000000000000000000000000 \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY

# 5. Check listing
cast call $MARKETPLACE_ADDRESS \
  "listings(uint256)" \
  $TOKEN_ID \
  --rpc-url $AMOY_RPC_URL

# 6. Check fee balances
echo "Protocol:" $(cast call $FEE_CONFIG_ADDRESS "protocolBalance()" --rpc-url $AMOY_RPC_URL)
echo "Charity:" $(cast call $FEE_CONFIG_ADDRESS "charityBalance()" --rpc-url $AMOY_RPC_URL)
echo "Academy:" $(cast call $FEE_CONFIG_ADDRESS "academyBalance()" --rpc-url $AMOY_RPC_URL)
```

---

## 🔧 TROUBLESHOOTING

### Issue: "Insufficient funds"

```bash
# Check balance
cast balance $YOUR_ADDRESS --rpc-url $AMOY_RPC_URL

# Get more testnet MATIC
https://faucet.polygon.technology/
```

### Issue: "RPC error"

```bash
# Try alternative RPC
export AMOY_RPC_URL=https://rpc-amoy.polygon.technology/

# Or use Infura
export AMOY_RPC_URL=https://polygon-amoy.infura.io/v3/YOUR_KEY
```

### Issue: "Verification failed"

```bash
# Check API key
echo $POLYGONSCAN_API_KEY

# Wait 30 seconds and retry
sleep 30
forge verify-contract $CONTRACT_ADDRESS ...
```

### Issue: "Nonce too high"

```bash
# Reset nonce
cast nonce $YOUR_ADDRESS --rpc-url $AMOY_RPC_URL
```

### Issue: "Contract already deployed"

```bash
# Check if contracts exist
cast code $CONTRACT_ADDRESS --rpc-url $AMOY_RPC_URL

# If you want to redeploy, use a different deployer or change salt
```

---

## 📊 GAS ESTIMATION

Typical gas costs on Polygon Amoy:

```
Contract                  | Gas Used  | Cost (MATIC)
-------------------------|-----------|-------------
FeeConfigGovernance      | ~3.5M     | ~0.007
CharityVault             | ~1.2M     | ~0.002
AcademyVault             | ~1.5M     | ~0.003
MinerNFT                 | ~4.2M     | ~0.008
MinerMarketplace         | ~3.8M     | ~0.007
RewardsMerkleRegistry    | ~1.5M     | ~0.003
-------------------------|-----------|-------------
TOTAL                    | ~15.7M    | ~0.03 MATIC
```

---

## 🎯 MAINNET DEPLOYMENT

### Additional Precautions

1. **Security Audit**
   - Get professional audit before mainnet
   - Review all findings
   - Implement fixes

2. **Multi-Sig Setup**
   - Use Gnosis Safe for admin
   - Set up 2-of-3 or 3-of-5 multi-sig
   - Test all operations

3. **Gradual Rollout**
   - Deploy with low limits initially
   - Monitor for issues
   - Gradually increase limits

4. **Monitoring**
   - Set up Tenderly alerts
   - Monitor all transactions
   - Track fee distributions

### Mainnet Deployment Command

```bash
# Deploy to Polygon Mainnet
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig \
  --rpc-url $POLYGON_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  -vvvv

# IMPORTANT: Use hardware wallet for mainnet!
# IMPORTANT: Test everything on testnet first!
# IMPORTANT: Have emergency pause mechanism ready!
```

---

## 📞 SUPPORT

### Resources

- **Documentation:** `FEE_SYSTEM_INTEGRATION_GUIDE.md`
- **Contracts:** `contracts/evm/src/`
- **Tests:** `contracts/evm/test/`
- **Deployment Script:** `contracts/evm/script/DeployV3WithFeeConfig.s.sol`

### Common Commands Reference

```bash
# Build contracts
forge build

# Run tests
forge test

# Check coverage
forge coverage

# Gas report
forge test --gas-report

# Deploy
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig --broadcast

# Verify
forge verify-contract $ADDRESS $CONTRACT --chain-id $CHAIN_ID

# Interact
cast call $ADDRESS "functionName()" --rpc-url $RPC
cast send $ADDRESS "functionName()" --rpc-url $RPC --private-key $KEY
```

---

## ✅ DEPLOYMENT COMPLETE!

Once deployed, you should have:

- ✅ All contracts on Polygon Amoy
- ✅ Verified on PolygonScan
- ✅ Addresses saved to `deployments/amoy.json`
- ✅ Frontend `.env` updated
- ✅ Test transactions successful
- ✅ Fee distributions working

**Next Steps:**
1. Update frontend with contract addresses
2. Test complete user flows
3. Deploy to production when ready
4. Set up monitoring and alerts

---

**Happy Deploying!** 🚀

*TYT Ecosystem V2 - Building the future of Mining-to-Medicine*
