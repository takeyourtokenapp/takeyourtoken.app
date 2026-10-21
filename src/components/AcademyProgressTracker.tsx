import { useState, useEffect } from 'react';
import { Award, Trophy, Star, Flame, Target, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface TrackProgress {
  track_id: string;
  track_title: string;
  total_lessons: number;
  completed_lessons: number;
  track_xp: number;
  completion_percentage: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  current: number;
  unlocked: boolean;
  xp_reward: number;
}

export default function AcademyProgressTracker() {
  const { user } = useAuth();
  const [trackProgress, setTrackProgress] = useState<TrackProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({
    totalXP: 0,
    currentRank: 'Worker',
    lessonsCompleted: 0,
    quizzesPassed: 0,
    currentStreak: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user]);

  const loadProgress = async () => {
    try {
      setIsLoading(true);

      const { data: userStats } = await supabase
        .from('profiles')
        .select('rank_score, owl_rank')
        .eq('id', user?.id)
        .single();

      const { data: academyStats } = await supabase
        .from('user_academy_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      const { data: tracks } = await supabase
        .from('academy_tracks')
        .select('id, title, xp_reward')
        .eq('is_published', true)
        .order('order_index');

      const progressData: TrackProgress[] = [];

      if (tracks) {
        for (const track of tracks) {
          const { data: lessons } = await supabase
            .from('academy_lessons')
            .select('id')
            .eq('track_id', track.id)
            .eq('is_published', true);

          const { data: completedLessons } = await supabase
            .from('academy_progress')
            .select('lesson_id')
            .eq('user_id', user?.id)
            .in('lesson_id', lessons?.map(l => l.id) || [])
            .not('completed_at', 'is', null);

          const totalLessons = lessons?.length || 0;
          const completed = completedLessons?.length || 0;
          const percentage = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

          progressData.push({
            track_id: track.id,
            track_title: track.title,
            total_lessons: totalLessons,
            completed_lessons: completed,
            track_xp: track.xp_reward || 0,
            completion_percentage: percentage
          });
        }
      }

      setTrackProgress(progressData);

      const achievementsData: Achievement[] = [
        {
          id: 'first_lesson',
          title: 'First Steps',
          description: 'Complete your first lesson',
          icon: 'star',
          requirement: 1,
          current: academyStats?.lessons_completed || 0,
          unlocked: (academyStats?.lessons_completed || 0) >= 1,
          xp_reward: 50
        },
        {
          id: 'quiz_master',
          title: 'Quiz Master',
          description: 'Pass 10 quizzes',
          icon: 'trophy',
          requirement: 10,
          current: academyStats?.quizzes_passed || 0,
          unlocked: (academyStats?.quizzes_passed || 0) >= 10,
          xp_reward: 200
        },
        {
          id: 'track_complete',
          title: 'Track Champion',
          description: 'Complete an entire learning track',
          icon: 'crown',
          requirement: 1,
          current: academyStats?.tracks_completed || 0,
          unlocked: (academyStats?.tracks_completed || 0) >= 1,
          xp_reward: 300
        },
        {
          id: 'streak_7',
          title: 'Weekly Warrior',
          description: 'Maintain a 7-day learning streak',
          icon: 'flame',
          requirement: 7,
          current: academyStats?.current_streak_days || 0,
          unlocked: (academyStats?.current_streak_days || 0) >= 7,
          xp_reward: 150
        },
        {
          id: 'xp_1000',
          title: 'Knowledge Seeker',
          description: 'Earn 1,000 total XP',
          icon: 'zap',
          requirement: 1000,
          current: userStats?.rank_score || 0,
          unlocked: (userStats?.rank_score || 0) >= 1000,
          xp_reward: 500
        }
      ];

      setAchievements(achievementsData);

      setStats({
        totalXP: userStats?.rank_score || 0,
        currentRank: userStats?.owl_rank || 'Worker',
        lessonsCompleted: academyStats?.lessons_completed || 0,
        quizzesPassed: academyStats?.quizzes_passed || 0,
        currentStreak: academyStats?.current_streak_days || 0
      });

    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      star: Star,
      trophy: Trophy,
      crown: Crown,
      flame: Flame,
      zap: Zap,
      shield: Shield,
      target: Target
    };
    return icons[iconName] || Award;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-owl-navy to-owl-slate border-2 border-gold-700 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-gold-400 to-gold-500 rounded-xl">
            <Target size={24} className="text-black" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Your Progress</h2>
            <p className="text-gray-400">Track your learning journey</p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-gray-400">Total XP</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.totalXP.toLocaleString()}</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Current Rank</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">{stats.currentRank}</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Lessons</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.lessonsCompleted}</div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">Streak</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{stats.currentStreak} days</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-owl-navy to-owl-slate border-2 border-gold-700 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Track Progress</h3>
        <div className="space-y-4">
          {trackProgress.map((track) => (
            <div key={track.track_id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold">{track.track_title}</h4>
                  <p className="text-sm text-gray-400">
                    {track.completed_lessons} / {track.total_lessons} lessons
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gold-400">{track.completion_percentage}%</div>
                  <div className="text-xs text-gray-500">{track.track_xp} XP</div>
                </div>
              </div>
              <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-500"
                  style={{ width: `${track.completion_percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-owl-navy to-owl-slate border-2 border-gold-700 rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">Achievements</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => {
            const Icon = getAchievementIcon(achievement.icon);
            const progress = Math.min((achievement.current / achievement.requirement) * 100, 100);

            return (
              <div
                key={achievement.id}
                className={`rounded-xl p-4 border-2 transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-gold-900/30 to-amber-900/30 border-gold-500'
                    : 'bg-gray-800/30 border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${achievement.unlocked ? 'bg-gold-500/20' : 'bg-gray-700'}`}>
                    <Icon size={24} className={achievement.unlocked ? 'text-gold-400' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold ${achievement.unlocked ? 'text-gold-400' : 'text-gray-300'}`}>
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-gray-400">{achievement.description}</p>
                  </div>
                </div>

                {!achievement.unlocked && (
                  <>
                    <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-400">
                      {achievement.current} / {achievement.requirement}
                    </div>
                  </>
                )}

                {achievement.unlocked && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400 font-semibold">Unlocked!</span>
                    <span className="text-gold-400">+{achievement.xp_reward} XP</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
