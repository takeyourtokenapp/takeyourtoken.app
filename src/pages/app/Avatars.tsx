import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Smile, Sparkles, TrendingUp, Shield, Star, Check, Lock, Heart, Zap } from 'lucide-react';

interface Avatar {
  id: string;
  token_id: string;
  owner_id: string;
  name: string;
  rarity: string;
  image_url: string | null;
  boost_type: string | null;
  boost_value: number;
  is_equipped: boolean;
  is_tradeable: boolean;
  acquired_at: string;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'from-gray-500 to-gray-600 border-gray-400',
  uncommon: 'from-green-500 to-emerald-500 border-green-400',
  rare: 'from-blue-500 to-cyan-500 border-blue-400',
  epic: 'from-purple-500 to-pink-500 border-purple-400',
  legendary: 'from-gold-400 to-amber-500 border-gold-400'
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

const BOOST_ICONS: Record<string, typeof Zap> = {
  hashrate: Zap,
  efficiency: TrendingUp,
  reward_bonus: Star,
  charity_boost: Heart
};

export default function Avatars() {
  const { user } = useAuth();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [equipping, setEquipping] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'equipped' | 'tradeable'>('all');

  useEffect(() => {
    if (user) loadAvatars();
  }, [user]);

  async function loadAvatars() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('owner_id', user?.id)
        .order('acquired_at', { ascending: false });

      if (error) throw error;
      setAvatars(data || []);
    } catch (error) {
      console.error('Error loading avatars:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleEquip(avatarId: string) {
    if (!user) return;
    setEquipping(avatarId);
    try {
      await supabase.from('avatars').update({ is_equipped: false }).eq('owner_id', user.id);
      const { error } = await supabase.from('avatars').update({ is_equipped: true }).eq('id', avatarId);
      if (error) throw error;
      loadAvatars();
    } catch (error) {
      console.error('Failed to equip avatar:', error);
    } finally {
      setEquipping(null);
    }
  }

  const equipped = avatars.find(a => a.is_equipped);
  const filteredAvatars = avatars.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'equipped') return a.is_equipped;
    if (filter === 'tradeable') return a.is_tradeable;
    return true;
  });

  const rarityCount = (rarity: string) => avatars.filter(a => a.rarity === rarity).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Smile className="w-8 h-8 text-gold-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Avatar Collection</h1>
        <p className="text-tertiary-text">Equip, collect, and trade unique owl-rank avatars with mining boosts</p>
      </div>

      {equipped && (
        <div className="bg-gradient-to-r from-gold-500/20 to-amber-500/20 rounded-xl border border-gold-500/50 p-6 flex items-center gap-6">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${RARITY_COLORS[equipped.rarity] || RARITY_COLORS.common} flex items-center justify-center border-2`}>
            {equipped.image_url ? (
              <img src={equipped.image_url} alt={equipped.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <Smile className="w-10 h-10 text-white" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-gold-400 uppercase">Currently Equipped</span>
              <Check className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">{equipped.name}</h2>
            <div className="flex items-center gap-3 mt-2 text-sm">
              <span className="px-2 py-1 bg-secondary rounded text-xs font-semibold capitalize">{RARITY_LABELS[equipped.rarity] || equipped.rarity}</span>
              {equipped.boost_type && (
                <span className="flex items-center gap-1 text-gold-400">
                  <Sparkles size={14} /> +{parseFloat(String(equipped.boost_value))}% {equipped.boost_type.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['common', 'uncommon', 'rare', 'epic', 'legendary'].map(rarity => (
          <div key={rarity} className={`bg-gradient-to-br ${RARITY_COLORS[rarity]} p-0.5 rounded-xl`}>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{rarityCount(rarity)}</div>
              <div className="text-xs text-tertiary-text capitalize">{RARITY_LABELS[rarity]}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['all', 'equipped', 'tradeable'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              filter === f ? 'bg-gold-500 text-navy-900' : 'bg-tertiary text-tertiary-text hover:bg-secondary'
            }`}
          >
            {f === 'all' ? 'All Avatars' : f}
          </button>
        ))}
      </div>

      {filteredAvatars.length === 0 ? (
        <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
          <Smile className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Avatars Yet</h3>
          <p className="text-tertiary-text">Earn avatars by completing quests, reaching rank milestones, or purchasing from the marketplace</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAvatars.map(avatar => {
            const BoostIcon = avatar.boost_type ? BOOST_ICONS[avatar.boost_type] : null;
            return (
              <div
                key={avatar.id}
                className={`bg-secondary rounded-xl p-5 border-2 transition-all ${
                  avatar.is_equipped ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-secondary hover:border-gold-500/50'
                }`}
              >
                <div className={`relative bg-gradient-to-br ${RARITY_COLORS[avatar.rarity] || RARITY_COLORS.common} p-4 rounded-xl mb-4 border-2`}>
                  {avatar.image_url ? (
                    <img src={avatar.image_url} alt={avatar.name} className="w-full h-32 rounded-lg object-cover" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center">
                      <Smile className="w-16 h-16 text-white/80" />
                    </div>
                  )}
                  {avatar.is_equipped && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded text-xs font-bold flex items-center gap-1">
                      <Check size={10} /> Equipped
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white rounded text-xs font-bold uppercase">
                    {RARITY_LABELS[avatar.rarity] || avatar.rarity}
                  </div>
                </div>

                <h3 className="font-bold text-sm mb-2 truncate">{avatar.name}</h3>

                {avatar.boost_type && BoostIcon && (
                  <div className="flex items-center gap-1 text-xs text-gold-400 mb-3">
                    <BoostIcon size={12} /> +{parseFloat(String(avatar.boost_value))}% {avatar.boost_type.replace(/_/g, ' ')}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-tertiary-text mb-3">
                  <span>{new Date(avatar.acquired_at).toLocaleDateString()}</span>
                  {avatar.is_tradeable && <span className="flex items-center gap-1 text-blue-400"><Shield size={10} /> Tradeable</span>}
                </div>

                {!avatar.is_equipped ? (
                  <button
                    onClick={() => handleEquip(avatar.id)}
                    disabled={equipping === avatar.id}
                    className="w-full py-2 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-lg text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {equipping === avatar.id ? (
                      <><div className="w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> Equipping...</>
                    ) : (
                      <><Check size={14} /> Equip</>
                    )}
                  </button>
                ) : (
                  <div className="w-full py-2 bg-green-500/20 text-green-400 font-bold rounded-lg text-sm text-center">
                    Currently Equipped
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
