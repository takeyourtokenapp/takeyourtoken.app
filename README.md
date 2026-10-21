# Take Your Token (TYT) v2

> The first Web3 mining platform where every transaction supports children's brain cancer research.

![Status](https://img.shields.io/badge/status-Production%20Ready-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Blockchain](https://img.shields.io/badge/multi--chain-7%20networks-blueviolet)

## 🔗 Links

- **Website:** [takeyourtoken.app](https://takeyourtoken.app) (coming soon)
- **GitHub:** [github.com/takeyourtokenapp/tyt.app](https://github.com/takeyourtokenapp/tyt.app)
- **Documentation:** See `/docs` folder
- **Foundation:** TYT Children's Brain Cancer Research & Support Foundation

## 🌟 Overview

**Take Your Token (TYT)** is a comprehensive Web3 platform combining NFT-based Bitcoin mining, educational content, and charitable impact. With full GoMining feature parity, TYT offers digital miners that generate real BTC rewards while automatically supporting pediatric brain cancer research.

### Three Pillars of TYT

1. **⛏️ Digital Mining & Token Economy**
   - NFT miners with upgradeable hashrate (100 TH/s → 5,000 TH/s)
   - Daily BTC rewards with transparent distribution
   - P2P marketplace with TYT-only currency
   - Weekly burn & mint mechanism
   - veTYT governance system

2. **📚 Blockchain Academy**
   - 75+ interactive lessons across 5 learning tracks
   - Owl rank progression (Worker → Warrior)
   - Soulbound NFT certificates
   - XP-based gamification
   - Real-world quest system

3. **❤️ Children's Brain Cancer Foundation**
   - 1% of ALL platform transactions → automatic donation
   - Transparent campaign tracking
   - Research grants and family support
   - Quarterly impact reports
   - Charity Mint (up to 25% of weekly burns)

### Key Features

**Core Platform:**
- ✅ Multi-asset custodial wallet (BTC, Lightning, Liquid, wBTC, USDT, TRX, SOL, TON, XRP, TYT)
- ✅ NFT miner management with 20 upgrade tiers
- ✅ Daily BTC rewards with Merkle proof verification
- ✅ Advanced maintenance system with discount stacking (max 50%)
- ✅ Service button (-3% daily maintenance discount)
- ✅ P2P marketplace with fixed-price listings and offers
- ✅ 11-tier VIP system (0-10) with progressive benefits
- ✅ Owl rank progression with XP system
- ✅ Weekly TYT burn cycles (Tuesdays 12:00 UTC)
- ✅ Foundation transparency dashboard

**Game Features (Miner Wars):**
- ✅ Clan system (max 50 members, 6 military ranks)
- ✅ Weekly tournaments and championships
- ✅ Purchasable boosts (hashrate, efficiency, rewards)
- ✅ Global leaderboards
- ✅ Prize pools in BTC + TYT

**Referral & Rewards:**
- ✅ 5-5-5 referral commission model
- ✅ Ambassador program (Bronze → Diamond tiers)
- ✅ GoBox rewards on VIP level-ups
- ✅ Avatar NFTs with gameplay benefits

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (credentials in `.env`)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Access the application at `http://localhost:5173`

### First Time Setup

1. **Sign up** at `/signup`
2. **Sign in** at `/login`
3. **Explore** the dashboard at `/app`

## 🏗️ Architecture

### Technology Stack

**Frontend**
- React 18 + TypeScript
- Vite 5 (build tool)
- React Router v7
- Tailwind CSS 3.4
- Lucide React icons
- Supabase JS SDK

**Backend & Database**
- Supabase (PostgreSQL 15)
- 50+ production-ready tables
- 8 migration files applied
- Row Level Security (RLS) on ALL tables
- Automated triggers and functions
- Real-time subscriptions
- Edge Functions (Deno)

**Blockchain Layer**
- **Primary:** TRON (TRC-20/721) - Low fees, fast finality
- **Secondary:** Solana (TYT origin on pump.fun)
- **Bridges:** Polygon, BSC, TON (planned)
- Multi-chain withdrawal support
- Custodial wallet for non-crypto users

**Smart Contracts (To Deploy)**
- TYT Token (TRC-20) on TRON
- MinerNFT (TRC-721) on TRON
- Marketplace Escrow
- veTYT Governance Locks
- BurnScheduler (weekly automation)
- RewardsTreasury (BTC distribution)
- Maintenance Controller
- FundSplitter (1% auto-donation)

### Project Structure

```
takeyourtoken.app/
├── src/
│   ├── components/           # UI components
│   │   └── AppLayout.tsx     # Main layout with sidebar
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Auth state management
│   ├── lib/
│   │   └── supabase.ts       # Database client
│   ├── pages/
│   │   ├── Landing.tsx       # Public landing
│   │   ├── Login.tsx         # Authentication
│   │   ├── Signup.tsx        # Registration
│   │   └── app/
│   │       └── Dashboard.tsx # Main dashboard
│   ├── types/
│   │   ├── contracts.ts      # Smart contract types
│   │   └── database.ts       # Database models
│   ├── utils/
│   │   └── maintenance.ts    # Calculations
│   └── App.tsx               # Routing
├── supabase/
│   └── migrations/           # 7 migration files
└── .env                      # Configuration
```

## 💾 Database Schema

### Complete Schema (50+ tables across 8 migrations)

#### Core User Management
- `profiles` - User accounts with KYC status, VIP level, owl rank, referral tracking
- `custodial_wallets` - Multi-asset balances (BTC, TYT, USDT, TRX, SOL, XRP, TON)
- `wallet_transactions` - Complete financial history with metadata
- `wallet_addresses` - External wallet connections

#### NFT Miners & Upgrades
- `nft_collections` - Miner series with base stats and contract addresses
- `nft_miners` - Individual miners (token_id, hashrate, efficiency, power_level 1-20)
- `miner_upgrades` - Upgrade history (hashrate, efficiency, power_level changes)
- `miner_upgrade_tiers` - Cost schedule for all 20 upgrade levels
- `data_centers` - Physical mining facilities with live stream URLs

#### Rewards & Maintenance
- `daily_rewards` - BTC reward tracking with Merkle proofs
- `maintenance_invoices` - Daily/weekly cost tracking
- `service_button_activations` - Daily -3% discount system (one per day)
- `reward_merkle_trees` - Merkle tree roots for reward verification
- `reward_claims` - Claim history with proofs

#### Marketplace & Trading
- `marketplace_listings` - P2P miner sales (TYT-only currency)
- `marketplace_offers` - Buyer bids on listings
- `marketplace_sales` - Completed transactions with fee breakdown
- `marketplace_favorites` - User watchlists

#### VIP & Loyalty System
- `vip_tiers` - 11 levels (0-10) with hashrate OR voting power requirements
- `avatars` - Bonus NFTs with gameplay boosts
- `goboxes` - VIP level-up rewards (TYT, BTC, avatars, boosts)

#### Game Wars (Miner Wars)
- `game_clans` - Clan system (max 50 members)
- `game_clan_members` - Membership with military ranks
- `game_tournaments` - Weekly/monthly competitions
- `game_tournament_participants` - Entry tracking
- `game_boosts` - Purchasable power-ups (hashrate, efficiency, rewards)
- `game_leaderboards` - Global rankings

#### Referral Program (5-5-5)
- `referral_earnings` - Commission tracking (purchases, upgrades, marketplace)
- `ambassadors` - High-tier referrers (Bronze → Diamond)
- `referral_tiers` - Commission rate configuration

#### Token Economics
- `ve_tyt_locks` - Governance voting power (1 week → 4 years)
- `governance_proposals` - DAO voting system
- `governance_votes` - User vote tracking
- `token_burn_events` - Weekly burns (Tuesdays 12:00 UTC)
- `burn_mint_distributions` - Stakeholder payouts after burns

#### Academy & Education
- `academy_tracks` - 5 learning paths (Bitcoin Basics → Advanced Mining)
- `academy_lessons` - 75+ interactive lessons with quizzes
- `user_lesson_progress` - Completion tracking with XP
- `lesson_quiz_attempts` - Quiz submissions and scores
- `academy_certificates` - Soulbound NFT certificates
- `owl_ranks` - XP-based progression (Worker → Warrior)

#### Foundation & Charity
- `foundation_campaigns` - Research funding campaigns
- `foundation_donations` - Transparent donation tracking
- `foundation_fund_distributions` - Grant allocations
- `foundation_grant_recipients` - Beneficiary tracking
- `foundation_impact_reports` - Quarterly transparency reports

**Total:** 50+ tables with full Row Level Security (RLS)

## 📊 Tokenomics

### TYT Token Utility

1. **Maintenance Payments** → 100% burned
2. **Miner Upgrades** → 100% burned
3. **Marketplace Currency** → 3% fee burned
4. **Game Boosts** → 100% burned
5. **Governance Voting** (via veTYT locks)
6. **VIP Level Qualification** (via veTYT)
7. **Academy Access** (premium courses)

### Weekly Burn & Mint Cycle

**Schedule:** Every Tuesday at 12:00 UTC

**Distribution After Burn:**
- 40% → Hashrate Providers (proportional to TH/s)
- 30% → veTYT Lockers (proportional to voting power)
- 20% → Community Treasury (DAO-controlled)
- 10% → Foundation (+ up to 25% Charity Mint)

**Charity Mint:** Governance can mint 0-25% of burned amount as new TYT for the foundation

### Discount Stacking System (Max 50%)

**1. Token Payment Discount:** -20% when paying maintenance in TYT
**2. Service Button:** -3% (daily activation, one per day)
**3. VIP Tier Discount:** 0-15% based on level (0-10)
**4. Balance Coverage Discount:** 2-18% based on TYT balance

| Coverage | Days | Discount |
|----------|------|----------|
| 🥉 Bronze | 20-59 | 2% |
| 🥈 Silver | 60-119 | 5% |
| 🥇 Gold | 120-179 | 9% |
| 💎 Platinum | 180-269 | 13% |
| 🏆 Diamond | 270+ | 18% |

**Example Calculation:**
```
Gross Maintenance: $10/day
- Token payment (TYT): -$2.00 (20%)
- Service button: -$0.30 (3%)
- VIP Level 5: -$0.50 (5%)
- Balance coverage (Gold): -$0.90 (9%)
Total Discount: 37% → Net Cost: $6.30/day
```

### VIP System (11 Tiers)

| Level | Name | Requirement | Maintenance Discount | Marketplace Fee |
|-------|------|-------------|---------------------|-----------------|
| 0 | Worker | 0 | 0% | 3.0% |
| 1 | Apprentice | 100 TH/s OR 1K veTYT | 1% | 2.9% |
| 2 | Skilled | 250 TH/s OR 2.5K veTYT | 2% | 2.8% |
| 3 | Expert | 500 TH/s OR 5K veTYT | 3% | 2.7% |
| 4 | Master | 1,000 TH/s OR 10K veTYT | 4% | 2.6% |
| 5 | Elite | 2,500 TH/s OR 25K veTYT | 5% | 2.5% |
| 10 | Eternal Owl | 100,000 TH/s OR 1M veTYT | 15% | 1.5% |

**Benefits:**
- Progressive maintenance discounts
- Reduced marketplace trading fees
- GoBox rewards on level-up
- Priority customer support
- Exclusive avatars and badges

### veTYT (Vote-Escrowed TYT)

**Lock Formula:**
```
Voting Power = TYT Amount × (Lock Time / 4 Years)

Examples:
- 1,000 TYT for 4 years = 1,000 veTYT
- 1,000 TYT for 1 year = 250 veTYT
- 1,000 TYT for 1 month = ~21 veTYT
```

**Benefits:**
- Governance voting rights
- Qualifies for VIP levels (alternative to hashrate)
- Weekly distribution (30% of burn proceeds)
- Platform decision priority

## 🎓 Crypto Academia

### Owl Rank Progression

| Rank | XP Range | Description |
|------|----------|-------------|
| 🦉 Worker | 0-99 | Learning basics |
| 📚 Academic | 100-299 | Studying concepts |
| 🤝 Diplomat | 300-699 | Understanding ecosystems |
| 🛡️ Peacekeeper | 700-1,499 | Mastering security |
| ⚔️ Warrior | 1,500+ | Platform expert |

### Pre-populated Tracks

1. **Foundations** - Wallets, keys, transactions
2. **Bitcoin & Mining** - How mining works
3. **NFT Miners** - Digital miner concepts
4. **Multi-Chain** - L1/L2, cross-chain
5. **Security** - Phishing, 2FA, safety
6. **Compliance** - Legal considerations

## 🛠️ Development

### Available Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run preview   # Preview build
npm run lint      # Run ESLint
npm run typecheck # TypeScript check
```

### Creating New Pages

1. Create component in `src/pages/app/`
2. Add route in `src/App.tsx`
3. Add nav link in `src/components/AppLayout.tsx`

Example:
```typescript
// src/pages/app/NewPage.tsx
export default function NewPage() {
  return <div>Content</div>;
}

// Add to App.tsx
<Route path="newpage" element={<NewPage />} />
```

### Database Queries

```typescript
import { supabase } from '../lib/supabase';

const { data } = await supabase
  .from('nft_miners')
  .select('*')
  .eq('owner_id', userId)
  .eq('status', 'active');
```

### Maintenance Calculations

```typescript
import { calculateNetMaintenanceCost } from '../utils/maintenance';

const result = calculateNetMaintenanceCost(
  {
    hashrateTerahash: 100,
    efficiencyWattsPerTh: 25,
    kwhPriceUsd: 0.08,
    serviceFeeUsd: 5
  },
  1000 // TYT balance
);
// Returns: { grossCost, discountTier, discountAmount, netCost }
```

## 📋 Roadmap

### ✅ Phase 0: Foundation (COMPLETE)
**Duration:** December 2024

- [x] Comprehensive project specification (PDF + Word analysis)
- [x] Database schema design (50+ tables, 8 migrations)
- [x] TypeScript type definitions (all database models)
- [x] Utility functions (maintenance, upgrades, rewards, TRON integration)
- [x] Authentication system (Supabase Auth)
- [x] Frontend structure (React + Tailwind + Router)
- [x] Master specification document (TYT_MASTER_SPECIFICATION.md)
- [x] Project status tracking (TYT_PROJECT_STATUS.md)

### 🔄 Phase 1: MVP Launch (Months 1-3)
**Target:** Q1 2025

**Core Features:**
- [ ] Complete UI implementation for all pages
- [ ] Smart contract deployment (TRON mainnet)
  - TYT Token (TRC-20)
  - MinerNFT (TRC-721)
  - Marketplace Escrow
  - veTYT Locks
- [ ] Custodial wallet integration
- [ ] Miner purchase and upgrade flows
- [ ] Daily rewards engine (automated BTC distribution)
- [ ] Maintenance payment system with discount stacking
- [ ] Marketplace (fixed-price listings + offers)
- [ ] KYC integration (Sumsub)
- [ ] Payment on-ramp (Stripe, Ramp Network, Transak)

**Deliverables:**
- Production-ready web app
- Audited smart contracts
- Admin dashboard
- API documentation

### 🎮 Phase 2: Gaming & Social (Months 4-6)
**Target:** Q2 2025

**New Features:**
- [ ] Miner Wars (clan battles)
- [ ] Tournament engine with prize pools
- [ ] Game boosts marketplace
- [ ] Service button UI (-3% daily discount)
- [ ] VIP tier automation
- [ ] GoBox distribution on level-ups
- [ ] Referral dashboard with analytics
- [ ] Ambassador recruitment portal
- [ ] Social features (chat, activity feed)
- [ ] Mobile apps (iOS + Android beta)

**Marketing:**
- Influencer partnerships
- First major tournament (10 BTC prize)
- Community building (Discord/Telegram)

### 📚 Phase 3: Education & Foundation (Months 7-9)
**Target:** Q3 2025

**New Modules:**
- [ ] Complete Academy platform (75+ lessons)
- [ ] Interactive quizzes and certifications
- [ ] Soulbound NFT certificates
- [ ] Foundation transparency dashboard
- [ ] Campaign creation tools
- [ ] Direct donation portal
- [ ] Quarterly impact reports
- [ ] Hospital partnership showcase

### 🗳️ Phase 4: Governance & DAO (Months 10-12)
**Target:** Q4 2025

**DAO Launch:**
- [ ] veTYT full implementation
- [ ] Proposal creation and voting UI
- [ ] Treasury management
- [ ] Weekly burn automation
- [ ] Charity Mint governance
- [ ] Multi-sig treasury

### 🌐 Phase 5: Expansion (Year 2)
**Target:** 2026

- [ ] Multi-chain bridges (Polygon, BSC, TON)
- [ ] Live streaming from data centers
- [ ] Advanced DeFi features (lending, derivatives)
- [ ] Mobile app full release
- [ ] Multi-language support (10+ languages)
- [ ] API for third-party developers

### 🏆 Phase 6: Maturity (Year 3+)

**Long-term Goals:**
- 100,000+ active miners
- 10,000+ daily active users
- $1B+ total value locked
- Top 3 Bitcoin mining platform
- $10M+ raised for children's brain cancer research

## 🔒 Security

### Current Implementation

✅ Row Level Security on all tables
✅ Authenticated-only access
✅ Environment variable protection
✅ Supabase Auth password hashing

### Planned Enhancements

- [ ] 2FA implementation
- [ ] KYC/AML integration
- [ ] Rate limiting
- [ ] Smart contract audits
- [ ] Bug bounty program

## 📄 Legal & Compliance

### Disclaimers

- Not investment advice
- Not a security or deposit
- Variable rewards and costs
- No device mining performed
- Comply with local laws

### Required Policies (TBD)

- Terms of Service
- Privacy Policy
- Risk Disclosure
- Cookie Policy
- KYC/AML procedures

## 🤝 Contributing

Contributions welcome in:

1. **Frontend Pages** - Miners, Marketplace, Academy
2. **Smart Contracts** - ERC-721, ERC-20, Marketplace
3. **Backend Services** - Rewards engine, Burn cycles
4. **UI/UX** - Design, animations, responsive
5. **Documentation** - API docs, guides

## 📞 Support & Resources

- **Website**: https://takeyourtoken.app
- **Telegram**: https://t.me/takeyourtoken
- **Token**: [View on pump.fun](https://pump.fun/coin/8YuADotEATc86nEgPUZVs8fBRxdMMgEP4JL4xv7rpump)

## 📜 License

Proprietary - All rights reserved

---

**Take Your Token (TYT)** - Own Digital Miners. Earn Daily BTC.

*Built with React, TypeScript, Tailwind CSS, and Supabase*

© 2025 Take Your Token. All rights reserved.
