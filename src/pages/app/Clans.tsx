import { useState, useEffect } from 'react';
import { Shield, Users, Trophy, Swords, Plus, Search, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Clan {
  id: string;
  name: string;
  tag: string;
  leader_id: string;
  description: string;
  image_url: string;
  total_members: number;
  total_hashrate: number;
  total_btc_won: number;
  total_tyt_won: number;
  global_rank: number;
  win_count: number;
  loss_count: number;
  is_recruiting: boolean;
  min_hashrate_requirement: number;
}

export default function Clans() {
  const { user } = useAuth();
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadClans();
      loadMyClan();
    }
  }, [user]);

  const loadClans = async () => {
    const { data, error } = await supabase
      .from('game_clans')
      .select('*')
      .order('total_hashrate', { ascending: false })
      .limit(50);

    if (data) {
      setClans(data);
    }
  };

  const loadMyClan = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('game_clan_members')
      .select('clan_id, game_clans(*)')
      .eq('user_id', user.id)
      .single();

    if (data?.game_clans) {
      setMyClan(data.game_clans as any);
    }
  };

  const handleJoinClan = async (clanId: string) => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('game_clan_members').insert({
        clan_id: clanId,
        user_id: user.id,
        rank: 'private',
      });

      if (error) throw error;

      alert('Successfully joined the clan!');
      loadMyClan();
      loadClans();
    } catch (error: any) {
      console.error('Join clan error:', error);
      alert(error.message || 'Failed to join clan');
    } finally {
      setLoading(false);
    }
  };

  const filteredClans = clans.filter((clan) =>
    clan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clan.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Clans & Wars</h1>
        <p className="text-gray-400">Join forces and compete for glory and rewards</p>
      </div>

      {/* My Clan Card */}
      {myClan && (
        <div className="bg-gradient-to-br from-[#D2A44C]/20 to-yellow-600/20 rounded-xl p-6 border border-[#D2A44C]/30">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
              {myClan.image_url ? (
                <img src={myClan.image_url} alt={myClan.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Shield className="w-12 h-12 text-[#D2A44C]" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{myClan.name}</h2>
                <span className="px-3 py-1 bg-[#D2A44C]/30 text-[#D2A44C] rounded-lg font-bold">
                  [{myClan.tag}]
                </span>
              </div>
              <p className="text-gray-300 mb-4">{myClan.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Members</div>
                  <div className="text-xl font-bold text-white">{myClan.total_members}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Hashrate</div>
                  <div className="text-xl font-bold text-white">{myClan.total_hashrate.toFixed(2)} TH/s</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Wins/Losses</div>
                  <div className="text-xl font-bold text-white">
                    {myClan.win_count}/{myClan.loss_count}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Global Rank</div>
                  <div className="text-xl font-bold text-[#D2A44C]">#{myClan.global_rank || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Create */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clans..."
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D2A44C]"
          />
        </div>
        {!myClan && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#D2A44C] text-white font-bold rounded-lg hover:bg-yellow-600 transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Clan
          </button>
        )}
      </div>

      {/* Top 3 Clans */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Top Clans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredClans.slice(0, 3).map((clan, index) => {
            const medals = ['🥇', '🥈', '🥉'];
            const colors = [
              'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
              'from-gray-400/20 to-gray-500/20 border-gray-400/30',
              'from-orange-500/20 to-orange-600/20 border-orange-500/30',
            ];

            return (
              <div
                key={clan.id}
                className={`bg-gradient-to-br ${colors[index]} rounded-xl p-6 border`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl">{medals[index]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white">{clan.name}</h3>
                      <span className="text-sm text-gray-400">[{clan.tag}]</span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{clan.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-400">Members</div>
                    <div className="text-white font-bold">{clan.total_members}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Hashrate</div>
                    <div className="text-white font-bold">{clan.total_hashrate.toFixed(1)} TH/s</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Wins</div>
                    <div className="text-white font-bold">{clan.win_count}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">BTC Won</div>
                    <div className="text-white font-bold">{clan.total_btc_won.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Clans */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">All Clans</h2>
        <div className="space-y-4">
          {filteredClans.slice(3).map((clan) => (
            <div
              key={clan.id}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border border-gray-700/50 hover:border-[#D2A44C]/30 transition-all"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  {clan.image_url ? (
                    <img src={clan.image_url} alt={clan.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Shield className="w-8 h-8 text-[#D2A44C]" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-white">{clan.name}</h3>
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm font-bold">
                          [{clan.tag}]
                        </span>
                        {clan.global_rank && clan.global_rank <= 10 && (
                          <span className="px-2 py-1 bg-[#D2A44C]/20 text-[#D2A44C] rounded text-xs">
                            Top {clan.global_rank}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mt-1">{clan.description}</p>
                    </div>
                    {!myClan && clan.is_recruiting && (
                      <button
                        onClick={() => handleJoinClan(clan.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-[#D2A44C] text-white rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
                      >
                        Join
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Users className="w-4 h-4" />
                        <span>Members</span>
                      </div>
                      <div className="text-white font-bold">{clan.total_members}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        <span>Hashrate</span>
                      </div>
                      <div className="text-white font-bold">{clan.total_hashrate.toFixed(2)} TH/s</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Trophy className="w-4 h-4" />
                        <span>W/L</span>
                      </div>
                      <div className="text-white font-bold">
                        {clan.win_count}/{clan.loss_count}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">BTC Won</div>
                      <div className="text-white font-bold">{clan.total_btc_won.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">TYT Won</div>
                      <div className="text-white font-bold">{clan.total_tyt_won.toFixed(2)}</div>
                    </div>
                  </div>

                  {clan.min_hashrate_requirement > 0 && (
                    <div className="mt-3 text-sm text-gray-400">
                      Minimum hashrate requirement: {clan.min_hashrate_requirement} TH/s
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredClans.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Clans Found</h3>
          <p className="text-gray-400">Try adjusting your search or create a new clan!</p>
        </div>
      )}
    </div>
  );
}
