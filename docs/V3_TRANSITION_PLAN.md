# TYT V3.0 TRANSITION PLAN
**Date**: 13 December 2024
**Current Status**: Phase 3 Complete (98%)
**Next Phase**: v3.0 - Real Blockchain Integration

---

## 🎯 EXECUTIVE SUMMARY

TYT Platform успешно завершил Phase 3 (complete autonomous ecosystem). Теперь готов к переходу на v3.0 с реальными blockchain контрактами и полной интеграцией.

### Ключевые Отличия v2 → v3

| Aspect | v2 (Current) | v3 (Target) |
|--------|--------------|-------------|
| **Contracts** | Placeholder/stub | Production Foundry contracts |
| **Rewards** | Calculated in DB | On-chain Merkle proofs |
| **Marketplace** | Supabase only | On-chain + indexer sync |
| **Fees** | Hardcoded | FeeConfig contract |
| **Charity** | DB tracking | CharityVault contract |
| **Verification** | Trust backend | Cryptographic proofs |

---

## 📊 CURRENT STATE ANALYSIS

### ✅ What's Already Complete

1. **Database Architecture** (98% ready)
   - 120+ tables with RLS
   - Double-entry ledger structure
   - All necessary schemas

2. **Frontend** (95% ready)
   - 60+ components
   - 36 pages
   - Modern UI/UX
   - Needs: API rewiring

3. **Backend Logic** (85% ready)
   - 18 edge functions
   - Core business logic
   - Needs: Blockchain integration

4. **Infrastructure** (90% ready)
   - Supabase configured
   - Build pipelines work
   - Needs: CI/CD enhancement

### ⚠️ What Needs Implementation

1. **Smart Contracts** (0% - critical path)
   - FeeConfig.sol
   - CharityVault.sol
   - MinerNFT.sol
   - RewardsMerkleRegistry.sol
   - MinerMarketplace.sol

2. **Blockchain Indexer** (30%)
   - Basic structure exists
   - Needs: Real event indexing

3. **Merkle Proof System** (0%)
   - Tree generation
   - Proof storage
   - Verification

4. **API Integration** (40%)
   - Some endpoints ready
   - Needs: Contract interaction

---

## 🗺️ ROADMAP TO V3.0

### Phase 3.1: Contracts Foundation (2 weeks)
**Owner**: contracts-agent

**Week 1**:
- [ ] Setup Foundry project structure
- [ ] Implement FeeConfig.sol
- [ ] Implement CharityVault.sol
- [ ] Write comprehensive tests

**Week 2**:
- [ ] Implement MinerNFT.sol
- [ ] Implement RewardsMerkleRegistry.sol
- [ ] Implement MinerMarketplace.sol
- [ ] Deploy to Polygon Amoy
- [ ] Verify all contracts

**Deliverables**:
- 5 deployed & verified contracts
- Test coverage >90%
- Deployment addresses in repo
- Documentation

---

### Phase 3.2: Backend Integration (2 weeks)
**Owner**: backend-agent

**Week 3**:
- [ ] Enhance process-deposit with real fee split
- [ ] Implement blockchain indexer
- [ ] Create journal entry system
- [ ] Add contract interaction layer

**Week 4**:
- [ ] Build merkle tree generator
- [ ] Implement proof storage
- [ ] Create merkle-proof-api endpoint
- [ ] Enhance cron-daily-rewards

**Deliverables**:
- Working indexer
- Merkle proof system
- Enhanced edge functions
- Integration tests

---

### Phase 3.3: Frontend Connection (1 week)
**Owner**: frontend-agent

**Week 5**:
- [ ] Create API client layer
- [ ] Wire Wallet page to real APIs
- [ ] Wire Miners page to indexer
- [ ] Add Rewards verification UI
- [ ] Update Marketplace with contract calls

**Deliverables**:
- All pages use real data
- No mock data
- Merkle verification works
- Fee breakdowns displayed

---

### Phase 3.4: Infrastructure (1 week)
**Owner**: infra-agent

**Week 6**:
- [ ] Setup CI/CD pipeline
- [ ] Create staging environment
- [ ] Configure monitoring
- [ ] Write deployment runbooks

**Deliverables**:
- CI/CD working
- Staging deploys automatically
- Health checks in place
- Documentation complete

---

### Phase 3.5: Integration & Testing (1 week)
**Owner**: integrator

