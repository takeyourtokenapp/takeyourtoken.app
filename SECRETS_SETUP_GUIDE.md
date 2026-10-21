# 🔐 TYT SECRETS SETUP GUIDE

**Complete guide to configuring all API keys and secrets for TYT Ecosystem V2**

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Required Secrets](#required-secrets)
3. [Optional Secrets](#optional-secrets)
4. [Auto-Configured Secrets](#auto-configured-secrets)
5. [Step-by-Step Setup](#step-by-step-setup)
6. [Bolt.new Configuration](#boltnew-configuration)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW

TYT requires several API keys and secrets for full functionality:

### Priority Levels

**🔴 CRITICAL** - Required for core functionality
**🟡 IMPORTANT** - Needed for specific features
**🟢 OPTIONAL** - Nice-to-have enhancements

---

## ✅ REQUIRED SECRETS

### 1. WEBHOOK_SECRET 🔴

**What it does:** Protects blockchain webhook endpoints from unauthorized access

**Used by:**
- `supabase/functions/blockchain-webhook`
- `supabase/functions/monitor-deposits`

**How to generate:**

```bash
# macOS/Linux
openssl rand -hex 32

# Output example: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Where to add:**
- Bolt.new: Project Settings → Secrets → `WEBHOOK_SECRET`
- Local: `.env` file

**Security level:** CRITICAL - If compromised, attackers can fake deposits

---

### 2. ALCHEMY_API_KEY 🔴

**What it does:** Provides RPC access to Ethereum, Polygon, and other EVM chains

**Used by:**
- `supabase/functions/check-balance`
- Frontend blockchain connections
- Contract deployment

**How to get:**

1. Visit **https://alchemy.com/**
2. Sign up (free account)
3. Click **"Create New App"**
4. Configure:
   - **Name:** TYT Ecosystem V2
   - **Chain:** Polygon
   - **Network:** Polygon Amoy (for testnet) or Polygon Mainnet
5. Click **"View Key"**
6. Copy the **API Key** (not the full URL)

**Example key format:** `abc123def456ghi789jkl012mno345pq`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `ALCHEMY_API_KEY`
- Local: `.env` → `ALCHEMY_API_KEY` and `VITE_ALCHEMY_API_KEY`

**Free tier:** 300M compute units/month (~1M requests)

**Security level:** IMPORTANT - If compromised, attackers can consume your quota

---

### 3. TRONGRID_API_KEY 🔴

**What it does:** Provides API access to TRON blockchain

**Used by:**
- `supabase/functions/check-balance`
- `supabase/functions/monitor-deposits`
- TRON deposit/withdrawal functionality

**How to get:**

1. Visit **https://www.trongrid.io/**
2. Click **"Sign Up"**
3. Verify email
4. Go to **"API Keys"** section
5. Click **"Create API Key"**
6. Copy the key

**Example key format:** `12345678-90ab-cdef-1234-567890abcdef`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `TRONGRID_API_KEY`
- Local: `.env` → `TRONGRID_API_KEY` and `VITE_TRONGRID_API_KEY`

**Free tier:** 15,000 requests/day

**Security level:** IMPORTANT - If compromised, attackers can consume your quota

---

### 4. CRON_SECRET 🔴

**What it does:** Protects cron job endpoints from unauthorized execution

**Used by:**
- `supabase/functions/cron-daily-rewards`
- `supabase/functions/cron-weekly-burn`
- `supabase/functions/cron-maintenance-invoices`

**How to generate:**

```bash
# macOS/Linux
openssl rand -hex 32

# Output example: b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567
```

**Where to add:**
- Bolt.new: Project Settings → Secrets → `CRON_SECRET`
- Local: `.env` file

**Security level:** CRITICAL - If compromised, attackers can trigger rewards/burn operations

---

### 5. WALLET_ENCRYPTION_KEY 🔴🔴🔴

**What it does:** Encrypts custodial wallet private keys in database

**Used by:**
- `supabase/functions/generate-custodial-address`
- `supabase/functions/generate-deposit-address`

**How to generate:**

```bash
# macOS/Linux - MUST be at least 32 characters
openssl rand -hex 32

# Output example: c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678
```

**Where to add:**
- Bolt.new: Project Settings → Secrets → `WALLET_ENCRYPTION_KEY`
- Local: `.env` file

**⚠️ CRITICAL WARNINGS:**

1. **NEVER change this in production!** All existing wallets will become inaccessible
2. **NEVER commit this to Git!** Add to `.gitignore`
3. **BACKUP securely!** Store in password manager + encrypted backup
4. **Use strong value!** Minimum 32 characters, preferably 64

**Security level:** ULTRA CRITICAL - If lost, all user funds are permanently inaccessible

---

### 6. VITE_WALLETCONNECT_PROJECT_ID 🔴

**What it does:** Enables WalletConnect integration for Web3 wallets

**Used by:**
- Frontend wallet connection
- `src/lib/web3/config.ts`

**How to get:**

1. Visit **https://cloud.walletconnect.com/**
2. Sign up (free account)
3. Click **"Create New Project"**
4. Enter:
   - **Project Name:** TYT Ecosystem V2
   - **Project URL:** https://tyt.app (your domain)
5. Copy the **Project ID**

**Example format:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `VITE_WALLETCONNECT_PROJECT_ID`
- Local: `.env` → `VITE_WALLETCONNECT_PROJECT_ID`

**Free tier:** Unlimited projects, 1M requests/month

**Security level:** IMPORTANT - Public in frontend, but tracks usage

---

### 7. VITE_TYT_TOKEN_MINT 🔴

**What it does:** Your TYT token address on Solana

**Used by:**
- Token swap functionality
- Balance checking
- Trading integration

**How to get:**

Your TYT token is already created on pump.fun. The address format:

**Example format:** `TYT8xRq2vJz1N3m4K5p6Q7r8S9t0U1v2W3x4Y5z6A7b8C`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `VITE_TYT_TOKEN_MINT`
- Local: `.env` → `VITE_TYT_TOKEN_MINT`

**Security level:** PUBLIC - This is your public token address

---

## 🟡 OPTIONAL SECRETS

### 8. SENDGRID_API_KEY 🟡

**What it does:** Sends transactional emails (notifications, verification)

**Used by:**
- `supabase/functions/send-email`
- User notifications
- Email verification

**How to get:**

1. Visit **https://sendgrid.com/**
2. Sign up (free account)
3. Go to **Settings** → **API Keys**
4. Click **"Create API Key"**
5. Select **"Full Access"**
6. Copy the key (shown only once!)

**Example format:** `SG.abc123def456ghi789jkl012mno345pq.rst678uvw901xyz234abc567def890ghi123`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `SENDGRID_API_KEY`
- Local: `.env` → `SENDGRID_API_KEY`

**Free tier:** 100 emails/day

**Security level:** IMPORTANT - If compromised, attackers can send spam from your domain

**Alternative:** You can use Supabase's built-in email service instead

---

### 9. STRIPE_SECRET_KEY 🟡

**What it does:** Enables credit card payments for fiat on-ramp

**Used by:**
- Payment processing
- Subscription management

**How to get:**

1. Visit **https://dashboard.stripe.com/register**
2. Complete business verification
3. Go to **Developers** → **API Keys**
4. Copy **Secret key** (starts with `sk_`)

**Example format:** `sk_test_abc123def456ghi789jkl012mno345pqrst678uvw901xyz234`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `STRIPE_SECRET_KEY`
- Local: `.env` → `STRIPE_SECRET_KEY`

**Free tier:** No monthly fee, per-transaction fees apply

**Security level:** CRITICAL - If compromised, attackers can process refunds/payments

---

### 10. OPENNODE_API_KEY 🟡

**What it does:** Enables Bitcoin Lightning Network payments

**Used by:**
- Fast Bitcoin payments
- Instant settlements

**How to get:**

1. Visit **https://opennode.com/**
2. Sign up
3. Complete KYC verification
4. Go to **Settings** → **API**
5. Generate API Key

**Example format:** `a1b2c3d4-e5f6-7890-1234-567890abcdef`

**Where to add:**
- Bolt.new: Project Settings → Secrets → `OPENNODE_API_KEY`
- Local: `.env` → `OPENNODE_API_KEY`

**Security level:** CRITICAL - Financial access

---

## 🔵 AUTO-CONFIGURED SECRETS

These are automatically available and **do NOT need to be added manually:**

### SUPABASE_URL ✅
- Auto-configured by Bolt.new
- Available in frontend as `VITE_SUPABASE_URL`
- Available in Edge Functions as `SUPABASE_URL`

### SUPABASE_ANON_KEY ✅
- Auto-configured by Bolt.new
- Available in frontend as `VITE_SUPABASE_ANON_KEY`
- Available in Edge Functions as `SUPABASE_ANON_KEY`

### SUPABASE_SERVICE_ROLE_KEY ✅
- Auto-configured by Supabase
- **Only available in Edge Functions** (not in frontend!)
- Used for admin operations (bypasses RLS)

**⚠️ DO NOT:**
- Try to add these manually
- Expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Commit `SUPABASE_SERVICE_ROLE_KEY` to Git

---

## 🚀 STEP-BY-STEP SETUP

### Phase 1: Generate Security Secrets (5 minutes)

```bash
# Open terminal and generate all security secrets at once
echo "WEBHOOK_SECRET=$(openssl rand -hex 32)"
echo "CRON_SECRET=$(openssl rand -hex 32)"
echo "WALLET_ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

**Save the output securely!** You'll need these values next.

---

### Phase 2: Get API Keys (15-20 minutes)

#### 2.1 Alchemy (5 minutes)
1. Go to https://alchemy.com/
2. Sign up → Create App → Polygon Amoy
3. Copy API key
4. Save as `ALCHEMY_API_KEY`

#### 2.2 TronGrid (5 minutes)
1. Go to https://www.trongrid.io/
2. Sign up → API Keys → Create
3. Copy API key
4. Save as `TRONGRID_API_KEY`

#### 2.3 WalletConnect (3 minutes)
1. Go to https://cloud.walletconnect.com/
2. Sign up → Create Project
3. Copy Project ID
4. Save as `VITE_WALLETCONNECT_PROJECT_ID`

#### 2.4 TYT Token Address (1 minute)
1. Find your pump.fun token address
2. Save as `VITE_TYT_TOKEN_MINT`

---

### Phase 3: Configure Bolt.new (5 minutes)

1. Open your project in Bolt.new
2. Click **⚙️ Settings** (bottom left)
3. Navigate to **🔐 Secrets**
4. Add each secret:

**Required secrets to add:**
```
Name: WEBHOOK_SECRET
Value: [paste generated value]

Name: ALCHEMY_API_KEY
Value: [paste from Alchemy]

Name: TRONGRID_API_KEY
Value: [paste from TronGrid]

Name: CRON_SECRET
Value: [paste generated value]

Name: WALLET_ENCRYPTION_KEY
Value: [paste generated value]

Name: VITE_WALLETCONNECT_PROJECT_ID
Value: [paste from WalletConnect]

Name: VITE_TYT_TOKEN_MINT
Value: [paste your token address]
```

5. Click **Save** for each secret

---

### Phase 4: Update Local .env (2 minutes)

```bash
# Edit .env file
nano .env

# Or use VS Code
code .env
```

Add all the values you collected:

```bash
ALCHEMY_API_KEY=your_alchemy_key_here
VITE_ALCHEMY_API_KEY=your_alchemy_key_here
TRONGRID_API_KEY=your_trongrid_key_here
VITE_TRONGRID_API_KEY=your_trongrid_key_here
WEBHOOK_SECRET=your_generated_webhook_secret
CRON_SECRET=your_generated_cron_secret
WALLET_ENCRYPTION_KEY=your_generated_encryption_key
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_TYT_TOKEN_MINT=your_tyt_token_address
```

**Save and close.**

---

### Phase 5: Verify Configuration (2 minutes)

```bash
# Check that secrets are set (without showing values)
node -e "
require('dotenv').config();
const required = [
  'WEBHOOK_SECRET',
  'ALCHEMY_API_KEY',
  'TRONGRID_API_KEY',
  'CRON_SECRET',
  'WALLET_ENCRYPTION_KEY',
  'VITE_WALLETCONNECT_PROJECT_ID',
  'VITE_TYT_TOKEN_MINT'
];
console.log('Checking secrets...');
required.forEach(key => {
  const value = process.env[key];
  if (!value || value.includes('placeholder') || value.includes('your_')) {
    console.log('❌', key, '- NOT SET');
  } else {
    console.log('✅', key, '- Set (' + value.length + ' chars)');
  }
});
"
```

**Expected output:**
```
Checking secrets...
✅ WEBHOOK_SECRET - Set (64 chars)
✅ ALCHEMY_API_KEY - Set (32 chars)
✅ TRONGRID_API_KEY - Set (36 chars)
✅ CRON_SECRET - Set (64 chars)
✅ WALLET_ENCRYPTION_KEY - Set (64 chars)
✅ VITE_WALLETCONNECT_PROJECT_ID - Set (32 chars)
✅ VITE_TYT_TOKEN_MINT - Set (44 chars)
```

---

## 🎯 BOLT.NEW CONFIGURATION

### Current Status (from your screenshot)

**✅ Already configured:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**❌ Missing (need to add):**
- `WEBHOOK_SECRET`
- `ALCHEMY_API_KEY`
- `TRONGRID_API_KEY`
- `CRON_SECRET`
- `WALLET_ENCRYPTION_KEY`
- `SENDGRID_API_KEY` (optional)

### How to Add in Bolt.new

1. Click **⚙️ icon** (bottom left, or Project Settings)
2. Click **🔐 Secrets** tab
3. For each missing secret:
   - Enter **Name** (exact spelling, case-sensitive!)
   - Enter **Value** (paste the key/secret)
   - Click **Save** or **Add**

### Testing in Bolt.new

After adding secrets, test that they're available:

```typescript
// In any Edge Function or frontend code
console.log('Testing secrets availability:');
console.log('WEBHOOK_SECRET:', Deno.env.get('WEBHOOK_SECRET') ? '✅ Set' : '❌ Missing');
console.log('ALCHEMY_API_KEY:', Deno.env.get('ALCHEMY_API_KEY') ? '✅ Set' : '❌ Missing');
```

---

## 🔒 SECURITY BEST PRACTICES

### 1. Secret Storage

**DO:**
- ✅ Use password manager (1Password, Bitwarden, LastPass)
- ✅ Store encrypted backup of `.env` file
- ✅ Use different secrets for dev/staging/production
- ✅ Rotate secrets every 90 days

**DON'T:**
- ❌ Commit `.env` to Git
- ❌ Share secrets via email/Slack
- ❌ Use same secrets across projects
- ❌ Store secrets in plain text files

### 2. Access Control

**Production secrets should only be accessible by:**
- Project owner
- DevOps lead
- Maximum 2-3 people

### 3. Secret Rotation Schedule

**Every 30 days:**
- Rotate `WEBHOOK_SECRET`
- Rotate `CRON_SECRET`

**Every 90 days:**
- Rotate API keys (`ALCHEMY_API_KEY`, `TRONGRID_API_KEY`)

**NEVER rotate:**
- `WALLET_ENCRYPTION_KEY` (once set in production, never change!)

### 4. Compromise Response

If any secret is compromised:

**Immediate actions (within 1 hour):**
1. Rotate the compromised secret
2. Update in all environments
3. Check logs for unauthorized access
4. Notify team

**For `WALLET_ENCRYPTION_KEY` compromise:**
1. **DO NOT ROTATE** (will lock all wallets!)
2. Implement key migration strategy
3. Contact security consultant

### 5. Monitoring

Set up alerts for:
- Unusual API usage spikes
- Failed authentication attempts
- Unexpected webhook calls
- Suspicious deposit/withdrawal patterns

---

## 🔍 TROUBLESHOOTING

### "Missing secrets" error in Bolt.new

**Problem:** Bolt.new shows secrets are missing

**Solution:**
1. Go to Project Settings → Secrets
2. Check spelling (case-sensitive!)
3. Ensure no trailing spaces
4. Click Save after each secret
5. Refresh page

### Edge Functions can't access secrets

**Problem:** `Deno.env.get('SECRET_NAME')` returns undefined

**Solutions:**
- Ensure secret is added in Bolt.new (not just local `.env`)
- Check secret name spelling
- Redeploy Edge Function after adding secret
- Check Supabase logs for error messages

### Frontend can't access secrets

**Problem:** `import.meta.env.VITE_SECRET_NAME` is undefined

**Solutions:**
- Secret name must start with `VITE_` for frontend access
- Restart dev server after adding to `.env`
- Check Vite config includes the variable
- Rebuild project: `npm run build`

### "Invalid API key" errors

**Problem:** API calls fail with authentication errors

**Solutions:**
- Verify key is correctly copied (no extra spaces)
- Check key hasn't expired
- Verify correct environment (test vs prod key)
- Check API provider dashboard for quota limits

### Wallet encryption errors

**Problem:** "Failed to decrypt wallet" errors

**Possible causes:**
- `WALLET_ENCRYPTION_KEY` was changed
- Key contains invalid characters
- Key is too short (<32 chars)

**Solutions:**
- **If in development:** Regenerate key, clear database, start fresh
- **If in production:** **DO NOT CHANGE KEY!** Contact dev team immediately

---

## 📊 SECRETS CHECKLIST

### Development Environment

- [ ] `VITE_SUPABASE_URL` (auto-configured)
- [ ] `VITE_SUPABASE_ANON_KEY` (auto-configured)
- [ ] `WEBHOOK_SECRET` (generated)
- [ ] `ALCHEMY_API_KEY` (from Alchemy)
- [ ] `TRONGRID_API_KEY` (from TronGrid)
- [ ] `CRON_SECRET` (generated)
- [ ] `WALLET_ENCRYPTION_KEY` (generated)
- [ ] `VITE_WALLETCONNECT_PROJECT_ID` (from WalletConnect)
- [ ] `VITE_TYT_TOKEN_MINT` (your token address)

### Production Environment

All of the above, plus:

- [ ] `SENDGRID_API_KEY` (for emails)
- [ ] Different values for security secrets (not same as dev!)
- [ ] Production API keys (not test keys)
- [ ] Secrets backed up securely
- [ ] Access restricted to 2-3 people max
- [ ] Rotation schedule documented
- [ ] Monitoring alerts configured

---

## 🎉 COMPLETION

Once all secrets are configured:

1. **Verify build:** `npm run build` (should succeed)
2. **Test locally:** `npm run dev` (all features should work)
3. **Deploy contracts:** Follow `contracts/evm/QUICKSTART.md`
4. **Test Edge Functions:** Check Supabase logs
5. **Test wallet connection:** Try connecting MetaMask
6. **Verify deposits:** Test deposit flow
7. **Check emails:** Test email sending (if configured)

---

## 📞 SUPPORT

### Documentation
- **Full deployment guide:** `contracts/evm/QUICKSTART.md`
- **Contract deployment:** `contracts/evm/DEPLOYMENT_GUIDE.md`
- **Fee system:** `FEE_SYSTEM_INTEGRATION_GUIDE.md`

### Common Resources
- **Alchemy docs:** https://docs.alchemy.com/
- **TronGrid docs:** https://developers.tron.network/
- **WalletConnect docs:** https://docs.walletconnect.com/
- **Supabase docs:** https://supabase.com/docs
- **SendGrid docs:** https://docs.sendgrid.com/

### Getting Help

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Check Supabase logs: Project → Logs → Edge Functions
3. Check browser console for frontend errors
4. Verify all secrets are correctly set
5. Ensure no typos in secret names

---

**Last Updated:** December 14, 2025
**Version:** 2.0.0

---

**TYT Ecosystem V2** - Secure configuration for Mining-to-Medicine! 🔐
