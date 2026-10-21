#!/bin/bash

# ============================================
# TYT V2 CONTRACT VERIFICATION SCRIPT
# ============================================
# Verify deployed contracts on PolygonScan
# Run: ./verify-contracts.sh [network]
# Example: ./verify-contracts.sh amoy

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Load .env
if [ ! -f .env ]; then
    print_error ".env file not found!"
    exit 1
fi
source .env

# Get network
NETWORK=${1:-amoy}

if [ "$NETWORK" = "amoy" ]; then
    CHAIN_ID=80002
    EXPLORER="https://amoy.polygonscan.com"
elif [ "$NETWORK" = "polygon" ]; then
    CHAIN_ID=137
    EXPLORER="https://polygonscan.com"
else
    print_error "Unknown network: $NETWORK"
    exit 1
fi

# Check for deployment file
DEPLOYMENT_FILE="deployments/${NETWORK}.json"
if [ ! -f "$DEPLOYMENT_FILE" ]; then
    print_error "Deployment file not found: $DEPLOYMENT_FILE"
    print_info "Deploy contracts first: ./deploy.sh $NETWORK"
    exit 1
fi

# Check API key
if [ -z "$POLYGONSCAN_API_KEY" ]; then
    print_error "POLYGONSCAN_API_KEY not set in .env"
    exit 1
fi

print_header "VERIFYING TYT V2 CONTRACTS"
print_info "Network: $NETWORK (Chain ID: $CHAIN_ID)"
print_info "Reading addresses from: $DEPLOYMENT_FILE"
echo ""

# Extract addresses
FEE_CONFIG=$(cat $DEPLOYMENT_FILE | jq -r '.feeConfig')
CHARITY_VAULT=$(cat $DEPLOYMENT_FILE | jq -r '.charityVault')
ACADEMY_VAULT=$(cat $DEPLOYMENT_FILE | jq -r '.academyVault')
MINER_NFT=$(cat $DEPLOYMENT_FILE | jq -r '.minerNFT')
MARKETPLACE=$(cat $DEPLOYMENT_FILE | jq -r '.marketplace')
REWARDS_MERKLE=$(cat $DEPLOYMENT_FILE | jq -r '.rewardsMerkle')

print_info "Contract Addresses:"
echo "  FeeConfig:     $FEE_CONFIG"
echo "  CharityVault:  $CHARITY_VAULT"
echo "  AcademyVault:  $ACADEMY_VAULT"
echo "  MinerNFT:      $MINER_NFT"
echo "  Marketplace:   $MARKETPLACE"
echo "  RewardsMerkle: $REWARDS_MERKLE"
echo ""

# Function to verify contract
verify_contract() {
    local NAME=$1
    local ADDRESS=$2
    local CONTRACT=$3
    local CONSTRUCTOR_ARGS=$4

    print_info "Verifying $NAME..."

    if [ -z "$CONSTRUCTOR_ARGS" ]; then
        forge verify-contract \
            $ADDRESS \
            $CONTRACT \
            --chain-id $CHAIN_ID \
            --etherscan-api-key $POLYGONSCAN_API_KEY
    else
        forge verify-contract \
            $ADDRESS \
            $CONTRACT \
            --chain-id $CHAIN_ID \
            --etherscan-api-key $POLYGONSCAN_API_KEY \
            --constructor-args $CONSTRUCTOR_ARGS
    fi

    if [ $? -eq 0 ]; then
        print_success "$NAME verified!"
        echo "  View: $EXPLORER/address/$ADDRESS#code"
    else
        print_error "$NAME verification failed"
    fi

    echo ""
    sleep 2  # Rate limit protection
}

# Verify FeeConfigGovernance
print_header "1. VERIFYING FEE CONFIG GOVERNANCE"
FEE_CONFIG_ARGS=$(cast abi-encode "constructor(address,address,address,uint256)" \
    $PROTOCOL_TREASURY \
    $CHARITY_VAULT \
    $ACADEMY_VAULT \
    $TIMELOCK_DURATION)
verify_contract \
    "FeeConfigGovernance" \
    $FEE_CONFIG \
    "src/FeeConfigGovernance.sol:FeeConfigGovernance" \
    $FEE_CONFIG_ARGS

# Verify CharityVault
print_header "2. VERIFYING CHARITY VAULT"
CHARITY_ARGS=$(cast abi-encode "constructor(address)" $FEE_CONFIG)
verify_contract \
    "CharityVault" \
    $CHARITY_VAULT \
    "src/CharityVault.sol:CharityVault" \
    $CHARITY_ARGS

# Verify AcademyVault
print_header "3. VERIFYING ACADEMY VAULT"
ACADEMY_ARGS=$(cast abi-encode "constructor(address)" $FEE_CONFIG)
verify_contract \
    "AcademyVault" \
    $ACADEMY_VAULT \
    "src/AcademyVault.sol:AcademyVault" \
    $ACADEMY_ARGS

# Verify MinerNFT
print_header "4. VERIFYING MINER NFT"
MINER_ARGS=$(cast abi-encode "constructor(address)" $FEE_CONFIG)
verify_contract \
    "MinerNFT" \
    $MINER_NFT \
    "src/MinerNFT.sol:MinerNFT" \
    $MINER_ARGS

# Verify MinerMarketplace
print_header "5. VERIFYING MINER MARKETPLACE"
MARKETPLACE_ARGS=$(cast abi-encode "constructor(address,address)" $MINER_NFT $FEE_CONFIG)
verify_contract \
    "MinerMarketplace" \
    $MARKETPLACE \
    "src/MinerMarketplace.sol:MinerMarketplace" \
    $MARKETPLACE_ARGS

# Verify RewardsMerkleRegistry
print_header "6. VERIFYING REWARDS MERKLE REGISTRY"
MERKLE_ARGS=$(cast abi-encode "constructor(address)" $MINER_NFT)
verify_contract \
    "RewardsMerkleRegistry" \
    $REWARDS_MERKLE \
    "src/RewardsMerkleRegistry.sol:RewardsMerkleRegistry" \
    $MERKLE_ARGS

# Summary
print_header "VERIFICATION COMPLETE"
print_success "All contracts verified on $NETWORK!"
echo ""
print_info "View contracts on PolygonScan:"
echo "  $EXPLORER/address/$FEE_CONFIG"
echo "  $EXPLORER/address/$MINER_NFT"
echo "  $EXPLORER/address/$MARKETPLACE"
echo ""
print_info "You can now interact with verified contracts through PolygonScan UI"
