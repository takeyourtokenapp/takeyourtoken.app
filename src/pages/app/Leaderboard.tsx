import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Trophy,
  Crown,
  Medal,
  TrendingUp,
  Flame,
  Heart,
  Zap,
  Users,
  Award,
  Target,
  ChevronRight,
  Star
} from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  rank: number;
  value: number;
  badge?: string;
}

type LeaderboardType = 'hashrate' | 'rewards' | 'charity' | 'referrals' | 'vip' | 'academy';

export default function Leaderboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('hashrate');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let data: any[] = [];

      switch (activeTab) {
        case 'hashrate':
          data = await loadHashrateLeaderboard();
          break;
        case 'rewards':
          data = await loadRewardsLeaderboard();
          break;
        case 'charity':
          data = await loadCharityLeaderboard();
          break;
        case 'referrals':
          data = await loadReferralsLeaderboard();
          break;
        case 'vip':
          data = await loadVIPLeaderboard();
          break;
        case 'academy':
          data = await loadAcademyLeaderboard();
          break;
      }

      setLeaderboard(data);
      const myRank = data.find(entry => entry.user_id === user.id);
      setUserRank(myRank || null);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHashrateLeaderboard = async () => {
    const { data, error } = await supabase
      .from('nft_miners')
      .select(`
        owner_id,
        power_th,
        user_profiles!nft_miners_owner_id_fkey (
          user_id,
          username,
          avatar_url
        )
      `)
      .eq('status', 'active');

    if (error || !data) return [];

    const aggregated = data.reduce((acc: any, miner: any) => {
      const userId = miner.owner_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          username: miner.user_profiles?.username || 'Anonymous',
          avatar_url: miner.user_profiles?.avatar_url,
          value: 0
        };
      }
      acc[userId].value += parseFloat(miner.power_th);
      return acc;
    }, {});

    return Object.values(aggregated)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 100)
      .map((entry: any, index) => ({
        ...entry,
        rank: index + 1,
        badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : undefined
      }));
  };

  const loadRewardsLeaderboard = async () => {
    const { data, error } = await supabase
      .from('daily_rewards')
      .select(`
        user_id,
        net_btc_rewarded,
        user_profiles!daily_rewards_user_id_fkey (
          user_id,
          username,
          avatar_url
        )
      `);

    if (error || !data) return [];

    const aggregated = data.reduce((acc: any, reward: any) => {
      const userId = reward.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          username: reward.user_profiles?.username || 'Anonymous',
          avatar_url: reward.user_profiles?.avatar_url,
          value: 0
        };
      }
      acc[userId].value += parseFloat(reward.net_btc_rewarded);
      return acc;
    }, {});

    return Object.values(aggregated)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 100)
      .map((entry: any, index) => ({
        ...entry,
        rank: index + 1,
        badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : undefined
      }));
  };

  const loadCharityLeaderboard = async () => {
    const { data, error } = await supabase
      .from('charity_stakes')
      .select(`
        user_id,
        total_donated,
        user_profiles!charity_stakes_user_id_fkey (
          user_id,
          username,
          avatar_url
        )
      `)
      .eq('status', 'active');

    if (error || !data) return [];

    const aggregated = data.reduce((acc: any, stake: any) => {
      const userId = stake.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_id: userId,
          username: stake.user_profiles?.username || 'Anonymous',
          avatar_url: stake.user_profiles?.avatar_url,
          value: 0
        };
      }
      acc[userId].value += parseFloat(stake.total_donated);
      return acc;
    }, {});

    return Object.values(aggregated)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 100)
      .map((entry: any, index) => ({
        ...entry,
        rank: index + 1,
        badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : undefined
      }));
  };

  const loadReferralsLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, avatar_url, total_referrals')
      .order('total_referrals', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.username || 'Anonymous',
      avatar_url: entry.avatar_url,
      rank: index + 1,
      value: entry.total_referrals || 0,
      badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : undefined
    }));
  };

  const loadVIPLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, avatar_url, vip_level')
      .order('vip_level', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.username || 'Anonymous',
      avatar_url: entry.avatar_url,
      rank: index + 1,
      value: entry.vip_level || 0,
      badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : undefined
    }));
  };

  const loadAcademyLeaderboard = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, username, avatar_url, academy_xp')
      .order('academy_xp', { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((entry, index) => ({
      user_id: entry.user_id,
      username: entry.username || 'Anonymous',
      avatar_url: entry.avatar_url,
      rank: index + 1,
      value: entry.academy_xp || 0,
      badge: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : undefined
    }));
  };

  const tabs = [
    { id: 'hashrate' as LeaderboardType, label: 'Top Hashrate', icon: Zap, color: 'text-yellow-400' },
    { id: 'rewards' as LeaderboardType, label: 'Top Earners', icon: TrendingUp, color: 'text-green-400' },
    { id: 'charity' as LeaderboardType, label: 'Top Donors', icon: Heart, color: 'text-pink-400' },
    { id: 'referrals' as LeaderboardType, label: 'Top Referrers', icon: Users, color: 'text-blue-400' },
    { id: 'vip' as LeaderboardType, label: 'VIP Status', icon: Crown, color: 'text-gold-400' },
    { id: 'academy' as LeaderboardType, label: 'Academy XP', icon: Award, color: 'text-purple-400' }
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-gold-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  const getValueLabel = (type: LeaderboardType, value: number) => {
    switch (type) {
      case 'hashrate':
        return `${value.toFixed(2)} TH/s`;
      case 'rewards':
        return `${value.toFixed(8)} BTC`;
      case 'charity':
        return `${value.toLocaleString()} TYT`;
      case 'referrals':
        return `${value} referrals`;
      case 'vip':
        return `Level ${value}`;
      case 'academy':
        return `${value.toLocaleString()} XP`;
      default:
        return value.toString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Trophy className="w-8 h-8 text-gold-400" />
          Global Leaderboard
        </h1>
        <p className="text-gray-400">Compete with the TYT community</p>
      </div>

      {userRank && (
        <div className="bg-gradient-to-br from-gold-900/30 to-amber-900/30 rounded-xl p-6 border border-gold-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {getRankIcon(userRank.rank)}
                <div>
                  <div className="text-sm text-gray-400">Your Rank</div>
                  <div className="text-2xl font-bold">#{userRank.rank}</div>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-700" />
              <div>
                <div className="text-sm text-gray-400">Your Score</div>
                <div className="text-xl font-bold">
                  {getValueLabel(activeTab, userRank.value)}
                </div>
              </div>
            </div>
            <Star className="w-8 h-8 text-gold-400 fill-gold-400" />
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gold-500/20 text-gold-400 border-b-2 border-gold-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? tab.color : ''} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No data available yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    entry.user_id === user?.id
                      ? 'bg-gold-500/10 border border-gold-500/30'
                      : 'bg-gray-800/50 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-500/20 to-amber-500/20 flex items-center justify-center text-xl font-bold text-gold-400">
                      {entry.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold flex items-center gap-2">
                        {entry.username}
                        {entry.badge && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              entry.badge === 'gold'
                                ? 'bg-gold-500/20 text-gold-400'
                                : entry.badge === 'silver'
                                ? 'bg-gray-500/20 text-gray-300'
                                : 'bg-orange-500/20 text-orange-400'
                            }`}
                          >
                            {entry.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        {getValueLabel(activeTab, entry.value)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
