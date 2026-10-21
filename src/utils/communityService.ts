import { supabase } from '../lib/supabase';

export interface CommunityMessage {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  owl_rank: string;
  message: string;
  is_system: boolean;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar: string;
  owl_rank: string;
  total_hashrate: number;
  total_rewards: number;
  total_xp: number;
  rank_hashrate: number;
  rank_rewards: number;
  rank_xp: number;
  badges: string[];
}

export interface Achievement {
  id: string;
  achievement_code: string;
  achievement_name: string;
  achievement_description: string;
  icon: string;
  color: string;
  earned_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  icon: string;
  color: string;
  priority: number;
  start_date: string;
  end_date?: string;
}

export const communityService = {
  async sendMessage(message: string): Promise<CommunityMessage | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
      const avatar = user.user_metadata?.avatar || '🦉';
      const owlRank = user.user_metadata?.owl_rank || 'Worker';

      const { data, error } = await supabase
        .from('community_messages')
        .insert({
          user_id: user.id,
          username,
          avatar,
          owl_rank: owlRank,
          message: message.trim(),
          is_system: false
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  async getMessages(limit: number = 50): Promise<CommunityMessage[]> {
    try {
      const { data, error } = await supabase
        .from('community_messages')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  subscribeToMessages(callback: (message: CommunityMessage) => void) {
    const channel = supabase
      .channel('community_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: 'is_deleted=eq.false'
        },
        (payload) => {
          callback(payload.new as CommunityMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async updateOnlineStatus(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionId = `session_${Date.now()}`;

      const { error } = await supabase.rpc('update_online_status', {
        p_session_id: sessionId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  },

  async getOnlineUsersCount(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_online_users_count');

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting online users count:', error);
      return 0;
    }
  },

  async getLeaderboard(type: 'hashrate' | 'rewards' | 'xp' = 'hashrate', limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const orderColumn = type === 'hashrate' ? 'total_hashrate' : type === 'rewards' ? 'total_rewards' : 'total_xp';

      const { data, error } = await supabase
        .from('community_leaderboard_cache')
        .select('*')
        .order(orderColumn, { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  },

  async updateLeaderboardCache(): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_leaderboard_cache');
      if (error) throw error;
    } catch (error) {
      console.error('Error updating leaderboard cache:', error);
    }
  },

  async getUserAchievements(userId?: string): Promise<Achievement[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching achievements:', error);
      return [];
    }
  },

  async grantAchievement(
    achievementCode: string,
    achievementName: string,
    achievementDescription: string,
    icon: string,
    color: string
  ): Promise<Achievement | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_code: achievementCode,
          achievement_name: achievementName,
          achievement_description: achievementDescription,
          icon,
          color
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log('Achievement already earned');
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error granting achievement:', error);
      return null;
    }
  },

  async getActiveAnnouncements(): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('community_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('priority', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  subscribeToAnnouncements(callback: (announcement: Announcement) => void) {
    const channel = supabase
      .channel('community_announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_announcements',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          callback(payload.new as Announcement);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async checkAndGrantAchievements(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: miners } = await supabase
        .from('nft_miners')
        .select('*')
        .eq('owner_id', user.id);

      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id);

      const { data: lessons } = await supabase
        .from('user_lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (miners && miners.length >= 1) {
        await this.grantAchievement(
          'FIRST_MINER',
          'First Miner',
          'Purchased your first mining NFT',
          '⛏️',
          'blue'
        );
      }

      if (miners && miners.length >= 10) {
        await this.grantAchievement(
          'MINING_FLEET',
          'Mining Fleet',
          'Own 10 or more mining NFTs',
          '🚀',
          'purple'
        );
      }

      if (rewards && rewards.length >= 30) {
        await this.grantAchievement(
          'MONTHLY_MINER',
          'Monthly Miner',
          'Earned rewards for 30 consecutive days',
          '📅',
          'gold'
        );
      }

      if (lessons && lessons.length >= 5) {
        await this.grantAchievement(
          'STUDENT',
          'Diligent Student',
          'Completed 5 Academy lessons',
          '📚',
          'green'
        );
      }

      if (lessons && lessons.length >= 20) {
        await this.grantAchievement(
          'SCHOLAR',
          'Blockchain Scholar',
          'Completed 20 Academy lessons',
          '🎓',
          'amber'
        );
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }
};
