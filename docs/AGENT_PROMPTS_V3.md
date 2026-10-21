# 🧩 TYT v3 — AGENT PROMPTS PACK

**Готово для bolt.new**
**Каждый блок — отдельный запуск агента**

**Цель:** Превратить v2/MVP с заглушками в **v3 realworld**
(реальные сети, деньги, фонд, академия, GitHub-дисциплина)

---

## 🔹 PROMPT 1 — `contracts-agent v3`

*(блокчейн = колёса)*

```
ROLE: contracts-agent (Senior Solidity / Foundry)
PROJECT: TakeYourToken.app (TYT)
REPO: https://github.com/takeyourtokenapp/tyt.app

GOAL:
Build and deploy the real on-chain core for TYT v3.
Replace demo/stub contracts with production-ready smart contracts.

TARGET CHAIN (v3.0):
- Polygon Amoy (staging)
- Polygon Mainnet (production later)

CANON RULES (MUST):
- deposit_fee_total_bps = 1000 (10%)
- fee split inside fee_total:
  - protocol = 60%
  - charity  = 30%
  - academy  = 10%
- NEVER copy GoMining code or text 1:1
- All critical actions emit events

CONTRACTS TO IMPLEMENT:

1) FeeConfig.sol
- Stores fee profiles by bytes32 key:
  "deposit.default"
  "marketplace.default"
  "withdraw.default"
- Each profile:
  totalBps (0–2000)
  recipients[]
  splitBps[] (sum = 10000)
- Roles:
  DEFAULT_ADMIN_ROLE
  FEE_MANAGER_ROLE

2) CharityVault.sol
- Receives ERC20 + native
- Tracks totals per token
- Withdraw only by TREASURY_ROLE (multisig)
- Emits DonationReceived / DonationWithdrawn

3) MinerNFT.sol (ERC-721)
- Parameters:
  powerTH
  efficiencyWTH
  farmId
  status
- Functions:
  mintMiner
  upgradePower
  upgradeEfficiency
  setStatus
- Emits MinerMinted / MinerUpgraded / StatusChanged

4) RewardsMerkleRegistry.sol
- Stores daily merkle roots by dateKey
- Root is immutable once set
- Only REWARD_PUBLISHER_ROLE can add

5) MinerMarketplace.sol
- listMiner / buyNow / cancel
- Uses FeeConfig("marketplace.default")
- Fee distribution strictly by 60/30/10

TECH:
- Solidity ^0.8.x
- OpenZeppelin
- Foundry (forge)

DELIVERABLES:
- /contracts/evm/*
- deploy scripts:
  deploy_amoy.s.sol
  deploy_mainnet.s.sol
- tests (forge test)
- deployments/amoy.json

DoD:
- forge test passes
- deploys successfully to Amoy
- fee split math exact
- events emitted
- README_contracts.md created

BRANCH:
feat/v3-contracts-core
```

---

## 🔹 PROMPT 2 — `backend-agent v3`

*(деньги = сердце системы)*

```
ROLE: backend-agent (Senior Backend / NestJS)
PROJECT: TakeYourToken.app (TYT)

GOAL:
Replace all mock APIs with real services:
ledger, deposits, rewards, indexers, foundation accounting.

STACK:
- Node.js + NestJS
- PostgreSQL
- Redis (optional)
- ethers.js

CORE RULE:
wallet-ledger-service is the ONLY source of truth for balances.

SERVICES TO IMPLEMENT:

1) wallet-ledger-service
- Double-entry accounting
- Tables:
  accounts
  ledger_entries
  ledger_lines
  balances (derived)
- Apply deposit fee:
  user = 90%
  protocol = 6%
  charity = 3%
  academy = 1%

2) blockchain-gateway-service
- Polygon ERC20 deposits & withdrawals
- Confirmation tracking
- Idempotent processing

3) chain-indexer-service
- Index events:
  MinerNFT
  Marketplace
  RewardsMerkleRegistry
  CharityVault
- Reorg-safe
- Builds read-model for frontend

4) rewards-engine-service
- Daily cron
- Calculates rewards
- Writes credits to ledger
- Builds Merkle tree
- Publishes root on-chain
- Exposes proof API

5) foundation-service
- Reads charity ledger entries
- Generates reports:
  totals
  inflows
  allocations

DATABASE:
- Migrations required
- Use Prisma or TypeORM (choose one)

SECURITY:
- JWT auth
- Withdraw limits
- Rate limiting

DoD:
- Deposit 1000 → ledger shows 900 / 60 / 30 / 10
- Rewards root published on-chain
- Proof retrievable and verifiable
- Indexer updates frontend data

BRANCH:
feat/v3-backend-rails
```

---

## 🔹 PROMPT 3 — `frontend-agent v3`

