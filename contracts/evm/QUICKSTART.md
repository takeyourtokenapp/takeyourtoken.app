# 🚀 TYT V2 LOCAL DEPLOYMENT QUICKSTART

**Complete step-by-step guide to deploy TYT V2 contracts from your Mac to Polygon Amoy testnet.**

**Time to deploy:** 30-45 minutes (first time)

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Install Foundry](#install-foundry)
3. [Clone Repository](#clone-repository)
4. [Get Testnet Resources](#get-testnet-resources)
5. [Configure Environment](#configure-environment)
6. [Deploy Contracts](#deploy-contracts)
7. [Verify Contracts](#verify-contracts)
8. [Test Deployment](#test-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Next Steps](#next-steps)

---

## 🔧 PREREQUISITES

Before starting, make sure you have:

- ✅ **macOS** (10.15 or newer)
- ✅ **Terminal** access
- ✅ **MetaMask** installed
- ✅ **Git** installed
- ✅ **Internet connection**

### Check if Git is installed:

```bash
git --version
# Should output: git version 2.x.x
```

If not installed:
```bash
# Install Xcode Command Line Tools
xcode-select --install
```

---

## 1️⃣ INSTALL FOUNDRY

**Foundry** is the toolkit for Ethereum smart contract development.

### Step 1.1: Install Foundry

Open Terminal and run:

```bash
curl -L https://foundry.paradigm.xyz | bash
```

**What this does:** Downloads and installs Foundryup (Foundry installer)

**Expected output:**
```
Detected your preferred shell is zsh and added Foundry to PATH.
Run 'source /Users/YOUR_USERNAME/.zshenv' or start a new terminal session to use Foundry.
Then, simply run 'foundryup' to install Foundry.
```

### Step 1.2: Reload your shell

```bash
source ~/.zshenv
# OR start a new terminal window
```

### Step 1.3: Install Foundry tools

```bash
foundryup
```

**What this does:** Installs forge, cast, anvil, and chisel

**Expected output:**
```
Installing forge
Installing cast
Installing anvil
Installing chisel
foundryup: done!
```

### Step 1.4: Verify installation

```bash
forge --version
cast --version
```

**Expected output:**
```
forge 0.2.0 (abc1234 2024-12-01T00:00:00.000000000Z)
cast 0.2.0 (abc1234 2024-12-01T00:00:00.000000000Z)
```

✅ **Foundry is now installed!**

---

## 2️⃣ CLONE REPOSITORY

### Step 2.1: Create workspace directory

```bash
# Create a directory for your projects
mkdir -p ~/Projects
cd ~/Projects
```

### Step 2.2: Clone the TYT repository

```bash
# Replace with your actual repository URL
git clone https://github.com/YOUR_USERNAME/tyt-v2.git
cd tyt-v2
```

### Step 2.3: Navigate to contracts directory

```bash
cd contracts/evm
```

### Step 2.4: Install contract dependencies

```bash
forge install
```

**What this does:** Installs OpenZeppelin contracts and other dependencies

**Expected output:**
```
Installing openzeppelin-contracts
Installing forge-std
```

### Step 2.5: Build contracts (test that everything works)

```bash
forge build
```

**Expected output:**
```
[⠊] Compiling...
[⠒] Compiling 45 files with 0.8.20
[⠢] Solc 0.8.20 finished in 3.45s
Compiler run successful!
```

✅ **Repository is ready!**

---

## 3️⃣ GET TESTNET RESOURCES

You need 3 things before deployment:
1. **Testnet MATIC** (for gas fees)
2. **Alchemy API Key** (for RPC connection)
3. **PolygonScan API Key** (for contract verification)

### Step 3.1: Export your MetaMask private key

**⚠️ IMPORTANT: Never share your private key! This is for testnet only.**

1. Open MetaMask
2. Click the three dots (...)
3. Account Details
4. Export Private Key
5. Enter password
6. Copy the private key (starts with `0x`)

**Save it temporarily** - you'll need it in Step 5.

### Step 3.2: Get testnet MATIC from faucet

#### Option A: Polygon Faucet (Recommended)

1. Visit: **https://faucet.polygon.technology/**
2. Select **"Polygon Amoy"**
3. Enter your MetaMask address
4. Complete CAPTCHA
5. Click "Submit"
6. Wait 1-2 minutes

**You should receive:** 0.5 MATIC

#### Option B: Alchemy Faucet

1. Visit: **https://www.alchemy.com/faucets/polygon-amoy**
2. Sign in with Alchemy account
3. Enter your address
4. Request tokens

#### Option C: QuickNode Faucet

1. Visit: **https://faucet.quicknode.com/polygon/amoy**
2. Enter your address
3. Request tokens

### Step 3.3: Verify you received MATIC

Check your balance on Amoy PolygonScan:
```
https://amoy.polygonscan.com/address/YOUR_ADDRESS
```

You should see: **Balance: 0.5 MATIC**

### Step 3.4: Get Alchemy API Key

1. Visit: **https://www.alchemy.com/**
2. Sign up (free account)
3. Click **"Create New App"**
4. Configure:
   - **Name:** TYT V2 Deployment
   - **Chain:** Polygon
   - **Network:** Polygon Amoy
5. Click **"Create App"**
6. Click **"View Key"**
7. Copy the **HTTPS** URL

**Example URL:**
```
https://polygon-amoy.g.alchemy.com/v2/abc123xyz789
```

### Step 3.5: Get PolygonScan API Key

1. Visit: **https://polygonscan.com/**
2. Sign up / Log in
3. Go to **My Profile** → **API Keys**
4. Click **"Add"**
5. **App Name:** TYT V2
6. Click **"Create New API Key"**
7. Copy the API key

**Example API Key:**
```
ABC123XYZ789ABC123XYZ789ABC12345
```

✅ **All resources collected!**

---

## 4️⃣ CONFIGURE ENVIRONMENT

### Step 4.1: Create .env file

```bash
# Make sure you're in contracts/evm directory
cd ~/Projects/tyt-v2/contracts/evm

# Copy example file
cp .env.example .env
```

### Step 4.2: Edit .env file

```bash
# Open in text editor
nano .env
# OR use VS Code
code .env
```

### Step 4.3: Fill in your values

Replace the placeholders with your actual values:

```bash
# ============================================
# REQUIRED CONFIGURATION
# ============================================

# Your private key from MetaMask (starts with 0x)
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE_64_CHARACTERS

# Alchemy RPC URL (from Step 3.4)
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# PolygonScan API Key (from Step 3.5)
POLYGONSCAN_API_KEY=YOUR_POLYGONSCAN_API_KEY_HERE

# ============================================
# WALLET ADDRESSES
# ============================================

# For testing, set all to your MetaMask address
PROTOCOL_TREASURY=0xYOUR_METAMASK_ADDRESS
CHARITY_VAULT=0xYOUR_METAMASK_ADDRESS
ACADEMY_VAULT=0xYOUR_METAMASK_ADDRESS
ADMIN_ADDRESS=0xYOUR_METAMASK_ADDRESS

# ============================================
# FEE CONFIGURATION (Don't change these)
# ============================================

MINT_FEE_BPS=150          # 1.5%
MARKETPLACE_FEE_BPS=250   # 2.5%
WITHDRAWAL_FEE_BPS=50     # 0.5%
MAINTENANCE_FEE_BPS=100   # 1.0%
DEPOSIT_FEE_BPS=100       # 1.0%

TIMELOCK_DURATION=172800  # 2 days in seconds
```

### Step 4.4: Real example .env

Here's what your .env should look like (with fake values):

```bash
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/abc123xyz789abc123xyz789
POLYGONSCAN_API_KEY=ABC123XYZ789ABC123XYZ789ABC12345

PROTOCOL_TREASURY=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
CHARITY_VAULT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
ACADEMY_VAULT=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
ADMIN_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

MINT_FEE_BPS=150
MARKETPLACE_FEE_BPS=250
WITHDRAWAL_FEE_BPS=50
MAINTENANCE_FEE_BPS=100
DEPOSIT_FEE_BPS=100
TIMELOCK_DURATION=172800
```

### Step 4.5: Save the file

**If using nano:**
- Press `Ctrl + O` to save
- Press `Enter` to confirm
- Press `Ctrl + X` to exit

**If using VS Code:**
- Press `Cmd + S` to save

### Step 4.6: Verify .env is correct

```bash
# Check file exists
ls -la .env

# Show first few lines (without exposing private key)
head -n 5 .env
```

✅ **Environment configured!**

---

## 5️⃣ DEPLOY CONTRACTS

### Step 5.1: Load environment variables

```bash
source .env
```

### Step 5.2: Verify connection to network

```bash
# Check current block number
cast block-number --rpc-url $AMOY_RPC_URL

# Should output: 12345678 (some number)
```

If this fails, check your `AMOY_RPC_URL` in .env

### Step 5.3: Check your balance

```bash
# Check deployer balance
cast balance $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL

# Should output: 500000000000000000 (0.5 MATIC in wei)
```

To convert to MATIC:
```bash
cast from-wei 500000000000000000

# Should output: 0.500000000000000000
```

### Step 5.4: Run deployment script

Now for the main event! 🚀

```bash
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig \
  --rpc-url $AMOY_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  -vvvv
```

**What each flag does:**
- `--rpc-url $AMOY_RPC_URL` → Connect to Polygon Amoy
- `--broadcast` → Actually send transactions (not just simulate)
- `--verify` → Automatically verify contracts on PolygonScan
- `--etherscan-api-key` → API key for verification
- `-vvvv` → Very verbose output (shows everything)

### Step 5.5: What to expect during deployment

**Phase 1: Compilation**
```
[⠊] Compiling...
[⠒] Solc 0.8.20 finished in 2.34s
```

**Phase 2: Simulation**
```
Script ran successfully.
Gas used: 15,234,567
```

**Phase 3: Deployment**
```
Deploying FeeConfigGovernance...
Deployed to: 0x1234...
Transaction: 0xabc123...

Deploying CharityVault...
Deployed to: 0x5678...
Transaction: 0xdef456...

Deploying AcademyVault...
Deployed to: 0x9abc...
Transaction: 0x789xyz...

Deploying MinerNFT...
Deployed to: 0xdef0...
Transaction: 0x012abc...

Deploying MinerMarketplace...
Deployed to: 0x1111...
Transaction: 0x345def...

Deploying RewardsMerkleRegistry...
Deployed to: 0x2222...
Transaction: 0x678ghi...
```

**Phase 4: Verification**
```
Start verifying contract `0x1234...` deployed on amoy
Submitting verification for [src/FeeConfigGovernance.sol:FeeConfigGovernance] 0x1234...
Submitted contract for verification:
        Response: `OK`
        GUID: `abc123xyz`
        URL: https://amoy.polygonscan.com/address/0x1234...

Contract successfully verified!
```

**Phase 5: Save Addresses**
```
Deployment addresses saved to: deployments/amoy.json
```

### Step 5.6: Deployment complete! 🎉

**Total time:** ~5 minutes
**Total gas cost:** ~0.03 MATIC (~$0.02)

---

## 6️⃣ VERIFY CONTRACTS

If auto-verification failed (or you want to double-check):

### Step 6.1: Check deployment addresses

```bash
cat deployments/amoy.json
```

**Example output:**
```json
{
  "feeConfig": "0x1234567890123456789012345678901234567890",
  "charityVault": "0x2345678901234567890123456789012345678901",
  "academyVault": "0x3456789012345678901234567890123456789012",
  "minerNFT": "0x4567890123456789012345678901234567890123",
  "marketplace": "0x5678901234567890123456789012345678901234",
  "rewardsMerkle": "0x6789012345678901234567890123456789012345",
  "deployer": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "timestamp": "2025-12-14T15:30:00Z",
  "network": "amoy"
}
```

### Step 6.2: Extract addresses to variables

```bash
FEE_CONFIG=$(cat deployments/amoy.json | jq -r '.feeConfig')
MINER_NFT=$(cat deployments/amoy.json | jq -r '.minerNFT')
MARKETPLACE=$(cat deployments/amoy.json | jq -r '.marketplace')

echo "FeeConfig: $FEE_CONFIG"
echo "MinerNFT: $MINER_NFT"
echo "Marketplace: $MARKETPLACE"
```

### Step 6.3: Manual verification (if needed)

If auto-verification failed, run:

```bash
./verify-contracts.sh amoy
```

**OR verify individually:**

```bash
# Verify FeeConfigGovernance
forge verify-contract \
  $FEE_CONFIG \
  src/FeeConfigGovernance.sol:FeeConfigGovernance \
  --chain-id 80002 \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address,uint256)" $PROTOCOL_TREASURY $CHARITY_VAULT $ACADEMY_VAULT $TIMELOCK_DURATION)
```

### Step 6.4: Check verification on PolygonScan

Visit each contract on PolygonScan:

```bash
# Open in browser
open "https://amoy.polygonscan.com/address/$FEE_CONFIG"
open "https://amoy.polygonscan.com/address/$MINER_NFT"
open "https://amoy.polygonscan.com/address/$MARKETPLACE"
```

**Look for:**
- ✅ Green checkmark: "Contract Source Code Verified"
- ✅ "Contract" tab shows source code
- ✅ "Read Contract" and "Write Contract" tabs available

✅ **Contracts verified!**

---

## 7️⃣ TEST DEPLOYMENT

Let's test that everything works!

### Step 7.1: Check contract settings

```bash
# Load addresses
source .env
FEE_CONFIG=$(cat deployments/amoy.json | jq -r '.feeConfig')
MINER_NFT=$(cat deployments/amoy.json | jq -r '.minerNFT')

# Check protocol treasury
cast call $FEE_CONFIG "protocolTreasury()" --rpc-url $AMOY_RPC_URL

# Should output your address: 0x742d35...
```

```bash
# Check charity vault
cast call $FEE_CONFIG "charityVault()" --rpc-url $AMOY_RPC_URL

# Check academy vault
cast call $FEE_CONFIG "academyVault()" --rpc-url $AMOY_RPC_URL
```

### Step 7.2: Check fee configuration

```bash
# Get mint fee profile (profile 0)
cast call $FEE_CONFIG "getFeeProfile(uint8)(uint16,uint16,uint16,uint16)" 0 --rpc-url $AMOY_RPC_URL

# Should output: 150 6000 3000 1000
# (1.5% total, 60% protocol, 30% charity, 10% academy)
```

### Step 7.3: Mint a test NFT

```bash
# Mint NFT with 100 TH/s, 35 W/TH, region USA (0)
cast send $MINER_NFT \
  "mint(address,uint256,uint256,uint8)" \
  $ADMIN_ADDRESS 100 35 0 \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY \
  --value 0.01ether
```

**What this does:**
- Mints 1 NFT to your address
- Power: 100 TH/s
- Efficiency: 35 W/TH
- Region: USA
- Pays 0.01 MATIC mint fee

**Expected output:**
```
blockHash               0xabc123...
blockNumber             12345678
from                    0x742d35...
to                      0x4567... (MinerNFT address)
transactionHash         0xdef456...
status                  1 (success)
```

### Step 7.4: Check NFT balance

```bash
# Check how many NFTs you own
cast call $MINER_NFT "balanceOf(address)" $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL

# Should output: 1 (you own 1 NFT)
```

### Step 7.5: Get NFT token ID

```bash
# Get your first NFT token ID
cast call $MINER_NFT "tokenOfOwnerByIndex(address,uint256)" $ADMIN_ADDRESS 0 --rpc-url $AMOY_RPC_URL

# Should output: 1 (token ID 1)
```

### Step 7.6: Check fee distribution

```bash
# Check protocol balance (should have received 60% of fee)
cast call $FEE_CONFIG "protocolBalance()" --rpc-url $AMOY_RPC_URL

# Check charity balance (should have received 30% of fee)
cast call $FEE_CONFIG "charityBalance()" --rpc-url $AMOY_RPC_URL

# Check academy balance (should have received 10% of fee)
cast call $FEE_CONFIG "academyBalance()" --rpc-url $AMOY_RPC_URL
```

**Example output:**
```
90000000000000 (0.00009 MATIC - 60%)
45000000000000 (0.000045 MATIC - 30%)
15000000000000 (0.000015 MATIC - 10%)
```

### Step 7.7: View your NFT on PolygonScan

```bash
# Open NFT on PolygonScan
open "https://amoy.polygonscan.com/token/$MINER_NFT?a=$ADMIN_ADDRESS"
```

✅ **Everything works!**

---

## 8️⃣ TROUBLESHOOTING

### Problem: "command not found: forge"

**Solution:**
```bash
# Reload shell
source ~/.zshenv

# Or reinstall Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Problem: "insufficient funds for gas"

**Solution:**
```bash
# Check your balance
cast balance $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL

# Get more testnet MATIC
# Visit: https://faucet.polygon.technology/
```

### Problem: "RPC error: connection refused"

**Solution:**
```bash
# Check your RPC URL
echo $AMOY_RPC_URL

# Try alternative RPC
export AMOY_RPC_URL=https://rpc-amoy.polygon.technology/

# Or check Alchemy dashboard for correct URL
```

### Problem: "verification failed"

**Solution:**
```bash
# Wait 30 seconds for contract to be indexed
sleep 30

# Retry verification
./verify-contracts.sh amoy

# Or check PolygonScan API key
echo $POLYGONSCAN_API_KEY
```

### Problem: ".env file not found"

**Solution:**
```bash
# Make sure you're in correct directory
pwd
# Should be: /Users/YOUR_USERNAME/Projects/tyt-v2/contracts/evm

# Create .env from template
cp .env.example .env
nano .env
```

### Problem: "nonce too high"

**Solution:**
```bash
# Get current nonce
cast nonce $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL

# Wait a few minutes and retry
```

### Problem: "transaction underpriced"

**Solution:**
```bash
# Check current gas price
cast gas-price --rpc-url $AMOY_RPC_URL

# Retry deployment (gas price adjusts automatically)
```

### Problem: "contract already deployed"

**Solution:**
```bash
# Check if contracts exist
cast code $FEE_CONFIG --rpc-url $AMOY_RPC_URL

# If you want fresh deployment, use different deployer address
# Or change salt in deployment script
```

### Problem: jq command not found

**Solution:**
```bash
# Install jq
brew install jq

# Or read JSON manually
cat deployments/amoy.json
```

---

## 9️⃣ NEXT STEPS

### Update Frontend Configuration

```bash
# Navigate to frontend
cd ../../  # Back to project root

# Edit .env
nano .env
```

Add contract addresses:
```bash
VITE_FEE_CONFIG_ADDRESS=0x... (from deployments/amoy.json)
VITE_MINER_NFT_ADDRESS=0x...
VITE_MARKETPLACE_ADDRESS=0x...
VITE_CHARITY_VAULT_ADDRESS=0x...
VITE_ACADEMY_VAULT_ADDRESS=0x...
VITE_REWARDS_MERKLE_ADDRESS=0x...

VITE_CHAIN_ID=80002
VITE_NETWORK_NAME=Polygon Amoy
VITE_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY
VITE_EXPLORER_URL=https://amoy.polygonscan.com
```

### Test Frontend Integration

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:5173
```

### Deploy to Production (when ready)

1. **Security Audit** (highly recommended)
2. **Set up Multi-Sig** for admin operations
3. **Deploy to Polygon Mainnet** (use `./deploy.sh polygon`)
4. **Update frontend** with mainnet addresses
5. **Launch!** 🚀

---

## 📊 DEPLOYMENT SUMMARY

**What you deployed:**
- ✅ FeeConfigGovernance (governance with 2-day timelock)
- ✅ CharityVault (30% fee recipient for brain cancer research)
- ✅ AcademyVault (10% fee recipient for education)
- ✅ MinerNFT (ERC-721 miners with automatic fees)
- ✅ MinerMarketplace (marketplace with 60/30/10 splits)
- ✅ RewardsMerkleRegistry (merkle-based rewards)

**Cost:**
- Testnet MATIC: **FREE** (from faucet)
- Gas fees: **~0.03 MATIC** (~$0.02)
- Total: **FREE**

**Time:**
- First-time setup: **30-45 minutes**
- Subsequent deploys: **5 minutes**

---

## 📞 GETTING HELP

### Documentation
- **Full Guide:** `DEPLOYMENT_GUIDE.md`
- **Checklist:** `PRE_DEPLOYMENT_CHECKLIST.md`
- **Fee System:** `../FEE_SYSTEM_INTEGRATION_GUIDE.md`

### Resources
- **Foundry Book:** https://book.getfoundry.sh/
- **Polygon Docs:** https://docs.polygon.technology/
- **Alchemy Docs:** https://docs.alchemy.com/

### Community
- **Foundry Discord:** https://discord.gg/foundry
- **Polygon Discord:** https://discord.gg/polygon

---

## ✅ CHECKLIST

**Before deployment:**
- [ ] Foundry installed (`forge --version`)
- [ ] Repository cloned
- [ ] .env configured
- [ ] Testnet MATIC received (0.5+)
- [ ] Alchemy API key obtained
- [ ] PolygonScan API key obtained

**During deployment:**
- [ ] Contracts compiled successfully
- [ ] Deployment transactions confirmed
- [ ] Addresses saved to `deployments/amoy.json`
- [ ] Contracts verified on PolygonScan

**After deployment:**
- [ ] Test NFT minted successfully
- [ ] Fee distribution verified (60/30/10)
- [ ] Frontend .env updated
- [ ] Integration tested

---

## 🎉 CONGRATULATIONS!

You've successfully deployed TYT Ecosystem V2 to Polygon Amoy testnet!

**Your contracts are now:**
- ✅ Live on blockchain
- ✅ Verified on PolygonScan
- ✅ Ready for integration
- ✅ Collecting fees automatically (60/30/10)
- ✅ Supporting brain cancer research (30%)
- ✅ Funding blockchain education (10%)

**Next:** Test the full user flow, integrate with frontend, and prepare for mainnet deployment!

---

**TYT Ecosystem V2** - Building the future of Mining-to-Medicine! 🌟

**Every transaction helps children with brain cancer.** ❤️

---

**Version:** 2.0.0
**Last Updated:** December 14, 2025
**Network:** Polygon Amoy Testnet
