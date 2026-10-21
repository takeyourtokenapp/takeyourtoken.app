import { useState, useEffect } from 'react';
import { Trophy, Target, Users, BookOpen, Twitter, MessageCircle, Gift, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type QuestType = 'platform_action' | 'social_engagement' | 'educational' | 'community';
type QuestStatus = 'locked' | 'available' | 'in_progress' | 'completed';

interface Quest {
  id: string;
  slug: string;
  title: string;
  description: string;
  quest_type: QuestType;
  xp_reward: number;
  tyt_reward: number;
  icon: string;
  color: string;
  is_repeatable: boolean;
  status?: QuestStatus;
  required_action?: string;
  social_url?: string;
}

const QUEST_TYPE_INFO: Record<QuestType, { label: string; icon: any; color: string }> = {
  platform_action: { label: 'Platform', icon: Target, color: 'blue' },
  social_engagement: { label: 'Social', icon: Twitter, color: 'cyan' },
  educational: { label: 'Education', icon: BookOpen, color: 'purple' },
  community: { label: 'Community', icon: Users, color: 'green' },
};

export default function Quests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [filter, setFilter] = useState<QuestType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [totalTYT, setTotalTYT] = useState(0);

  useEffect(() => {
    if (user) {
      loadQuests();
      loadCompletions();
    }
  }, [user]);

  const loadQuests = async () => {
    const { data, error } = await supabase
      .from('academy_quests')
      .select('*')
      .eq('is_active', true)
      .order('xp_reward', { ascending: false });

    if (data) {
      setQuests(data);
    }
  };

  const loadCompletions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('academy_user_quests')
      .select('*')
      .eq('user_id', user.id);

    if (data) {
      setCompletions(data);

      const xp = data.filter(c => c.completed_at).reduce((sum, c) => {
        const quest = quests.find(q => q.id === c.quest_id);
        return sum + (quest?.xp_reward || 0);
      }, 0);

      const tyt = data.filter(c => c.completed_at).reduce((sum, c) => {
        const quest = quests.find(q => q.id === c.quest_id);
        return sum + (quest?.tyt_reward || 0);
      }, 0);

      setTotalXP(xp);
      setTotalTYT(tyt);
    }
  };

  const getQuestStatus = (quest: Quest): QuestStatus => {
    const completion = completions.find((c) => c.quest_id === quest.id);
    if (completion) {
      if (completion.completed_at) return 'completed';
      return 'in_progress';
    }
    return 'available';
  };

  const handleStartQuest = async (quest: Quest) => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('academy_user_quests').insert({
        user_id: user.id,
        quest_id: quest.id,
        progress: {},
      });

      if (error) throw error;

      alert('Quest started! Complete the requirements to claim your rewards.');
      loadCompletions();
    } catch (error: any) {
      console.error('Quest start error:', error);
      alert(error.message || 'Failed to start quest');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteQuest = async (quest: Quest) => {
    if (!user) return;

    setLoading(true);

    try {
      const completion = completions.find((c) => c.quest_id === quest.id);
      if (!completion) return;

      const { error } = await supabase
        .from('academy_quest_completions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          xp_claimed: quest.xp_reward,
          tyt_claimed: quest.tyt_reward,
        })
        .eq('id', completion.id);

      if (error) throw error;

      // Update user XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('academy_xp')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            academy_xp: (profile.academy_xp || 0) + quest.xp_reward,
          })
          .eq('id', user.id);
      }

      alert(`Quest completed! Earned ${quest.xp_reward} XP and ${quest.tyt_reward} TYT!`);
      loadCompletions();
    } catch (error: any) {
      console.error('Quest completion error:', error);
      alert(error.message || 'Failed to complete quest');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialQuest = (quest: Quest) => {
    if (quest.social_url) {
      window.open(quest.social_url, '_blank');
      handleStartQuest(quest);
    }
  };

  const filteredQuests = quests.filter((quest) => {
    if (filter === 'all') return true;
    return quest.quest_type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Quests & Missions</h1>
        <p className="text-gray-400">Complete quests to earn XP and TYT rewards</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{completions.filter(c => c.status === 'completed').length}</div>
              <div className="text-sm text-gray-400">Quests Completed</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total XP Earned</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#D2A44C]/20 to-yellow-600/20 rounded-xl p-6 border border-[#D2A44C]/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#D2A44C]/20 rounded-lg">
              <Gift className="w-6 h-6 text-[#D2A44C]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalTYT.toFixed(2)}</div>
              <div className="text-sm text-gray-400">TYT Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-[#D2A44C] text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Quests
        </button>
        {(Object.entries(QUEST_TYPE_INFO) as [QuestType, typeof QUEST_TYPE_INFO[QuestType]][]).map(
          ([type, info]) => {
            const Icon = info.icon;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  filter === type
                    ? 'bg-[#D2A44C] text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {info.label}
              </button>
            );
          }
        )}
      </div>

      {/* Quest List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredQuests.map((quest) => {
          const status = getQuestStatus(quest);
          const typeInfo = QUEST_TYPE_INFO[quest.quest_type];
          const TypeIcon = typeInfo.icon;
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';
          const isLocked = status === 'locked';

          return (
            <div
              key={quest.id}
              className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 border transition-all ${
                isCompleted
                  ? 'border-green-500/50 bg-green-500/5'
                  : isLocked
                  ? 'border-gray-700/30 opacity-60'
                  : 'border-gray-700/50 hover:border-[#D2A44C]/50'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    isCompleted
                      ? 'bg-green-500/20'
                      : isLocked
                      ? 'bg-gray-700/20'
                      : 'bg-[#D2A44C]/20'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6 text-gray-400" />
                  ) : (
                    <TypeIcon className="w-6 h-6 text-[#D2A44C]" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{quest.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          typeInfo.color === 'blue'
                            ? 'bg-blue-500/20 text-blue-400'
                            : typeInfo.color === 'cyan'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : typeInfo.color === 'purple'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}
                      >
                        {typeInfo.label}
                      </span>
                    </div>
                    {quest.is_repeatable && (
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                        Repeatable
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{quest.description}</p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white font-medium">+{quest.xp_reward} XP</span>
                    </div>
                    {quest.tyt_reward > 0 && (
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-[#D2A44C]" />
                        <span className="text-sm text-white font-medium">+{quest.tyt_reward} TYT</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {isCompleted ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Completed!</span>
                    </div>
                  ) : isLocked ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Lock className="w-5 h-5" />
                      <span className="text-sm">Complete prerequisites to unlock</span>
                    </div>
                  ) : isInProgress ? (
                    <button
                      onClick={() => handleCompleteQuest(quest)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                    >
                      Claim Rewards
                    </button>
                  ) : quest.quest_type === 'social_engagement' ? (
                    <button
                      onClick={() => handleSocialQuest(quest)}
                      disabled={loading}
                      className="px-4 py-2 bg-[#D2A44C] text-white rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
                    >
                      Complete Quest
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStartQuest(quest)}
                      disabled={loading}
                      className="px-4 py-2 bg-[#D2A44C] text-white rounded-lg hover:bg-yellow-600 transition-all disabled:opacity-50"
                    >
                      Start Quest
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Quests Available</h3>
          <p className="text-gray-400">Check back later for new quests!</p>
        </div>
      )}
    </div>
  );
}