*(пользователь видит реальность, не демо)*

```
ROLE: frontend-agent (Senior Next.js)
PROJECT: TakeYourToken.app (TYT)

GOAL:
Replace demo data with real API + blockchain data
WITHOUT breaking existing UI/branding.

STACK:
- Next.js
- TypeScript
- wagmi + viem
- react-query or SWR

MIGRATION ORDER:

1) Auth & Profile
- JWT login
- session persistence

2) Wallet
- GET /wallet/balance
- GET /wallet/history
- POST /wallet/withdraw
- Show fee breakdown (6/3/1)

3) Miners
- Display user MinerNFTs from indexer
- Show status & power

4) Rewards
- Show daily rewards
- Fetch proof
- Verify Merkle proof in-browser
- Show ✅ verified

5) Marketplace
- Render real listings
- Buy/list actions
- Fee preview

6) Foundation
- Totals
- Reports
- Charity inflows

RULES:
- Mock data behind flag:
  NEXT_PUBLIC_USE_MOCKS=false
- Typed API client
- Loading & error states

DoD:
- User sees real balances
- Rewards verify works
- Marketplace renders from chain data

BRANCH:
feat/v3-frontend-real-api
```

---

## 🔹 PROMPT 4 — `infra-agent v3`

*(рельсы, без которых всё развалится)*

```
ROLE: infra-agent (DevOps)
PROJECT: TakeYourToken.app (TYT)

GOAL:
Make the system reproducible, deployable, and safe.

TASKS:

1) docker-compose
- postgres
- backend services
- optional redis

2) Environment templates
- backend.env.example
- frontend.env.example
- NO secrets committed

3) GitHub Actions
- CI:
  lint
  test
  forge test
- CD:
  deploy to staging via SSH

4) Staging deployment
- Hostinger / VPS compatible
- migrations included

5) Documentation
- README_DEPLOY.md
- RUN_LOCAL.md

DoD:
- `docker compose up` works
- CI green
- staging deploy reproducible

BRANCH:
feat/v3-infra-rails
```

---

## 🔹 PROMPT 5 — `integrator-agent v3`

*(ты собираешь машину и заводишь её)*

```
ROLE: integrator-agent (Release Manager)
PROJECT: TakeYourToken.app (TYT)

GOAL:
Merge all v3 agents, run staging, verify system works end-to-end.

MERGE ORDER:
1) infra
2) contracts
3) backend
4) frontend

E2E CHECKS (MUST PASS):

1) Login works
2) Deposit fee split:
   1000 → 900 / 60 / 30 / 10
3) MinerNFT indexed and visible
4) Rewards root published + proof verified
5) Marketplace listing visible

DOCUMENTATION TO CREATE:
- /docs/STAGING_RUNBOOK.md
- /docs/RELEASE_CHECKLIST_V3.md
- /docs/FIX_TASKS.md (if anything fails)

DoD:
- staging branch builds
- E2E checks documented
- system confirmed "drives"

BRANCH:
feat/v3-integration-runbook
```

---

## 🟢 Порядок Запуска

### Последовательность:
1. **contracts-agent** → создаёт смарт-контракты
2. **backend-agent** → создаёт сервисы
3. **infra-agent** → настраивает инфраструктуру
4. **frontend-agent** → подключает UI к реальным данным
5. **integrator-agent** → собирает всё вместе и проверяет

### Каждый промпт = 1 сессия bolt.new

**Важно**: Не смешивать промпты. Каждый агент работает независимо на своей ветке.

---

## 📊 Метрики Готовности v3

| Компонент | v2 (MVP) | v3 (Real) |
|-----------|----------|-----------|
| Контракты | Demo (hardhat) | Production (Polygon) |
| Backend | Mock API | Real services |
| Депозиты | Заглушки | Реальные ERC20 |
| Награды | Fake | Merkle proofs |
| Фонд | Концепт | Живая бухгалтерия |
| Академия | 15+ уроков ✅ | Готово |
| Кошелёк | Unified ✅ | Готово |

---

## 🎯 Конечная Цель v3

**Превратить TYT из прототипа в production-ready Web3 платформу**:

✅ Реальные деньги
✅ Реальный блокчейн
✅ Проверяемые награды
✅ Прозрачный фонд
✅ Профессиональная инфраструктура

---

## 📚 Связанные Документы

- `TYT_V2_MASTER_BLUEPRINT.md` - Полная архитектура
- `V3_TRANSITION_PLAN.md` - План перехода v2→v3
- `ACADEMY_COMPLETE_UPDATE.md` - Готовая академия
- `FINAL_SUMMARY.md` - Текущий статус

---

**Статус**: 📦 Готово к использованию
**Версия**: 3.0
**Дата**: December 13, 2024
