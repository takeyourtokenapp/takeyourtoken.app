/**
 * Gamification Service
 *
 * Manages user ranks, achievements, and leaderboards.
 * Integrates with the Owlverse rank system.
 */

import { supabase } from '../lib/supabase';

export type UserRank = 'worker' | 'academic' | 'diplomat' | 'peacekeeper' | 'ambassador' | 'warrior';

export type AchievementCategory = 'mining' | 'academy' | 'governance' | 'charity' | 'social' | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  badge_code: string;
  name: string;
  description: string;
  icon: string | null;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points_bonus: number;
  requirement: Record<string, any>;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  badge_code: string;
  earned_at: string;
  source: string | null;
  metadata: Record<string, any>;
}

export interface UserRankInfo {
  user_id: string;
  username: string;
  rank: UserRank;
  rank_score: number;
  rank_updated_at: string;
}

export interface RankUpdate {
  user_id: string;
  score: number;
  rank: UserRank;
  old_rank: UserRank;
  changed: boolean;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  rank: UserRank;
  rank_score: number;
  total_hashrate: number;
  pos: number;
}

export interface RankRequirements {
  rank: UserRank;
  min_score: number;
  max_score: number;
  description: string;
}

const RANK_REQUIREMENTS: RankRequirements[] = [
  { rank: 'worker', min_score: 0, max_score: 99, description: 'Getting started' },
  { rank: 'academic', min_score: 100, max_score: 499, description: 'Learning the ropes' },
  { rank: 'diplomat', min_score: 500, max_score: 999, description: 'Experienced miner' },
  { rank: 'peacekeeper', min_score: 1000, max_score: 4999, description: 'Power contributor' },
  { rank: 'ambassador', min_score: 5000, max_score: 9999, description: 'Elite miner' },
  { rank: 'warrior', min_score: 10000, max_score: Infinity, description: 'Legendary status' },
];

