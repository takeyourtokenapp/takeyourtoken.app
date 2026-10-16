import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Target, CheckCircle, Clock, Award, Star, TrendingUp, Repeat, Zap } from 'lucide-react';

interface Quest {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  quest_type: string;
  required_action: string | null;
  required_amount: number | null;
  xp_reward: number;
  tyt_reward: number;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  is_repeatable: boolean;
  min_owl_rank: number;
}

interface QuestCompletion {
  id: string;
  quest_id: string;
  status: string;
  completed_at: string | null;
  xp_claimed: number;
  tyt_claimed: number;
}

export default function Quests() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [completions, setCompletions] = useState<Map<string, QuestCompletion>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed' | 'in_progress'>('all');
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [questsRes, completionsRes] = await Promise.all([
        supabase.from('academy_quests').select('*').eq('is_active', true).order('xp_reward', { ascending: false }),
        user
          ? supabase.from('academy_quest_completions').select('*').eq('user_id', user.id)
          : Promise.resolve({ data: null, error: null })
      ]);

      if (questsRes.error) throw questsRes.error;
      setQuests(questsRes.data || []);

      const compMap = new Map<string, QuestCompletion>();
      (completionsRes.data || []).forEach((c: QuestCompletion) => compMap.set(c.quest_id, c));
      setCompletions(compMap);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaim(questId: string) {
    if (!user) return;
    setClaiming(questId);
    try {
      const quest = quests.find(q => q.id === questId);
      if (!quest) return;

      const { error } = await supabase.from('academy_quest_completions').upsert({
        user_id: user.id,
        quest_id: questId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        xp_claimed: quest.xp_reward,
        tyt_claimed: quest.tyt_reward
      }, { onConflict: 'user_id,quest_id' });

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Failed to claim quest:', error);
    } finally {
      setClaiming(null);
    }
  }

  function getQuestStatus(questId: string): string {
    const comp = completions.get(questId);
    return comp?.status || 'available';
  }

  const filteredQuests = quests.filter(q => {
    const status = getQuestStatus(q.id);
    if (filter === 'all') return true;
    if (filter === 'available') return status === 'available';
    if (filter === 'completed') return status === 'completed';
    if (filter === 'in_progress') return status === 'in_progress';
    return true;
  });

  const completedCount = quests.filter(q => getQuestStatus(q.id) === 'completed').length;
  const totalXP = quests.reduce((s, q) => s + q.xp_reward, 0);
  const earnedXP = quests.filter(q => getQuestStatus(q.id) === 'completed').reduce((s, q) => s + q.xp_reward, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Target className="w-8 h-8 text-gold-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Quest System</h1>
        <p className="text-tertiary-text">Complete quests to earn XP, TYT tokens, and unlock exclusive rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gold-500/20 to-amber-500/20 rounded-xl p-6 border border-gold-500/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-secondary-text">Total Quests</span>
            <Target className="w-5 h-5 text-gold-400" />
          </div>
          <div className="text-3xl font-bold text-gold-400">{quests.length}</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">Completed</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400">{completedCount}</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">XP Earned</span>
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">{earnedXP.toLocaleString()}</div>
          <div className="text-xs text-tertiary-text mt-1">of {totalXP.toLocaleString()} total</div>
        </div>
        <div className="bg-secondary rounded-xl p-6 border border-secondary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-tertiary-text">TYT Rewards</span>
            <Award className="w-5 h-5 text-pink-400" />
          </div>
          <div className="text-3xl font-bold text-pink-400">
            {quests.filter(q => getQuestStatus(q.id) === 'completed').reduce((s, q) => s + parseFloat(String(q.tyt_reward)), 0).toFixed(0)}
          </div>
          <div className="text-xs text-tertiary-text mt-1">TYT claimed</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'available', 'in_progress', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === f ? 'bg-gold-500 text-navy-900' : 'bg-tertiary text-tertiary-text hover:bg-secondary'
            }`}
          >
            {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {filteredQuests.length === 0 ? (
        <div className="bg-secondary rounded-xl p-12 border border-secondary text-center">
          <Target className="w-16 h-16 text-tertiary-text mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Quests Found</h3>
          <p className="text-tertiary-text">
            {filter === 'completed' ? 'You have not completed any quests yet' : 'No quests match your current filter'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredQuests.map(quest => {
            const status = getQuestStatus(quest.id);
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in_progress';

            return (
              <div
                key={quest.id}
                className={`bg-secondary rounded-xl p-6 border transition-all ${
                  isCompleted ? 'border-green-500/50' : isInProgress ? 'border-amber-500/50' : 'border-secondary hover:border-gold-500/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: quest.color ? `${quest.color}20` : 'rgba(210,164,76,0.2)', color: quest.color || '#D2A44C' }}
                    >
                      {quest.icon || 'T'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{quest.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-tertiary-text">
                        <span className="capitalize">{quest.quest_type.replace(/_/g, ' ')}</span>
                        {quest.is_repeatable && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <Repeat size={10} /> Repeatable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isCompleted && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {isInProgress && <Clock className="w-6 h-6 text-amber-400" />}
                </div>

                {quest.description && <p className="text-sm text-tertiary-text mb-4">{quest.description}</p>}

                {quest.required_action && (
                  <div className="text-sm text-secondary-text mb-3">
                    <span className="text-tertiary-text">Objective: </span>
                    {quest.required_action}
                    {quest.required_amount && ` (${quest.required_amount})`}
                  </div>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-sm">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-blue-400">+{quest.xp_reward} XP</span>
                  </div>
                  {parseFloat(String(quest.tyt_reward)) > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Award className="w-4 h-4 text-pink-400" />
                      <span className="font-bold text-pink-400">+{parseFloat(String(quest.tyt_reward))} TYT</span>
                    </div>
                  )}
                  {quest.min_owl_rank > 1 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-gold-400" />
                      <span className="text-gold-400">Rank {quest.min_owl_rank}+</span>
                    </div>
                  )}
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => handleClaim(quest.id)}
                    disabled={claiming === quest.id}
                    className="w-full py-3 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-navy-900 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {claiming === quest.id ? (
                      <><div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" /> Claiming...</>
                    ) : (
                      <><TrendingUp size={18} /> Mark as Complete</>
                    )}
                  </button>
                )}
                {isCompleted && (
                  <div className="w-full py-3 bg-green-500/20 text-green-400 font-bold rounded-xl text-center flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Quest Completed
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