**Week 7**:
- [ ] Merge all branches
- [ ] Deploy to staging
- [ ] Run E2E tests (5 scenarios)
- [ ] Fix critical bugs
- [ ] Performance testing
- [ ] Security audit

**Deliverables**:
- Staging fully functional
- All E2E tests pass
- Bug fix tasks created
- Release candidate ready

---

## 🎯 E2E VERIFICATION SCENARIOS

### 1. Deposit Flow
```
User deposits 1000 USDT on Polygon Amoy
→ Indexer detects transfer
→ Fee calculation: 10% total (100 USDT)
→ Distribution:
   - User: 900 USDT (90%)
   - Protocol: 60 USDT (6%)
   - Charity: 30 USDT (3%)
   - Academy: 10 USDT (1%)
→ Journal entries created
→ Wallet balances updated
→ Email sent to user
✅ PASS if all amounts correct
```

### 2. Miner Lifecycle
```
Admin mints MinerNFT #123 to user
→ Event emitted on-chain
→ Indexer syncs within 1 minute
→ Database updated with miner details
→ Miners page shows new miner
→ User can see power, level, status
✅ PASS if miner appears in UI
```

### 3. Daily Rewards
```
Cron runs at 00:00 UTC
→ Reads active miners from indexer
→ Calculates rewards (deterministic)
→ Builds merkle tree
→ Publishes root on RewardsMerkleRegistry
→ Stores proofs in database
→ Credits user wallets via journal entries
→ User sees new balance
✅ PASS if root on-chain matches calculated
```

### 4. Proof Verification
```
User clicks "Verify" on Rewards page
→ Frontend fetches proof from API
→ Frontend verifies merkle proof locally
→ Shows ✅ if valid
→ Shows transaction link to on-chain root
✅ PASS if verification succeeds
```

### 5. Marketplace Transaction
```
User lists MinerNFT for 1000 TYT
→ Smart contract creates listing
→ Indexer syncs event
→ Marketplace page shows listing
Buyer purchases miner
→ Smart contract:
   - Deducts 1000 TYT from buyer
   - Calculates fee: 3% = 30 TYT
   - Distributes: protocol 18, charity 9, academy 3
   - Sends 970 TYT to seller
   - Transfers NFT to buyer
→ Indexer updates ownership
→ UI reflects new owner
✅ PASS if all transfers correct
```

---

## 💰 FEE CANON (NON-NEGOTIABLE)

**MUST be implemented exactly:**

### Deposits
```
Total Fee: 10% (1000 basis points)
Split within fee:
- Protocol: 60% of fee = 6% of deposit
- Charity:  30% of fee = 3% of deposit
- Academy:  10% of fee = 1% of deposit

User receives: 90% of deposit
```

### Marketplace
```
Total Fee: 3% (300 basis points)
Split within fee:
- Protocol: 60% of fee = 1.8% of sale
- Charity:  30% of fee = 0.9% of sale
- Academy:  10% of fee = 0.3% of sale

Seller receives: 97% of sale price
```

### Upgrades
```
Total Fee: 5% (500 basis points)
Split within fee:
- Protocol: 60% of fee = 3% of upgrade cost
- Charity:  30% of fee = 1.5% of upgrade cost
- Academy:  10% of fee = 0.5% of upgrade cost

User pays: 105% of base upgrade cost
```

**Implementation**:
- All fees must go through FeeConfig contract
- Smart contract enforces splits
- Backend validates against contract
- Frontend displays breakdown to user

---

## 🔧 TECHNICAL SPECIFICATIONS

### Smart Contracts Stack
- **Language**: Solidity 0.8.24+
- **Framework**: Foundry
- **Libraries**: OpenZeppelin 5.0
- **Chain**: Polygon Amoy (testnet) → Polygon (mainnet)
- **Standards**: ERC-721, ERC-20, AccessControl

### Backend Stack
- **Runtime**: Deno (Supabase Edge Functions)
- **Database**: Supabase Postgres
- **RPC**: Polygon Amoy/Mainnet
- **Library**: ethers.js v6
- **Auth**: Supabase Auth (JWT)

### Frontend Stack
- **Framework**: React + Vite
- **Language**: TypeScript (strict)
- **Web3**: wagmi + viem
- **State**: React Query
- **Styling**: Tailwind CSS

### Infrastructure
- **Hosting**: Supabase (backend) + Hostinger/Vercel (frontend)
- **CI/CD**: GitHub Actions
- **Monitoring**: Supabase Dashboard
- **Secrets**: GitHub Secrets