export class GamificationService {
  /**
   * Get user's current rank info
   */
  async getUserRank(userId?: string): Promise<UserRankInfo | null> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return null;
      }
      targetUserId = session.session.user.id;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, rank, rank_score, rank_updated_at')
      .eq('id', targetUserId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      user_id: data.id,
      username: data.username,
      rank: data.rank as UserRank,
      rank_score: data.rank_score,
      rank_updated_at: data.rank_updated_at,
    };
  }

  /**
   * Calculate user's rank score
   */
  async calculateRankScore(userId?: string): Promise<number> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return 0;
      }
      targetUserId = session.session.user.id;
    }

    const { data, error } = await supabase.rpc('calculate_rank_score', {
      p_user_id: targetUserId,
    });

    if (error) throw error;
    return data || 0;
  }

  /**
   * Update user's rank
   */
  async updateRank(userId?: string): Promise<RankUpdate> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Not authenticated');
      }
      targetUserId = session.session.user.id;
    }

    const { data, error } = await supabase.rpc('update_user_rank', {
      p_user_id: targetUserId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100, offset = 0): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_limit: limit,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's leaderboard position
   */
  async getUserPosition(userId?: string): Promise<number> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return 0;
      }
      targetUserId = session.session.user.id;
    }

    const leaderboard = await this.getLeaderboard(10000);
    const position = leaderboard.findIndex((entry) => entry.user_id === targetUserId);

    return position >= 0 ? position + 1 : 0;
  }

  /**
   * Get all achievement definitions
   */
  async getAchievementDefinitions(): Promise<AchievementDefinition[]> {
    const { data, error } = await supabase
      .from('achievement_definitions')
      .select('*')
      .order('xp_reward', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId?: string): Promise<UserAchievement[]> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return [];
      }
      targetUserId = session.session.user.id;
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get user achievements with definitions
   */
  async getUserAchievementsWithDefinitions(userId?: string): Promise<Array<UserAchievement & AchievementDefinition>> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return [];
      }
      targetUserId = session.session.user.id;
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement_definitions (*)
      `)
      .eq('user_id', targetUserId)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      ...item,
      ...item.achievement_definitions,
    }));
  }

  /**
   * Check and award new achievements
   */
  async checkAchievements(userId?: string): Promise<any> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        throw new Error('Not authenticated');
      }
      targetUserId = session.session.user.id;
    }

    const { data, error } = await supabase.rpc('check_achievements', {
      p_user_id: targetUserId,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get rank requirements
   */
  getRankRequirements(): RankRequirements[] {
    return RANK_REQUIREMENTS;
  }

  /**
   * Get next rank info
   */
  getNextRank(currentScore: number): RankRequirements | null {
    const nextRank = RANK_REQUIREMENTS.find((req) => currentScore < req.min_score);
    return nextRank || null;
  }

  /**
   * Get current rank from score
   */
  getRankFromScore(score: number): RankRequirements {
    return RANK_REQUIREMENTS.find(
      (req) => score >= req.min_score && score <= req.max_score
    ) || RANK_REQUIREMENTS[0];
  }

  /**
   * Calculate progress to next rank
   */
  getProgressToNextRank(currentScore: number): {
    current_rank: RankRequirements;
    next_rank: RankRequirements | null;
    progress_percent: number;
    points_needed: number;
  } {
    const currentRank = this.getRankFromScore(currentScore);
    const nextRank = this.getNextRank(currentScore);

    if (!nextRank) {
      return {
        current_rank: currentRank,
        next_rank: null,
        progress_percent: 100,
        points_needed: 0,
      };
    }

    const rangeSize = nextRank.min_score - currentRank.min_score;
    const currentProgress = currentScore - currentRank.min_score;
    const progressPercent = Math.min(100, (currentProgress / rangeSize) * 100);

    return {
      current_rank: currentRank,
      next_rank: nextRank,
      progress_percent: progressPercent,
      points_needed: nextRank.min_score - currentScore,
    };
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(userId?: string): Promise<{
    total_achievements: number;
    by_category: Record<AchievementCategory, number>;
    by_rarity: Record<AchievementRarity, number>;
    completion_percent: number;
  }> {
    let targetUserId = userId;

    if (!targetUserId) {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        return {
          total_achievements: 0,
          by_category: {
            mining: 0,
            academy: 0,
            governance: 0,
            charity: 0,
            social: 0,
            special: 0,
          },
          by_rarity: {
            common: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
          },
          completion_percent: 0,
        };
      }
      targetUserId = session.session.user.id;
    }

    const [userAchievements, allDefinitions] = await Promise.all([
      this.getUserAchievementsWithDefinitions(targetUserId),
      this.getAchievementDefinitions(),
    ]);

    const byCategory: Record<AchievementCategory, number> = {
      mining: 0,
      academy: 0,
      governance: 0,
      charity: 0,
      social: 0,
      special: 0,
    };

    const byRarity: Record<AchievementRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    };

    userAchievements.forEach((achievement) => {
      byCategory[achievement.category]++;
      byRarity[achievement.rarity]++;
    });

    const completionPercent =
      allDefinitions.length > 0
        ? (userAchievements.length / allDefinitions.length) * 100
        : 0;

    return {
      total_achievements: userAchievements.length,
      by_category: byCategory,
      by_rarity: byRarity,
      completion_percent: completionPercent,
    };
  }

  /**
   * Subscribe to rank updates
   */
  subscribeToRankUpdates(userId: string, callback: (rank: UserRankInfo) => void) {
    const channel = supabase
      .channel(`rank-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const profile = payload.new as any;
          callback({
            user_id: profile.id,
            username: profile.username,
            rank: profile.rank,
            rank_score: profile.rank_score,
            rank_updated_at: profile.rank_updated_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Subscribe to new achievements
   */
  subscribeToAchievements(userId: string, callback: (achievement: UserAchievement) => void) {
    const channel = supabase
      .channel(`achievements-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as UserAchievement);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const gamificationService = new GamificationService();
