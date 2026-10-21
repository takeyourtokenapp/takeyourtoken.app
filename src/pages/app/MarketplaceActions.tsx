import { useState } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createListing, purchaseMiner, cancelListing } from '../../utils/marketplace';
import { emailNotifications } from '../../utils/emailService';
import type { MarketplaceListing, NFTMiner } from '../../types/database';

type ListingWithMiner = MarketplaceListing & {
  nft_miners: NFTMiner;
};

interface BuyModalProps {
  listing: ListingWithMiner;
  onClose: () => void;
  onSuccess: () => void;
}

export function BuyModal({ listing, onClose, onSuccess }: BuyModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await purchaseMiner(listing.id, user.id);

      if (!result.success) {
        setError(result.error || 'Purchase failed');
        return;
      }

      setSuccess(true);

      if (user.email) {
        await emailNotifications.depositConfirmed(user.email, {
          amount: listing.list_price_amount,
          asset: listing.list_price_asset,
          network: 'TYT Marketplace',
          newBalance: '0',
        });
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError('Transaction failed. Please try again.');
      console.error('Purchase error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl border border-green-500/50 max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Purchase Successful!</h3>
          <p className="text-gray-400 mb-6">
            The miner has been transferred to your account
          </p>
          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-all"
          >
            View My Miners
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Confirm Purchase</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Miner</span>
              <span className="font-semibold">{listing.nft_miners.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Hashrate</span>
              <span className="font-semibold">{listing.nft_miners.hashrate_th} TH/s</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Efficiency</span>
              <span className="font-semibold">{listing.nft_miners.efficiency_w_th} W/TH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Region</span>
              <span className="font-semibold">{listing.nft_miners.region}</span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
            <div className="flex justify-between text-lg font-bold mb-2">
              <span>Total Price</span>
              <span className="text-amber-400">
                {listing.list_price_amount} {listing.list_price_asset}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Marketplace fee (2.5%)</span>
                <span>{(parseFloat(listing.list_price_amount) * 0.025).toFixed(4)} {listing.list_price_asset}</span>
              </div>
              <div className="flex justify-between">
                <span>Foundation donation (1%)</span>
                <span>{(parseFloat(listing.list_price_amount) * 0.01).toFixed(4)} {listing.list_price_asset}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <div className="text-sm text-gray-300">
              This purchase will be processed immediately. The NFT miner will be transferred to your account and start earning rewards.
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Purchase'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SellModalProps {
  miner: NFTMiner;
  onClose: () => void;
  onSuccess: () => void;
}

export function SellModal({ miner, onClose, onSuccess }: SellModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [sellPrice, setSellPrice] = useState('');
  const [sellAsset, setSellAsset] = useState<'TYT' | 'USDT' | 'BTC'>('USDT');

  const handleCreateListing = async () => {
    if (!user || !sellPrice) {
      setError('Please enter a price');
      return;
    }

    const price = parseFloat(sellPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createListing(
        miner.id,
        user.id,
        sellPrice,
        sellAsset,
        'fixed_price'
      );

      if (!result.success) {
        setError(result.error || 'Failed to create listing');
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to create listing. Please try again.');
      console.error('Create listing error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl border border-green-500/50 max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Listed Successfully!</h3>
          <p className="text-gray-400 mb-6">
            Your miner is now available on the marketplace
          </p>
          <button
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-all"
          >
            View Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">List Miner for Sale</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Miner</span>
              <span className="font-semibold">{miner.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Hashrate</span>
              <span className="font-semibold">{miner.hashrate_th} TH/s</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Efficiency</span>
              <span className="font-semibold">{miner.efficiency_w_th} W/TH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span className="font-semibold capitalize">{miner.status}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sale Price
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="Enter price"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
              <select
                value={sellAsset}
                onChange={(e) => setSellAsset(e.target.value as any)}
                className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="USDT">USDT</option>
                <option value="TYT">TYT</option>
                <option value="BTC">BTC</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
            <div className="text-sm font-semibold mb-2">Marketplace Fees:</div>
            <div className="text-sm text-gray-300">
              <div className="flex justify-between mb-1">
                <span>Marketplace fee (2.5%)</span>
                <span>{sellPrice ? (parseFloat(sellPrice) * 0.025).toFixed(2) : '0.00'} {sellAsset}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Foundation donation (1%)</span>
                <span>{sellPrice ? (parseFloat(sellPrice) * 0.01).toFixed(2) : '0.00'} {sellAsset}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-400 pt-2 border-t border-gray-700">
                <span>You receive</span>
                <span>{sellPrice ? (parseFloat(sellPrice) * 0.965).toFixed(2) : '0.00'} {sellAsset}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <div className="text-sm text-gray-300">
              Once listed, your miner will be visible to all marketplace users. You can cancel the listing at any time.
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateListing}
            disabled={loading || !sellPrice}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Creating...
              </>
            ) : (
              'List for Sale'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CancelListingModalProps {
  listing: ListingWithMiner;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelListingModal({ listing, onClose, onSuccess }: CancelListingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await cancelListing(listing.id, user.id);

      if (!result.success) {
        setError(result.error || 'Failed to cancel listing');
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to cancel listing. Please try again.');
      console.error('Cancel listing error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Cancel Listing</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Are you sure you want to cancel this listing? The miner will be removed from the marketplace and returned to your inventory.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 transition-all"
          >
            Keep Listing
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Listing'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
