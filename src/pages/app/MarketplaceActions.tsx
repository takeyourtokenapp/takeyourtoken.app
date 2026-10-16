import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Gavel, Tag, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, MessageSquare, Package } from 'lucide-react';

interface Listing {
  id: string;
  miner_id: string;
  seller_id: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  miner?: { name: string; hashrate: string; efficiency: string } | null;
}

interface Offer {
  id: string;
  listing_id: string;
  buyer_id: string;
  offer_amount: number;
  offer_currency: string;
  message: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  listing?: { miner?: { name: string } | null } | null;
}

interface Sale {
  id: string;
  listing_id: string;
  miner_id: string;
  sale_amount: number;
  sale_currency: string;
  platform_fee_amount: number;
  seller_net_amount: number;
  completed_at: string;
  blockchain_tx_hash: string | null;
  miner?: { name: string } | null;
}

export default function MarketplaceActions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'offers' | 'sales'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [listingsRes, offersRes, salesRes] = await Promise.all([
        supabase.from('marketplace_listings').select(`
          *,
          miner:nft_miners(name, hashrate, efficiency)
        `).eq('seller_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('marketplace_offers').select(`
          *,
          listing:marketplace_listings(
            miner:nft_miners(name)
          )
        `).eq('buyer_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('marketplace_sales').select(`
          *,
          miner:nft_miners(name)
        `).or(`seller_id.eq.${user?.id},buyer_id.eq.${user?.id}`).order('completed_at', { ascending: false }).limit(50)
      ]);

      if (listingsRes.error) throw listingsRes.error;
      setListings(listingsRes.data || []);
      setOffers(offersRes.data || []);
      setSales(salesRes.data || []);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelListing(listingId: string) {
    setActionLoading(listingId);
    try {
      const { error } = await supabase.from('marketplace_listings').update({ status: 'cancelled' }).eq('id', listingId);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Failed to cancel listing:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleOfferResponse(offerId: string, accept: boolean) {
    setActionLoading(offerId);
    try {
      const { error } = await supabase.from('marketplace_offers')
        .update({ status: accept ? 'accepted' : 'rejected', responded_at: new Date().toISOString() })
        .eq('id', offerId);
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Failed to respond to offer:', error);
    } finally {
      setActionLoading(null);
    }
  }

  const activeListings = listings.filter(l => l.status === 'active');
  const pendingOffers = offers.filter(o => o.status === 'pending');
  const totalSales = sales.reduce((s, sale) => s + parseFloat(String(sale.seller_net_amount)), 0);
  const totalFees = sales.reduce((s, sale) => s + parseFloat(String(sale.platform_fee_amount)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Gavel className="w-8 h-8 text-gold-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketplace Actions</h1>
        <p className="text-tertiary-text">Manage your listings, offers, and track your sales history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Active Listings</span>
            <Tag className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{activeListings.length}</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Pending Offers</span>
            <Gavel className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-400">{pendingOffers.length}</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Total Sales</span>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{totalSales.toLocaleString()}</div>
          <div className="text-xs text-tertiary-text mt-1">TYT net earnings</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Platform Fees Paid</span>
            <TrendingUp className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-pink-400">{totalFees.toLocaleString()}</div>
          <div className="text-xs text-tertiary-text mt-1">TYT in fees</div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['listings', 'offers', 'sales'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all capitalize ${
              activeTab === tab ? 'bg-gold-500 text-navy-900' : 'bg-tertiary text-tertiary-text hover:bg-secondary'
            }`}
          >
            {tab === 'listings' ? `My Listings (${activeListings.length})` : tab === 'offers' ? `My Offers (${pendingOffers.length})` : `Sales History (${sales.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
              <Tag className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Listings Yet</h3>
              <p className="text-tertiary-text">List your NFT miners on the marketplace to start earning TYT</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listings.map(listing => (
                <div key={listing.id} className="bg-secondary rounded-xl p-5 border border-secondary hover:border-gold-500/30 transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-amber-500/20 border border-gold-500/50 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gold-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{listing.miner?.name || 'Unknown Miner'}</div>
                        <div className="text-sm text-tertiary-text">
                          {listing.miner ? `${parseFloat(String(listing.miner.hashrate))} TH/s` : ''} - Listed {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold text-gold-400">{parseFloat(String(listing.price)).toLocaleString()}</div>
                      <div className="text-xs text-tertiary-text">{listing.currency || 'TYT'}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-3 py-1 rounded text-xs font-semibold capitalize ${
                        listing.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        listing.status === 'sold' ? 'bg-blue-500/20 text-blue-400' :
                        listing.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-tertiary text-tertiary-text'
                      }`}>
                        {listing.status}
                      </span>
                      {listing.status === 'active' && (
                        <button
                          onClick={() => handleCancelListing(listing.id)}
                          disabled={actionLoading === listing.id}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {actionLoading === listing.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div>
          {offers.length === 0 ? (
            <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
              <Gavel className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Offers Made</h3>
              <p className="text-tertiary-text">Browse the marketplace and make offers on miners you're interested in</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offers.map(offer => {
                const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();
                return (
                  <div key={offer.id} className="bg-secondary rounded-xl p-5 border border-secondary">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="font-semibold">{offer.listing?.miner?.name || 'Marketplace Miner'}</div>
                        <div className="text-sm text-tertiary-text">Offer made {new Date(offer.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gold-400">{parseFloat(String(offer.offer_amount)).toLocaleString()}</div>
                        <div className="text-xs text-tertiary-text">{offer.offer_currency || 'TYT'}</div>
                      </div>
                    </div>

                    {offer.message && (
                      <div className="bg-tertiary rounded-lg p-3 mb-3 flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-tertiary-text flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-secondary-text">{offer.message}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {offer.status === 'pending' && !isExpired && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Clock size={12} /> Pending response
                          </span>
                        )}
                        {offer.status === 'accepted' && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle size={12} /> Accepted
                          </span>
                        )}
                        {offer.status === 'rejected' && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                        {isExpired && offer.status === 'pending' && (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <Clock size={12} /> Expired
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sales' && (
        <div>
          {sales.length === 0 ? (
            <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
              <DollarSign className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Sales Yet</h3>
              <p className="text-tertiary-text">Your completed marketplace transactions will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Miner</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Sale Amount</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Platform Fee</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Net Received</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">TX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-tertiary transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold">{sale.miner?.name || 'Miner'}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-gold-400">{parseFloat(String(sale.sale_amount)).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right text-pink-400">{parseFloat(String(sale.platform_fee_amount)).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-green-400">{parseFloat(String(sale.seller_net_amount)).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm">{new Date(sale.completed_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm font-mono text-tertiary-text truncate max-w-[150px]">
                        {sale.blockchain_tx_hash ? `${sale.blockchain_tx_hash.slice(0, 14)}...` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
