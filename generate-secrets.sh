#!/bin/bash

# ============================================
# TYT SECRETS GENERATOR
# ============================================
# Generates secure random secrets for TYT Ecosystem V2
#
# Usage: ./generate-secrets.sh
#
# This script generates:
# - WEBHOOK_SECRET (64 chars)
# - CRON_SECRET (64 chars)
# - WALLET_ENCRYPTION_KEY (64 chars)
#
# CRITICAL: Save the output securely!
# These secrets are shown ONLY ONCE.
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║              TYT SECRETS GENERATOR V2.0                    ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTICE ⚠️${NC}"
echo ""
echo "This script generates cryptographically secure random secrets."
echo "These secrets will be shown ONLY ONCE."
echo ""
echo -e "${RED}NEVER commit these to Git or share publicly!${NC}"
echo ""
echo -e "${BLUE}Save output to password manager or secure vault.${NC}"
echo ""
read -p "Press ENTER to continue..."
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ Error: openssl is not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  macOS:   brew install openssl"
    echo "  Ubuntu:  sudo apt-get install openssl"
    echo "  Windows: Install Git Bash (includes openssl)"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ OpenSSL detected${NC}"
echo ""
echo -e "${CYAN}Generating secrets...${NC}"
echo ""

# Generate secrets
WEBHOOK_SECRET=$(openssl rand -hex 32)
CRON_SECRET=$(openssl rand -hex 32)
WALLET_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Display secrets
echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                         GENERATED SECRETS                              ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${MAGENTA}┌─ WEBHOOK_SECRET${NC}"
echo -e "${MAGENTA}│${NC}"
echo -e "${MAGENTA}│${NC}  ${GREEN}$WEBHOOK_SECRET${NC}"
echo -e "${MAGENTA}│${NC}"
echo -e "${MAGENTA}│${NC}  What: Protects blockchain webhook endpoints"
echo -e "${MAGENTA}│${NC}  Used: supabase/functions/blockchain-webhook"
echo -e "${MAGENTA}│${NC}  Add to: Bolt.new → Secrets → WEBHOOK_SECRET"
echo -e "${MAGENTA}└─${NC}"
echo ""

echo -e "${BLUE}┌─ CRON_SECRET${NC}"
echo -e "${BLUE}│${NC}"
echo -e "${BLUE}│${NC}  ${GREEN}$CRON_SECRET${NC}"
echo -e "${BLUE}│${NC}"
echo -e "${BLUE}│${NC}  What: Protects cron job endpoints"
echo -e "${BLUE}│${NC}  Used: cron-daily-rewards, cron-weekly-burn, etc."
echo -e "${BLUE}│${NC}  Add to: Bolt.new → Secrets → CRON_SECRET"
echo -e "${BLUE}└─${NC}"
echo ""

echo -e "${RED}┌─ WALLET_ENCRYPTION_KEY ⚠️  ULTRA CRITICAL${NC}"
echo -e "${RED}│${NC}"
echo -e "${RED}│${NC}  ${GREEN}$WALLET_ENCRYPTION_KEY${NC}"
echo -e "${RED}│${NC}"
echo -e "${RED}│${NC}  What: Encrypts custodial wallet private keys"
echo -e "${RED}│${NC}  Used: generate-custodial-address, generate-deposit-address"
echo -e "${RED}│${NC}  Add to: Bolt.new → Secrets → WALLET_ENCRYPTION_KEY"
echo -e "${RED}│${NC}"
echo -e "${RED}│${NC}  ${YELLOW}⚠️  NEVER CHANGE THIS IN PRODUCTION!${NC}"
echo -e "${RED}│${NC}  ${YELLOW}⚠️  If lost, all user funds are PERMANENTLY INACCESSIBLE!${NC}"
echo -e "${RED}│${NC}  ${YELLOW}⚠️  BACKUP this value securely BEFORE deploying!${NC}"
echo -e "${RED}└─${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║                         NEXT STEPS                                     ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}1. Add to Bolt.new:${NC}"
echo "   - Open project in Bolt.new"
echo "   - Click ⚙️  Settings → 🔐 Secrets"
echo "   - Add each secret with EXACT name (case-sensitive)"
echo ""

echo -e "${CYAN}2. Backup securely:${NC}"
echo "   - Save to password manager (1Password, Bitwarden, etc.)"
echo "   - Create encrypted backup"
echo ""

echo -e "${GREEN}✅ Secrets generation complete!${NC}"
echo ""

exit 0
