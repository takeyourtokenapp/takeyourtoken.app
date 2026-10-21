import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShoppingCart,
  TrendingUp,
  Filter,
  Search,
  Cpu,
  Zap,
  DollarSign,
  Tag,
  Star,
  Activity,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Layers,
  BarChart3
} from 'lucide-react';
import type { MarketplaceListing, NFTMiner } from '../../types/database';
import { BuyModal, SellModal } from './MarketplaceActions';

type ListingWithMiner = MarketplaceListing & {
  nft_miners: NFTMiner;
};

type ViewMode = 'browse' | 'my-listings';
type ModalType = 'buy' | 'sell' | 'detail' | null;

export default function Marketplace() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithMiner[]>([]);
  const [myMiners, setMyMiners] = useState<NFTMiner[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedListing, setSelectedListing] = useState<ListingWithMiner | null>(null);
  const [selectedMinerToSell, setSelectedMinerToSell] = useState<NFTMiner | null>(null);

  const [sortBy, setSortBy] = useState<'price_low' | 'price_high' | 'hashrate' | 'efficiency'>('price_low');
  const [filterAsset, setFilterAsset] = useState<'all' | 'TYT' | 'USDT' | 'BTC'>('all');
  const [filterRarity, setFilterRarity] = useState<'all' | 'common' | 'rare' | 'epic' | 'legendary'>('all');
  const [filterTier, setFilterTier] = useState<'all' | 'T1' | 'T2' | 'T3' | 'T4'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [sellPrice, setSellPrice] = useState('');
  const [sellAsset, setSellAsset] = useState<'TYT' | 'USDT' | 'BTC'>('USDT');

  useEffect(() => {
    if (user) {
      loadMarketplaceData();
    }
  }, [user, viewMode]);

  const loadMarketplaceData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      if (viewMode === 'browse') {
        const { data, error } = await supabase
          .from('marketplace_listings')
          .select(`
            *,
            nft_miners (*)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setListings(data as ListingWithMiner[]);
      } else {
        const { data: myListingsData } = await supabase
          .from('marketplace_listings')
          .select(`
            *,
            nft_miners (*)
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (myListingsData) setListings(myListingsData as ListingWithMiner[]);

        const { data: minersData } = await supabase
          .from('nft_miners')
          .select('*')
          .eq('owner_id', user.id)
          .eq('is_listed_for_sale', false)
          .order('created_at', { ascending: false });

        if (minersData) setMyMiners(minersData);
      }
    } catch (error) {
      console.error('Error loading marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings
    .filter(listing => {
      if (filterAsset !== 'all' && listing.list_price_asset !== filterAsset) return false;
      if (filterRarity !== 'all' && listing.nft_miners.rarity !== filterRarity) return false;
      if (filterTier !== 'all' && listing.nft_miners.tier !== filterTier) return false;
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          listing.id.toLowerCase().includes(search) ||
          listing.nft_miners.miner_model.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return parseFloat(a.list_price_amount) - parseFloat(b.list_price_amount);
        case 'price_high':
          return parseFloat(b.list_price_amount) - parseFloat(a.list_price_amount);
        case 'hashrate':
          return b.nft_miners.hashrate_th - a.nft_miners.hashrate_th;
        case 'efficiency':
          return a.nft_miners.efficiency_w_per_th - b.nft_miners.efficiency_w_per_th;
        default:
          return 0;
      }
    });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'epic': return 'text-purple-400 bg-purple-400/20 border-purple-400/50';
      case 'rare': return 'text-blue-400 bg-blue-400/20 border-blue-400/50';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const handleBuyClick = (listing: ListingWithMiner) => {
    setSelectedListing(listing);
    setActiveModal('buy');
  };

  const handleSellClick = (miner: NFTMiner) => {
    setSelectedMinerToSell(miner);
    setActiveModal('sell');
  };

  const handleDetailClick = (listing: ListingWithMiner) => {
    setSelectedListing(listing);
    setActiveModal('detail');
  };

  const totalVolume24h = 12500;
  const avgPrice = listings.length > 0
    ? listings.reduce((sum, l) => sum + parseFloat(l.list_price_amount), 0) / listings.length
    : 0;
  const totalHashrate = listings.reduce((sum, l) => sum + l.nft_miners.hashrate_th, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading marketplace...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">NFT Marketplace</h1>
          <p className="text-gray-400">Buy and sell Bitcoin mining NFTs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('browse')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'browse'
                ? 'bg-amber-500 text-black'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setViewMode('my-listings')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'my-listings'
                ? 'bg-amber-500 text-black'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            My Listings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Active Listings</div>
            <ShoppingCart className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{listings.length}</div>
          <div className="text-xs text-gray-500 mt-2">Available now</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Avg Price</div>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">
            ${avgPrice.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-2">USDT equiv.</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">Total Hashrate</div>
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">
            {totalHashrate.toFixed(0)}
          </div>
          <div className="text-xs text-gray-500 mt-2">TH/s available</div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-400 text-sm">24h Volume</div>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">${(totalVolume24h / 1000).toFixed(1)}K</div>
          <div className="text-xs text-green-400 mt-2">+15.3%</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or model..."
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="hashrate">Hashrate: High to Low</option>
              <option value="efficiency">Efficiency: Best First</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Assets</option>
              <option value="TYT">TYT</option>
              <option value="USDT">USDT</option>
              <option value="BTC">BTC</option>
            </select>

            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value as any)}
              className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Tiers</option>
              <option value="T1">Tier 1</option>
              <option value="T2">Tier 2</option>
              <option value="T3">Tier 3</option>
              <option value="T4">Tier 4</option>
            </select>

            {(searchQuery || filterAsset !== 'all' || filterRarity !== 'all' || filterTier !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterAsset('all');
                  setFilterRarity('all');
                  setFilterTier('all');
                }}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {viewMode === 'my-listings' && myMiners.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-400" />
            List Your Miners for Sale
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myMiners.slice(0, 3).map((miner) => (
              <div
                key={miner.id}
                className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-amber-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">#{miner.id.slice(0, 8)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(miner.rarity)}`}>
                    {miner.rarity}
                  </span>
                </div>
                <div className="text-sm mb-3">
                  <div className="font-semibold">{miner.hashrate_th} TH/s</div>
                  <div className="text-gray-400">{miner.miner_model}</div>
                </div>
                <button
                  onClick={() => handleSellClick(miner)}
                  className="w-full px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold hover:bg-amber-500/30 transition-all"
                >
                  List for Sale
                </button>
              </div>
            ))}
          </div>
          {myMiners.length > 3 && (
            <div className="text-center mt-4 text-sm text-gray-400">
              +{myMiners.length - 3} more miners available
            </div>
          )}
        </div>
      )}

      {filteredListings.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Listings Found</h3>
          <p className="text-gray-400">
            {searchQuery || filterAsset !== 'all' || filterRarity !== 'all' || filterTier !== 'all'
              ? 'Try adjusting your filters'
              : viewMode === 'my-listings'
              ? 'You have no active listings'
              : 'No listings available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <div
              key={listing.id}
              className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:border-amber-500/50 transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRarityColor(listing.nft_miners.rarity)}`}>
                      {listing.nft_miners.rarity}
                    </span>
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs font-semibold">
                      {listing.nft_miners.tier}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDetailClick(listing)}
                    className="text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <BarChart3 size={18} />
                  </button>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-1">{listing.nft_miners.miner_model}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    #{listing.nft_miners.id.slice(0, 16)}...
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Cpu size={14} />
                      Hashrate
                    </div>
                    <div className="text-lg font-bold text-amber-400">
                      {listing.nft_miners.hashrate_th}
                    </div>
                    <div className="text-xs text-gray-500">TH/s</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                      <Zap size={14} />
                      Efficiency
                    </div>
                    <div className="text-lg font-bold text-green-400">
                      {listing.nft_miners.efficiency_w_per_th}
                    </div>
                    <div className="text-xs text-gray-500">W/TH</div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-4 mb-4 border border-amber-500/50">
                  <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                    <Tag size={14} />
                    {listing.listing_type === 'fixed_price' ? 'Fixed Price' : 'Auction'}
                  </div>
                  <div className="text-2xl font-bold text-amber-400">
                    {parseFloat(listing.list_price_amount).toLocaleString()} {listing.list_price_asset}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    ≈ $
                    {listing.list_price_asset === 'USDT'
                      ? parseFloat(listing.list_price_amount).toFixed(2)
                      : listing.list_price_asset === 'BTC'
                      ? (parseFloat(listing.list_price_amount) * 95000).toFixed(2)
                      : (parseFloat(listing.list_price_amount) * 0.05).toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDetailClick(listing)}
                    className="flex-1 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => handleBuyClick(listing)}
                    disabled={listing.seller_id === user?.id}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    {listing.seller_id === user?.id ? 'Your Listing' : 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5 text-amber-400" />
          Marketplace Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-gray-400 text-sm mb-1">Standard Fee</div>
            <div className="font-semibold text-lg">2.5%</div>
            <div className="text-xs text-gray-500">Per transaction</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">VIP Discount</div>
            <div className="font-semibold text-lg text-amber-400">Up to 50% off</div>
            <div className="text-xs text-gray-500">For VIP members</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Payment Options</div>
            <div className="font-semibold text-lg">TYT, USDT, BTC</div>
            <div className="text-xs text-gray-500">Multiple currencies</div>
          </div>
        </div>
      </div>

      {activeModal === 'buy' && selectedListing && (
        <BuyModal
          listing={selectedListing}
          onClose={() => setActiveModal(null)}
          onSuccess={loadMarketplaceData}
        />
      )}

      {activeModal === 'sell' && selectedMinerToSell && (
        <SellModal
          miner={selectedMinerToSell}
          onClose={() => setActiveModal(null)}
          onSuccess={loadMarketplaceData}
        />
      )}

      {activeModal === 'detail' && selectedListing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">Miner Details</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/50">
                  <Cpu className="w-8 h-8 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-xl mb-1">{selectedListing.nft_miners.miner_model}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(selectedListing.nft_miners.rarity)}`}>
                      {selectedListing.nft_miners.rarity}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded">{selectedListing.nft_miners.tier}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Cpu size={16} />
                    Hashrate
                  </div>
                  <div className="text-2xl font-bold text-amber-400">{selectedListing.nft_miners.hashrate_th}</div>
                  <div className="text-sm text-gray-500">TH/s</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Zap size={16} />
                    Efficiency
                  </div>
                  <div className="text-2xl font-bold text-green-400">{selectedListing.nft_miners.efficiency_w_per_th}</div>
                  <div className="text-sm text-gray-500">W/TH</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Activity size={16} />
                    Daily Output
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {(selectedListing.nft_miners.hashrate_th * 0.00000156).toFixed(6)}
                  </div>
                  <div className="text-sm text-gray-500">BTC/day</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Clock size={16} />
                    Created
                  </div>
                  <div className="text-lg font-bold text-white">
                    {new Date(selectedListing.nft_miners.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">Mint date</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg p-6 border border-amber-500/50">
                <div className="text-sm text-gray-300 mb-2">Listing Price</div>
                <div className="text-4xl font-bold text-amber-400 mb-2">
                  {parseFloat(selectedListing.list_price_amount).toLocaleString()} {selectedListing.list_price_asset}
                </div>
                <div className="text-sm text-gray-400">
                  ≈ $
                  {selectedListing.list_price_asset === 'USDT'
                    ? parseFloat(selectedListing.list_price_amount).toFixed(2)
                    : selectedListing.list_price_asset === 'BTC'
                    ? (parseFloat(selectedListing.list_price_amount) * 95000).toFixed(2)
                    : (parseFloat(selectedListing.list_price_amount) * 0.05).toFixed(2)}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">NFT Token ID</div>
                <div className="font-mono text-xs text-gray-300 break-all">
                  {selectedListing.nft_miners.id}
                </div>
              </div>

              {selectedListing.seller_id !== user?.id && (
                <button
                  onClick={() => {
                    setActiveModal('buy');
                  }}
                  className="w-full px-4 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold text-lg hover:shadow-lg hover:shadow-amber-500/50 transition-all"
                >
                  Buy Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
