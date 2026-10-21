# 🎬 TYT V2 DEPLOYMENT VIDEO SCRIPT

**Title:** "Deploy TYT V2 Smart Contracts to Polygon in 5 Minutes"

**Duration:** 15-20 minutes

**Target Audience:** Developers with basic blockchain knowledge

---

## 📝 VIDEO OUTLINE

### Introduction (0:00 - 1:00)

**[SCREEN: Terminal with TYT logo]**

"Hey everyone! Today I'm going to show you how to deploy the TYT Ecosystem V2 smart contracts to Polygon Amoy testnet from your Mac. This is a complete Web3 mining platform with automatic fee distribution - 60% to protocol, 30% to brain cancer research, and 10% to blockchain education."

**[SHOW: Architecture diagram]**

"We'll be deploying 6 smart contracts:
- FeeConfigGovernance - Manages all fees with 2-day timelock
- CharityVault - Receives 30% for foundation
- AcademyVault - Receives 10% for education
- MinerNFT - ERC-721 miners
- MinerMarketplace - Peer-to-peer marketplace
- RewardsMerkleRegistry - Daily reward proofs"

"By the end of this video, you'll have everything deployed, verified, and tested. Let's dive in!"

---

### Part 1: Install Foundry (1:00 - 3:00)

**[SCREEN: Terminal, empty]**

"First, we need Foundry - the modern toolkit for Ethereum development."

**[TYPE]**
```bash
curl -L https://foundry.paradigm.xyz | bash
```

**[SHOW: Installation output]**

"This downloads the Foundry installer. Now reload your shell:"

**[TYPE]**
```bash
source ~/.zshenv
```

"And install the tools:"

**[TYPE]**
```bash
foundryup
```

**[SHOW: forge, cast, anvil, chisel installing]**

"Perfect! Now verify it worked:"

**[TYPE]**
```bash
forge --version
cast --version
```

**[SHOW: Version numbers]**

"Great! Foundry is installed."

---

### Part 2: Clone and Build (3:00 - 5:00)

**[SCREEN: Terminal]**

"Now let's get the code:"

**[TYPE]**
```bash
cd ~/Projects
git clone https://github.com/YOUR_USERNAME/tyt-v2.git
cd tyt-v2/contracts/evm
```

**[SHOW: Repository cloning]**

"Install dependencies:"

**[TYPE]**
```bash
forge install
```

**[SHOW: OpenZeppelin and forge-std installing]**

"And build to make sure everything works:"

**[TYPE]**
```bash
forge build
```

**[SHOW: Compilation output, 45 files compiled successfully]**

"Excellent! All 45 files compiled."

---

### Part 3: Get Testnet Resources (5:00 - 8:00)

**[SCREEN: MetaMask]**

"We need 3 things: testnet MATIC, an Alchemy API key, and a PolygonScan API key."

**[SHOW: MetaMask export private key]**

"First, export your MetaMask private key. Go to Account Details, Export Private Key, enter password, and copy it. Keep this safe!"

**[SCREEN: Browser - Polygon Faucet]**

"Now visit faucet.polygon.technology"

**[SHOW: Selecting Polygon Amoy, entering address, clicking Submit]**

"Select Polygon Amoy, paste your address, complete the CAPTCHA, and submit. You'll get 0.5 MATIC in about a minute."

**[SCREEN: Browser - Alchemy]**

"Next, go to alchemy.com and create an account."

**[SHOW: Creating new app - Polygon Amoy]**

"Create a new app, select Polygon and Amoy network. Click View Key and copy the HTTPS URL."

**[SCREEN: Browser - PolygonScan]**

"Finally, polygonscan.com - create account if needed."

**[SHOW: My Profile → API Keys → Add]**

"Go to My Profile, API Keys, click Add. Give it a name and copy the key."

**[SHOW: All 3 keys collected in a notepad]**

"Perfect! We have everything we need."

---

### Part 4: Configure Environment (8:00 - 10:00)

**[SCREEN: Terminal in contracts/evm directory]**

"Time to configure our environment:"

**[TYPE]**
```bash
cp .env.example .env
nano .env
```

**[SHOW: nano editor with .env.example]**

"I'll use nano, but you can use any text editor. Here's what we need to fill in:"

**[HIGHLIGHT each section while explaining]**

"Private key - paste from MetaMask"
**[PASTE: 0x1234...abcd]**

