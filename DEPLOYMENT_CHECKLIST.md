# TYT Platform v3 - Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Get WalletConnect Project ID from https://cloud.walletconnect.com/
- [ ] Configure Polygon RPC URL
- [ ] Verify Supabase credentials

### Smart Contracts
- [ ] Review contract code in `contracts/evm/src/`
- [ ] Run contract tests: `cd contracts/evm && forge test`
- [ ] Deploy to Polygon Amoy testnet
- [ ] Verify contracts on Polygonscan
- [ ] Update `.env` with deployed addresses

### Backend Services
- [ ] Deploy Ledger API service
- [ ] Deploy Indexer service
- [ ] Setup Merkle tree generator
- [ ] Configure cron jobs for rewards
- [ ] Test all API endpoints

### Database
- [ ] All migrations applied ✅
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Seed data loaded ✅

### Frontend
- [ ] Update contract addresses in `.env`
- [ ] Test wallet connection
- [ ] Test all Web3 features
- [ ] Run `npm run build`
- [ ] Check bundle size

## Deployment Steps

### 1. Smart Contracts (Polygon Amoy)

```bash
cd contracts/evm

# Install dependencies
forge install

# Run tests
forge test -vvv

# Deploy contracts
forge script script/DeployV3Core.s.sol \
  --rpc-url $POLYGON_AMOY_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $POLYGONSCAN_API_KEY

# Save deployed addresses
# Update .env with addresses
```

### 2. Backend Services

```bash
# Deploy Ledger API
# Deploy Indexer
# Deploy Rewards service
# Configure environment variables
# Start services
```

### 3. Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Deploy to hosting (Vercel/Netlify/etc)
vercel deploy --prod
# or
netlify deploy --prod
```

### 4. Database

```bash
# Apply any remaining migrations
# Verify RLS policies
# Check indexes
```

## Post-Deployment

### Testing
- [ ] Connect wallet (MetaMask)
- [ ] Switch to Polygon Amoy
- [ ] Get testnet MATIC from faucet
- [ ] Mint test NFT miner
- [ ] List on marketplace
- [ ] Buy from marketplace
- [ ] Claim rewards (if eligible)
- [ ] Make donation
- [ ] Complete quest
- [ ] Check balance updates

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Configure analytics
- [ ] Setup uptime monitoring
- [ ] Configure alerts
- [ ] Check logs

### Security
- [ ] Run security audit on contracts
- [ ] Test RLS policies
- [ ] Verify API authentication
- [ ] Check CORS settings
- [ ] Review access controls

### Documentation
- [ ] Update README with live URLs
- [ ] Add contract addresses to docs
- [ ] Create user guide
- [ ] Write API documentation
- [ ] Prepare marketing materials

## Production Readiness

### Performance
- [ ] Lighthouse score > 90
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] CDN configured
- [ ] Caching setup

### SEO
- [ ] Meta tags added
- [ ] Open Graph tags
- [ ] Sitemap generated
- [ ] robots.txt configured
- [ ] Analytics tracking

### Legal
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Cookie Consent
- [ ] Compliance checks
- [ ] Legal review

## Mainnet Deployment

### When Ready for Production
- [ ] Audit smart contracts (3rd party)
- [ ] Deploy to Polygon mainnet
- [ ] Setup multi-sig for admin functions
- [ ] Configure production API endpoints
- [ ] Enable production monitoring
- [ ] Launch marketing campaign

### Budget Requirements
- [ ] Smart contract deployment gas
- [ ] Backend infrastructure costs
- [ ] CDN/hosting costs
- [ ] Monitoring/logging costs
- [ ] Marketing budget

## Emergency Procedures

### If Issues Arise
1. Pause smart contracts (if function exists)
2. Redirect users to status page
3. Investigate issue
4. Fix and redeploy
5. Resume operations

### Backup Plan
- [ ] Database backups configured
- [ ] Contract upgrade path defined
- [ ] Emergency contacts list
- [ ] Incident response plan
- [ ] Communication strategy

## Sign-off

### Team Approvals
- [ ] Frontend Lead: ___________
- [ ] Backend Lead: ___________
- [ ] Smart Contract Dev: ___________
- [ ] Security Auditor: ___________
- [ ] Product Manager: ___________
- [ ] CEO/Founder: ___________

### Deployment Date
**Planned:** __________
**Actual:** __________

### Notes
```
[Space for deployment notes]
```

## Quick Reference

### Polygon Amoy
- RPC: https://rpc-amoy.polygon.technology
- Explorer: https://amoy.polygonscan.com
- Faucet: https://faucet.polygon.technology/

### Contract Addresses (Fill after deployment)
```
FeeConfig:         0x...
CharityVault:      0x...
MinerNFT:          0x...
RewardsMerkle:     0x...
Marketplace:       0x...
```

### API Endpoints (Fill after deployment)
```
Ledger API:        https://...
Indexer API:       https://...
Rewards API:       https://...
```

### Frontend URL
```
Testnet:          https://...
Production:       https://...
```

---

**Status:** Pre-Deployment
**Last Updated:** 2024-12-14
**Next Review:** Before contract deployment
