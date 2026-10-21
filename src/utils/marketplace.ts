import { supabase } from '../lib/supabase';
import { syncUserVIPTier } from './vip';
import type { MarketplaceListing, NFTMiner } from '../types/database';

export interface PurchaseResult {
  success: boolean;
  error?: string;
  minerId?: string;
  transactionId?: string;
}

const MARKETPLACE_BASE_FEE = 0.025;
const FOUNDATION_ALLOCATION = 0.01;

export async function purchaseMiner(
  listingId: string,
  buyerId: string
): Promise<PurchaseResult> {
  try {
    const { data: listing, error: listingError } = await supabase
      .from('marketplace_listings')
      .select(`
        *,
        nft_miners (*)
      `)
      .eq('id', listingId)
      .eq('status', 'active')
      .maybeSingle();

    if (listingError || !listing) {
      return { success: false, error: 'Listing not found or no longer available' };
    }

    if (listing.seller_id === buyerId) {
      return { success: false, error: 'Cannot purchase your own listing' };
    }

    const { data: buyerWallet, error: walletError } = await supabase
      .from('custodial_wallets')
      .select('balance')
      .eq('user_id', buyerId)
      .eq('asset', listing.list_price_asset)
      .maybeSingle();

    if (walletError || !buyerWallet) {
      return { success: false, error: 'Wallet not found' };
    }

    const purchaseAmount = parseFloat(listing.list_price_amount);
    const buyerBalance = parseFloat(buyerWallet.balance);

    if (buyerBalance < purchaseAmount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const vipLevel = await syncUserVIPTier(buyerId);
    const feeDiscount = vipLevel.marketplaceFeeDiscount / 100;
    const effectiveFee = MARKETPLACE_BASE_FEE * (1 - feeDiscount);

    const marketplaceFee = purchaseAmount * effectiveFee;
    const foundationAmount = purchaseAmount * FOUNDATION_ALLOCATION;
    const sellerAmount = purchaseAmount - marketplaceFee - foundationAmount;

    await supabase.rpc('process_marketplace_purchase', {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
      p_seller_id: listing.seller_id,
      p_miner_id: listing.miner_id,
      p_purchase_amount: purchaseAmount,
      p_asset: listing.list_price_asset,
      p_marketplace_fee: marketplaceFee,
      p_seller_amount: sellerAmount
    });

    await supabase
      .from('marketplace_listings')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        final_sale_price: listing.list_price_amount
      })
      .eq('id', listingId);

    await supabase
      .from('nft_miners')
      .update({
        owner_id: buyerId,
        acquired_at: new Date().toISOString()
      })
      .eq('id', listing.miner_id);

    await supabase
      .from('custodial_wallets')
      .update({
        balance: (buyerBalance - purchaseAmount).toString()
      })
      .eq('user_id', buyerId)
      .eq('asset', listing.list_price_asset);

    const { data: sellerWallet } = await supabase
      .from('custodial_wallets')
      .select('balance')
      .eq('user_id', listing.seller_id)
      .eq('asset', listing.list_price_asset)
      .maybeSingle();

    if (sellerWallet) {
      await supabase
        .from('custodial_wallets')
        .update({
          balance: (parseFloat(sellerWallet.balance) + sellerAmount).toString()
        })
        .eq('user_id', listing.seller_id)
        .eq('asset', listing.list_price_asset);
    }

    await recordFoundationDonation(foundationAmount, listing.list_price_asset, buyerId);

    return {
      success: true,
      minerId: listing.miner_id,
      transactionId: listingId
    };

  } catch (error) {
    console.error('Purchase error:', error);
    return { success: false, error: 'Transaction failed' };
  }
}

export async function createListing(
  minerId: string,
  sellerId: string,
  priceAmount: string,
  priceAsset: 'TYT' | 'USDT' | 'BTC',
  listingType: 'fixed_price' | 'auction' = 'fixed_price'
): Promise<{ success: boolean; error?: string; listingId?: string }> {
  try {
    const { data: miner } = await supabase
      .from('nft_miners')
      .select('*')
      .eq('id', minerId)
      .eq('owner_id', sellerId)
      .maybeSingle();

    if (!miner) {
      return { success: false, error: 'Miner not found or not owned by you' };
    }

    if (miner.status !== 'active') {
      return { success: false, error: 'Only active miners can be listed' };
    }

    const { data: existingListing } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('miner_id', minerId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingListing) {
      return { success: false, error: 'Miner is already listed' };
    }

    const { data: listing, error: insertError } = await supabase
      .from('marketplace_listings')
      .insert({
        miner_id: minerId,
        seller_id: sellerId,
        listing_type: listingType,
        list_price_amount: priceAmount,
        list_price_asset: priceAsset,
        status: 'active'
      })
      .select()
      .single();

    if (insertError || !listing) {
      return { success: false, error: insertError?.message || 'Failed to create listing' };
    }

    await supabase
      .from('nft_miners')
      .update({ status: 'listed' })
      .eq('id', minerId);

    return { success: true, listingId: listing.id };

  } catch (error) {
    console.error('Create listing error:', error);
    return { success: false, error: 'Failed to create listing' };
  }
}

export async function cancelListing(
  listingId: string,
  sellerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', listingId)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .maybeSingle();

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    await supabase
      .from('marketplace_listings')
      .update({ status: 'cancelled' })
      .eq('id', listingId);

    await supabase
      .from('nft_miners')
      .update({ status: 'active' })
      .eq('id', listing.miner_id);

    return { success: true };

  } catch (error) {
    console.error('Cancel listing error:', error);
    return { success: false, error: 'Failed to cancel listing' };
  }
}

async function recordFoundationDonation(
  amount: number,
  asset: string,
  donorId: string
): Promise<void> {
  const prices: Record<string, number> = {
    TYT: 0.05,
    USDT: 1,
    BTC: 95000
  };

  const amountUsd = amount * (prices[asset] || 1);

  await supabase
    .from('foundation_donations')
    .insert({
      user_id: donorId,
      amount_crypto: amount.toString(),
      crypto_asset: asset,
      amount_usd: amountUsd.toString(),
      donation_source: 'marketplace_fee',
      is_automatic: true
    });
}

export async function getMarketplaceStats(): Promise<{
  totalListings: number;
  totalSales: number;
  totalVolume: number;
  avgPrice: number;
}> {
  const { data: activeListings } = await supabase
    .from('marketplace_listings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { data: soldListings, count: salesCount } = await supabase
    .from('marketplace_listings')
    .select('final_sale_price', { count: 'exact' })
    .eq('status', 'sold');

  const totalVolume = soldListings?.reduce(
    (sum, listing) => sum + parseFloat(listing.final_sale_price || '0'),
    0
  ) || 0;

  const avgPrice = salesCount && salesCount > 0 ? totalVolume / salesCount : 0;

  return {
    totalListings: activeListings?.length || 0,
    totalSales: salesCount || 0,
    totalVolume,
    avgPrice
  };
}
