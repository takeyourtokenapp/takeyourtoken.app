import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Trophy, Swords, Shield, Plus, Crown, Activity, TrendingUp } from 'lucide-react';

interface Clan {
  id: string;
  name: string;
  tag: string;
  leader_id: string;
  description: string | null;
  image_url: string | null;
  total_members: number;
  total_hashrate: number;
  total_btc_won: number;
  total_tyt_won: number;
  global_rank: number | null;
  win_count: number;
  loss_count: number;
  is_recruiting: boolean;
  min_hashrate_requirement: number;
  created_at: string;
}

interface ClanMember {
  id: string;
  clan_id: string;
  user_id: string;
  rank: string;
  hashrate_contribution: number;
  battles_participated: number;
  points_earned: number;
  joined_at: string;
  last_active_at: string;
  profile?: { username: string } | null;
}

export default function Clans() {
  const { user } = useAuth();
  const [clans, setClans] = useState<Clan[]>([]);
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'myClan' | 'browse'>('leaderboard');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const { data: clansData, error } = await supabase
        .from('game_clans')
        .select('*')
        .order('global_rank', { ascending: true, nullsFirst: false })
        .limit(50);

      if (error) throw error;
      setClans(clansData || []);

      if (user) {
        const { data: membership } = await supabase
          .from('game_clan_members')
          .select('clan_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership?.clan_id) {
          const { data: clan } = await supabase
            .from('game_clans')
            .select('*')
            .eq('id', membership.clan_id)
            .maybeSingle();

          if (clan) {
            setMyClan(clan);
            const { data: memberData } = await supabase
              .from('game_clan_members')
              .select(`
                *,
                profile:profiles(username)
              `)
              .eq('clan_id', clan.id)
              .order('points_earned', { ascending: false });
            setMembers(memberData || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading clans:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinClan(clanId: string) {
    if (!user) return;
    try {
      const { error } = await supabase.from('game_clan_members').insert({
        clan_id: clanId,
        user_id: user.id,
        rank: 'private'
      });
      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Failed to join clan:', error);
    }
  }

  async function handleCreateClan(name: string, tag: string, description: string) {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('game_clans').insert({
        name,
        tag: tag.toUpperCase(),
        leader_id: user.id,
        description,
        is_recruiting: true
      }).select().single();

      if (error) throw error;

      await supabase.from('game_clan_members').insert({
        clan_id: data.id,
        user_id: user.id,
        rank: 'leader'
      });

      setShowCreateForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create clan:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Users className="w-8 h-8 text-gold-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Clan System</h1>
          <p className="text-tertiary-text">Join or create mining clans to compete, collaborate, and climb the leaderboard</p>
        </div>
        {!myClan && (
          <button onClick={() => setShowCreateForm(true)} className="px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-xl transition-all flex items-center gap-2">
            <Plus size={18} /> Create Clan
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['leaderboard', 'myClan', 'browse'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === tab ? 'bg-gold-500 text-navy-900' : 'bg-tertiary text-tertiary-text hover:bg-secondary'}`}
          >
            {tab === 'myClan' ? 'My Clan' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'leaderboard' && (
        <div className="bg-secondary rounded-xl border border-secondary overflow-hidden">
          {clans.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Clans Yet</h3>
              <p className="text-tertiary-text">Be the first to create a clan and dominate the leaderboard!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-tertiary-text">Clan</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Members</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Hashrate</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">Wins</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-tertiary-text">BTC Won</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-tertiary-text">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary">
                  {clans.map((clan, idx) => (
                    <tr key={clan.id} className="hover:bg-tertiary transition-colors">
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${idx < 3 ? 'font-bold' : ''}`}>
                          {idx === 0 && <Crown className="w-5 h-5 text-gold-400" />}
                          {idx === 1 && <Trophy className="w-5 h-5 text-gray-400" />}
                          {idx === 2 && <Trophy className="w-5 h-5 text-amber-600" />}
                          <span className={idx < 3 ? 'text-gold-400' : ''}>{clan.global_rank || idx + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{clan.name}</div>
                        <div className="text-xs text-tertiary-text font-mono">[{clan.tag}]</div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">{clan.total_members}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gold-400">{parseFloat(String(clan.total_hashrate)).toFixed(0)} TH/s</td>
                      <td className="px-6 py-4 text-right font-semibold text-green-400">{clan.win_count}</td>
                      <td className="px-6 py-4 text-right font-semibold text-amber-400">{parseFloat(String(clan.total_btc_won)).toFixed(8)}</td>
                      <td className="px-6 py-4 text-center">
                        {clan.is_recruiting ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-semibold">Recruiting</span>
                        ) : (
                          <span className="px-2 py-1 bg-tertiary text-tertiary-text rounded text-xs">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'myClan' && (
        <div>
          {myClan ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gold-500/20 to-amber-500/20 rounded-xl border border-gold-500/50 p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">{myClan.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-tertiary-text">
                      <span className="font-mono font-bold text-gold-400">[{myClan.tag}]</span>
                      {myClan.global_rank && <span>Rank #{myClan.global_rank}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-gold-500/20 border border-gold-500/50 rounded-xl">
                    <Users className="w-5 h-5 text-gold-400" />
                    <span className="font-bold text-gold-400">{myClan.total_members} members</span>
                  </div>
                </div>

                {myClan.description && <p className="text-secondary-text mb-6">{myClan.description}</p>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-tertiary-text mb-1">Total Hashrate</div>
                    <div className="text-xl font-bold text-gold-400">{parseFloat(String(myClan.total_hashrate)).toFixed(0)} TH/s</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-tertiary-text mb-1">Wins / Losses</div>
                    <div className="text-xl font-bold"><span className="text-green-400">{myClan.win_count}</span> / <span className="text-red-400">{myClan.loss_count}</span></div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-tertiary-text mb-1">BTC Won</div>
                    <div className="text-xl font-bold text-amber-400">{parseFloat(String(myClan.total_btc_won)).toFixed(8)}</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="text-xs text-tertiary-text mb-1">TYT Won</div>
                    <div className="text-xl font-bold text-pink-400">{parseFloat(String(myClan.total_tyt_won)).toFixed(0)}</div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary rounded-xl border border-secondary p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold-400" /> Members
                </h3>
                <div className="space-y-3">
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-tertiary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          member.rank === 'leader' ? 'bg-gold-500/20 text-gold-400' :
                          member.rank === 'officer' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-tertiary text-tertiary-text'
                        }`}>
                          {member.rank === 'leader' ? <Crown size={18} /> : (member.profile?.username || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold">{member.profile?.username || 'Unknown Player'}</div>
                          <div className="text-xs text-tertiary-text capitalize">{member.rank}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <div className="text-tertiary-text text-xs">Hashrate</div>
                          <div className="font-bold text-gold-400">{parseFloat(String(member.hashrate_contribution)).toFixed(0)} TH/s</div>
                        </div>
                        <div className="text-right">
                          <div className="text-tertiary-text text-xs">Points</div>
                          <div className="font-bold text-blue-400">{member.points_earned}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-tertiary-text text-xs">Battles</div>
                          <div className="font-bold">{member.battles_participated}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
              <Shield className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">You're Not in a Clan Yet</h3>
              <p className="text-tertiary-text mb-6">Browse clans and join one, or create your own to start competing</p>
              <button onClick={() => setActiveTab('browse')} className="px-6 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-xl">Browse Clans</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'browse' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clans.filter(c => c.is_recruiting && c.id !== myClan?.id).map(clan => (
            <div key={clan.id} className="bg-secondary rounded-xl p-6 border border-secondary hover:border-gold-500/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{clan.name}</h3>
                  <div className="text-sm font-mono text-gold-400">[{clan.tag}]</div>
                </div>
                {clan.global_rank && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gold-400">#{clan.global_rank}</div>
                    <div className="text-xs text-tertiary-text">global rank</div>
                  </div>
                )}
              </div>
              {clan.description && <p className="text-sm text-tertiary-text mb-4 line-clamp-2">{clan.description}</p>}
              <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                <div className="bg-tertiary rounded-lg p-2 text-center">
                  <div className="text-xs text-tertiary-text">Members</div>
                  <div className="font-bold">{clan.total_members}</div>
                </div>
                <div className="bg-tertiary rounded-lg p-2 text-center">
                  <div className="text-xs text-tertiary-text">Hashrate</div>
                  <div className="font-bold text-gold-400">{parseFloat(String(clan.total_hashrate)).toFixed(0)}</div>
                </div>
                <div className="bg-tertiary rounded-lg p-2 text-center">
                  <div className="text-xs text-tertiary-text">Wins</div>
                  <div className="font-bold text-green-400">{clan.win_count}</div>
                </div>
              </div>
              {clan.min_hashrate_requirement > 0 && (
                <div className="text-xs text-amber-400 mb-3">Min hashrate: {parseFloat(String(clan.min_hashrate_requirement))} TH/s</div>
              )}
              <button
                onClick={() => handleJoinClan(clan.id)}
                className="w-full py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Join Clan
              </button>
            </div>
          ))}
          {clans.filter(c => c.is_recruiting && c.id !== myClan?.id).length === 0 && (
            <div className="col-span-full text-center py-12 text-tertiary-text">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No clans currently recruiting</p>
            </div>
          )}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateForm(false)}>
          <div className="bg-secondary rounded-xl border border-secondary max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Create a Clan</h2>
            <CreateClanForm onCreate={handleCreateClan} onCancel={() => setShowCreateForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function CreateClanForm({ onCreate, onCancel }: { onCreate: (name: string, tag: string, desc: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Clan Name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Owl Warriors"
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Clan Tag (3-5 chars)</label>
        <input value={tag} onChange={e => setTag(e.target.value.slice(0, 5).toUpperCase())} placeholder="OWLR"
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/50 transition-all" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe your clan..."
          className="w-full px-4 py-3 bg-tertiary border border-secondary rounded-lg focus:border-gold-500 focus:ring-2 focus:ring-gold-500/50 transition-all" />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onCreate(name, tag, description)}
          disabled={!name || !tag}
          className="flex-1 py-3 bg-gradient-to-r from-gold-400 to-gold-600 text-navy-900 font-bold rounded-xl transition-all disabled:opacity-50"
        >
          Create Clan
        </button>
        <button onClick={onCancel} className="flex-1 py-3 bg-tertiary hover:bg-secondary font-bold rounded-xl transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}