"Alchemy RPC URL - paste from Alchemy dashboard"
**[PASTE: https://polygon-amoy.g.alchemy.com/v2/...]**

"PolygonScan API key - paste from PolygonScan"
**[PASTE: ABC123...]**

"For testing, use your MetaMask address for all wallets:"
**[PASTE: Same address for PROTOCOL_TREASURY, CHARITY_VAULT, ACADEMY_VAULT, ADMIN_ADDRESS]**

"Leave the fee configuration as default."

**[SHOW: Save with Ctrl+O, Exit with Ctrl+X]**

"Save and exit. Done!"

---

### Part 5: Deploy Contracts (10:00 - 13:00)

**[SCREEN: Terminal]**

"Now for the exciting part - deployment!"

**[TYPE]**
```bash
source .env
```

"Load our environment variables."

**[TYPE]**
```bash
cast block-number --rpc-url $AMOY_RPC_URL
```

**[SHOW: Block number output]**

"Good, we're connected to the network."

**[TYPE]**
```bash
cast balance $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL
```

**[SHOW: 500000000000000000 wei]**

"We have 0.5 MATIC. Perfect!"

**[TYPE]**
```bash
forge script script/DeployV3WithFeeConfig.s.sol:DeployV3WithFeeConfig \
  --rpc-url $AMOY_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY \
  -vvvv
```

**[SHOW: Compilation starting]**

"This will compile, deploy, and verify all contracts. Let's watch:"

**[TIMELAPSE: Show key parts]**
- ✅ Compilation complete
- ✅ FeeConfigGovernance deployed to 0x1234...
- ✅ CharityVault deployed to 0x5678...
- ✅ AcademyVault deployed to 0x9abc...
- ✅ MinerNFT deployed to 0xdef0...
- ✅ MinerMarketplace deployed to 0x1111...
- ✅ RewardsMerkleRegistry deployed to 0x2222...
- ✅ All contracts verified!
- ✅ Addresses saved to deployments/amoy.json

**[SHOW: Final success message]**

"Amazing! All 6 contracts deployed and verified in about 5 minutes!"

---

### Part 6: Test Deployment (13:00 - 16:00)

**[SCREEN: Terminal]**

"Let's test that everything works. First, check the addresses:"

**[TYPE]**
```bash
cat deployments/amoy.json
```

**[SHOW: JSON with all addresses]**

"Beautiful! Now let's mint a test NFT:"

**[TYPE]**
```bash
FEE_CONFIG=$(cat deployments/amoy.json | jq -r '.feeConfig')
MINER_NFT=$(cat deployments/amoy.json | jq -r '.minerNFT')

cast send $MINER_NFT \
  "mint(address,uint256,uint256,uint8)" \
  $ADMIN_ADDRESS 100 35 0 \
  --rpc-url $AMOY_RPC_URL \
  --private-key $PRIVATE_KEY \
  --value 0.01ether
```

**[SHOW: Transaction submitting, waiting for confirmation]**

**[SHOW: Success! Transaction hash and block number]**

"Success! Let's check we own the NFT:"

**[TYPE]**
```bash
cast call $MINER_NFT "balanceOf(address)" $ADMIN_ADDRESS --rpc-url $AMOY_RPC_URL
```

**[SHOW: Output: 1]**

"We own 1 NFT! Now check the fee distribution:"

**[TYPE]**
```bash
cast call $FEE_CONFIG "protocolBalance()" --rpc-url $AMOY_RPC_URL
cast call $FEE_CONFIG "charityBalance()" --rpc-url $AMOY_RPC_URL
cast call $FEE_CONFIG "academyBalance()" --rpc-url $AMOY_RPC_URL
```

**[SHOW: 3 balances - 60%, 30%, 10%]**

"Perfect! The fees were automatically split 60/30/10!"

---

### Part 7: View on PolygonScan (16:00 - 17:30)

**[SCREEN: Browser]**

"Let's see our contracts on PolygonScan:"

**[TYPE in browser: amoy.polygonscan.com]**

**[PASTE: FeeConfig address]**

**[SHOW: Contract page with green checkmark "Verified"]**

"See the green checkmark? Contract is verified!"

**[CLICK: "Read Contract" tab]**

**[SHOW: All read functions available]**

"We can read all the contract data..."

**[CLICK: "Write Contract" tab]**

**[SHOW: Connect wallet option]**

"...and write to it through the UI."

**[PASTE: MinerNFT address]**

**[SHOW: NFT contract, go to token holdings]**

"And here's our NFT! Token ID 1, owned by our address."

---

### Conclusion (17:30 - 19:00)

**[SCREEN: Terminal with all commands visible]**

"And that's it! We've successfully deployed TYT Ecosystem V2 to Polygon Amoy testnet!"

**[SHOW: Quick recap animation]**

"In this video we:
1. ✅ Installed Foundry
2. ✅ Cloned the repository
3. ✅ Got testnet resources
4. ✅ Configured environment
5. ✅ Deployed 6 smart contracts
6. ✅ Verified on PolygonScan
7. ✅ Tested with real transactions
8. ✅ Confirmed fee distribution works"

**[SHOW: Cost summary]**

"Total cost? Zero! It's all testnet. Total time? About 30 minutes first time, 5 minutes after that."

**[SCREEN: Next steps text]**

"Next steps:
- Integrate with frontend
- Test complete user flows
- Set up monitoring
- Deploy to mainnet when ready"

**[SHOW: TYT logo with website]**

"TYT Ecosystem V2 automatically distributes 30% of all fees to brain cancer research. Every transaction helps children with brain cancer."

"All the code and documentation is linked in the description below. If you have questions, leave a comment!"

"Thanks for watching, and happy deploying! 🚀"

---

## 📋 VIDEO DESCRIPTION

```
🚀 Deploy TYT V2 Smart Contracts to Polygon in 5 Minutes

Complete step-by-step guide to deploy TYT Ecosystem V2 smart contracts from macOS to Polygon Amoy testnet.

⏱️ TIMESTAMPS
0:00 - Introduction
1:00 - Install Foundry
3:00 - Clone Repository
5:00 - Get Testnet Resources
8:00 - Configure Environment
10:00 - Deploy Contracts
13:00 - Test Deployment
16:00 - View on PolygonScan
17:30 - Conclusion

📚 RESOURCES
- GitHub Repository: [link]
- QUICKSTART Guide: [link]
- Deployment Guide: [link]
- Polygon Faucet: https://faucet.polygon.technology/
- Alchemy: https://alchemy.com
- PolygonScan: https://polygonscan.com

🛠️ COMMANDS USED
All commands shown in video are in the QUICKSTART.md file in the repository.

💰 WHAT IS TYT?
TYT Ecosystem V2 is a Web3 mining platform with automatic fee distribution:
- 60% to protocol operations
- 30% to brain cancer research foundation
- 10% to blockchain education academy

Every transaction helps children with brain cancer. ❤️

🔗 LINKS
- Documentation: [link]
- Website: [link]
- Discord: [link]
- Twitter: [link]

#blockchain #ethereum #polygon #smartcontracts #web3 #foundry #solidity #deployment #tutorial
```

---

## 🎥 B-ROLL SUGGESTIONS

1. **Foundry installation animation** (1:00-1:30)
2. **Network diagram showing 60/30/10 split** (0:30-0:45)
3. **Architecture diagram of 6 contracts** (0:45-1:00)
4. **Split screen: terminal + browser** (8:00-10:00)
5. **Time-lapse of deployment** (10:30-12:30)
6. **Animated fee distribution** (15:00-15:30)
7. **Brain cancer foundation logo** (17:30-18:00)

---

## 📱 SHORT VERSION (5 MINUTES)

For TikTok/YouTube Shorts/Instagram Reels:

### Version 1: "Deploy Smart Contracts in 5 Minutes"

```
0:00 - "Watch me deploy 6 smart contracts to Polygon"
0:10 - Install Foundry (speed up 4x)
0:20 - Get testnet MATIC from faucet
0:30 - Configure .env file (speed up 2x)
1:00 - Run deploy command
1:15 - Watch deployment happen (time-lapse)
3:00 - Mint test NFT
3:30 - Check fees distributed 60/30/10
4:00 - Show verified contracts on PolygonScan
4:30 - "Total cost: $0. Total time: 5 minutes. Link in bio!"
```

### Version 2: "30% of Every Transaction Fights Brain Cancer"

```
0:00 - "This smart contract saves children's lives"
0:05 - Show TYT logo
0:10 - "Watch: Every transaction splits fees automatically"
0:15 - Deploy contracts (fast-forward)
0:45 - Make test transaction
1:00 - "60% protocol, 30% brain cancer research, 10% education"
1:15 - Show fee distribution on-chain
1:30 - "Every transaction helps kids with brain cancer"
1:45 - Show foundation logo
2:00 - "Learn to deploy: Link in bio!"
```

---

**VIDEO PRODUCTION NOTES:**

✅ Use terminal with large, readable font (18-20pt)
✅ Show keyboard shortcuts on screen
✅ Pause to explain complex steps
✅ Speed up repetitive parts (compilation, waiting)
✅ Add captions for accessibility
✅ Include error handling (what to do if something fails)
✅ End with clear next steps

**EQUIPMENT:**
- Screen recording: QuickTime or OBS
- Audio: External mic (Blue Yeti or similar)
- Editing: Final Cut Pro or DaVinci Resolve

**PUBLISHING:**
- YouTube (long form)
- YouTube Shorts (5 min version)
- TikTok (version 2)
- Twitter (clips)
- LinkedIn (professional focus)

---

**Last Updated:** December 14, 2025