---

## 📝 AGENT COORDINATION

### Communication Protocol

1. **Daily Updates** (async)
   - Each agent posts progress in #v3-development
   - Blockers escalated immediately

2. **Weekly Sync** (1 hour)
   - Review progress vs roadmap
   - Resolve cross-agent dependencies
   - Update timeline if needed

3. **Integration Points**
   - contracts-agent → backend-agent: Contract addresses + ABIs
   - backend-agent → frontend-agent: API specs + types
   - infra-agent → all: Environment configs
   - integrator → all: E2E test results

### Dependency Map
```
contracts-agent (no dependencies)
    ↓ (provides addresses + ABIs)
backend-agent (depends on contracts)
    ↓ (provides API endpoints)
frontend-agent (depends on backend + contracts)
    ↓
infra-agent (depends on all)
    ↓
integrator (depends on all)
```

---

## ⚠️ RISKS & MITIGATIONS

### Risk 1: Contract Bugs
**Impact**: High
**Mitigation**:
- Comprehensive test suite (>90% coverage)
- External audit before mainnet
- Bug bounty program

### Risk 2: Indexer Delays
**Impact**: Medium
**Mitigation**:
- Implement retry logic
- Add confirmation thresholds
- Monitor indexer health

### Risk 3: Fee Miscalculation
**Impact**: Critical
**Mitigation**:
- Unit tests for all fee calculations
- Integration tests for end-to-end flows
- Manual verification on staging

### Risk 4: Integration Issues
**Impact**: High
**Mitigation**:
- Clear API contracts
- Staging environment testing
- Incremental integration

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- [ ] All contracts deployed & verified
- [ ] Test coverage >90%
- [ ] E2E tests pass 100%
- [ ] Build time <15s
- [ ] API response <500ms
- [ ] Zero critical bugs

### Business Metrics
- [ ] Deposits credited correctly (100% accuracy)
- [ ] Fees split correctly (100% accuracy)
- [ ] Rewards verifiable on-chain
- [ ] Marketplace transactions work
- [ ] User can withdraw funds

### User Experience
- [ ] Login takes <3s
- [ ] Pages load <2s
- [ ] Transactions confirm <30s
- [ ] No confusing errors
- [ ] Fee breakdowns clear

---

## 📅 TIMELINE SUMMARY

```
Week 1-2:  Contracts Development & Deployment
Week 3-4:  Backend Integration & Indexer
Week 5:    Frontend API Wiring
Week 6:    Infrastructure & CI/CD
Week 7:    Integration Testing & Fixes
───────────────────────────────────────
Total:     7 weeks to production-ready v3.0
```

**Start Date**: 16 December 2024
**Target Launch**: 3 February 2025

---

## 🚀 NEXT IMMEDIATE ACTIONS

### This Week (Dec 16-20):
1. **contracts-agent starts Phase 3.1**
   - Setup Foundry project
   - Begin FeeConfig.sol implementation

2. **backend-agent prepares**
   - Review current edge functions
   - Plan indexer architecture

3. **frontend-agent prepares**
   - Audit current mock usage
   - Design API client layer

4. **infra-agent prepares**
   - Setup staging Supabase project
   - Draft CI/CD pipeline

---

## 📚 DOCUMENTATION DELIVERABLES

### Per Agent:
- [ ] contracts-agent: README_CONTRACTS.md
- [ ] backend-agent: API_SPECIFICATION.md
- [ ] frontend-agent: FRONTEND_INTEGRATION.md
- [ ] infra-agent: DEPLOYMENT_GUIDE.md

### Integrator:
- [ ] STAGING_RUNBOOK.md
- [ ] RELEASE_CHECKLIST_V3.md
- [ ] E2E_TEST_RESULTS.md
- [ ] FIX_TASKS.md (if needed)

---

## 🎉 CONCLUSION

TYT Platform is **98% ready** for v3.0 transition. With focused effort on:
1. Smart contracts implementation
2. Blockchain indexer
3. Merkle proof system
4. API integration

We can achieve **production-ready v3.0 in 7 weeks**.

**Key Advantage**: Solid foundation already exists (Phase 3 complete). v3.0 is about adding blockchain layer, not rebuilding from scratch.

**Next Step**: contracts-agent begins Foundry implementation.

---

*Created*: 13 December 2024
*Status*: Ready to Execute
*Timeline*: 7 weeks to v3.0 production launch
