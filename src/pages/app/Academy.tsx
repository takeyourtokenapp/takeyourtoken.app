import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Lock,
  CheckCircle2,
  Play,
  Trophy,
  Target,
  X,
  ChevronRight,
  Clock,
  Users,
  Star,
  Filter,
  Search
} from 'lucide-react';
import type { AcademyTrack, AcademyLesson } from '../../types/database';
import AcademyQuiz from '../../components/AcademyQuiz';
import AcademyProgressTracker from '../../components/AcademyProgressTracker';

interface TrackWithProgress extends AcademyTrack {
  lessons_count: number;
  completed_count: number;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

type ModalType = 'track' | 'lesson' | 'quiz' | 'leaderboard' | 'certificates' | null;
type TabType = 'tracks' | 'progress';

export default function Academy() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<TrackWithProgress[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [owlRank, setOwlRank] = useState<'worker' | 'academic' | 'diplomat' | 'peacekeeper' | 'warrior'>('worker');
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('tracks');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackWithProgress | null>(null);
  const [trackLessons, setTrackLessons] = useState<AcademyLesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | '1' | '2' | '3'>('all');

  useEffect(() => {
    if (user) {
      loadAcademyData();
    }
  }, [user]);

  const loadAcademyData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [profileRes, tracksRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('rank_score, owl_rank')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('academy_tracks')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true })
      ]);

      if (profileRes.data) {
        setUserXP(profileRes.data.rank_score);
        setOwlRank(profileRes.data.owl_rank);
      }

      if (tracksRes.data) {
        const tracksWithProgress: TrackWithProgress[] = await Promise.all(
          tracksRes.data.map(async (track) => {
            const { count: lessonsCount } = await supabase
              .from('academy_lessons')
              .select('*', { count: 'exact', head: true })
              .eq('track_id', track.id)
              .eq('is_published', true);

            const { count: completedCount } = await supabase
              .from('academy_user_progress')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('completed', true);

            return {
              ...track,
              lessons_count: lessonsCount || 0,
              completed_count: completedCount || 0
            };
          })
        );

        setTracks(tracksWithProgress);
      }
    } catch (error) {
      console.error('Error loading academy:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrackLessons = async (trackId: string) => {
    const { data } = await supabase
      .from('academy_lessons')
      .select('*')
      .eq('track_id', trackId)
      .eq('is_published', true)
      .order('lesson_order', { ascending: true });

    if (data) setTrackLessons(data);
  };

  const handleTrackClick = async (track: TrackWithProgress) => {
    setSelectedTrack(track);
    await loadTrackLessons(track.id);
    setActiveModal('track');
  };

  const handleLessonClick = async (lesson: AcademyLesson) => {
    setSelectedLesson(lesson);
    setActiveModal('lesson');

    const { data: questions } = await supabase
      .from('academy_quiz_questions')
      .select('*')
      .eq('lesson_id', lesson.id)
      .order('display_order', { ascending: true });

    if (questions && questions.length > 0) {
      setQuizQuestions(questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options as string[],
        correct_answer_index: q.correct_answer_index,
        explanation: q.explanation || ''
      })));
    }
  };

  const handleStartQuiz = () => {
    if (quizQuestions.length > 0) {
      setActiveModal('quiz');
    } else {
      alert('No quiz available for this lesson yet.');
    }
  };

  const handleQuizComplete = async (score: number, xpEarned: number) => {
    if (!user || !selectedLesson) return;

    try {
      await supabase
        .from('academy_quiz_attempts')
        .insert({
          user_id: user.id,
          lesson_id: selectedLesson.id,
          score,
          xp_earned: xpEarned,
          answers: [],
          completed_at: new Date().toISOString()
        });

      await supabase.rpc('add_user_xp', {
        p_user_id: user.id,
        p_xp_amount: xpEarned
      });

      loadAcademyData();
    } catch (error) {
      console.error('Error saving quiz results:', error);
      throw error;
    }
  };

  const getOwlRankInfo = (rank: string) => {
    const ranks = {
      worker: { emoji: '🦉', name: 'Worker', xp: '0-99', color: 'text-gray-400' },
      academic: { emoji: '📚', name: 'Academic', xp: '100-299', color: 'text-blue-400' },
      diplomat: { emoji: '🤝', name: 'Diplomat', xp: '300-699', color: 'text-purple-400' },
      peacekeeper: { emoji: '🛡️', name: 'Peacekeeper', xp: '700-1,499', color: 'text-green-400' },
      warrior: { emoji: '⚔️', name: 'Warrior', xp: '1,500+', color: 'text-amber-400' }
    };
    return ranks[rank as keyof typeof ranks] || ranks.worker;
  };

  const filteredTracks = tracks.filter(track => {
    if (filterLevel !== 'all' && track.difficulty_level !== parseInt(filterLevel)) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        track.title.toLowerCase().includes(search) ||
        track.description.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const currentRank = getOwlRankInfo(owlRank);
  const nextRankXP = owlRank === 'worker' ? 100 : owlRank === 'academic' ? 300 : owlRank === 'diplomat' ? 700 : owlRank === 'peacekeeper' ? 1500 : 9999;
  const xpProgress = owlRank === 'warrior' ? 100 : (userXP / nextRankXP) * 100;

  const totalLessonsCompleted = tracks.reduce((sum, t) => sum + t.completed_count, 0);
  const totalLessons = tracks.reduce((sum, t) => sum + t.lessons_count, 0);
  const tracksStarted = tracks.filter(t => t.completed_count > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-400">Loading academy...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Crypto Academia</h1>
          <p className="text-gray-400">Learn blockchain technology and earn XP rewards</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveModal('leaderboard')}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-2"
          >
            <Trophy size={18} />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveModal('certificates')}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-all flex items-center gap-2"
          >
            <Award size={18} />
            Certificates
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('tracks')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'tracks'
              ? 'text-gold-400 border-b-2 border-gold-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen size={18} />
            Learning Tracks
          </div>
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === 'progress'
              ? 'text-gold-400 border-b-2 border-gold-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target size={18} />
            Progress & Achievements
          </div>
        </button>
      </div>

      {activeTab === 'progress' ? (
        <AcademyProgressTracker />
      ) : (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-8 border border-amber-500/50">
          <div className="flex items-center gap-4 mb-6">
            <div className="text-6xl">{currentRank.emoji}</div>
            <div className="flex-1">
              <div className="text-sm text-gray-300 mb-1">Current Owl Rank</div>
              <div className={`text-3xl font-bold ${currentRank.color}`}>
                {currentRank.name}
              </div>
              <div className="text-sm text-gray-400">{currentRank.xp} XP Range</div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-amber-400">{userXP}</div>
              <div className="text-sm text-gray-300">Total XP</div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Progress to next rank</span>
              <span className="font-semibold text-amber-400">{owlRank === 'warrior' ? 'Max Rank Achieved!' : `${userXP} / ${nextRankXP} XP`}</span>
            </div>
            <div className="h-4 bg-gray-800/50 rounded-full overflow-hidden border border-amber-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Your Progress
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tracks Started</span>
              <span className="text-xl font-bold text-amber-400">{tracksStarted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Lessons Completed</span>
              <span className="text-xl font-bold text-green-400">{totalLessonsCompleted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total XP Earned</span>
              <span className="text-xl font-bold text-blue-400">{userXP}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Completion Rate</span>
              <span className="text-xl font-bold text-purple-400">
                {totalLessons > 0 ? Math.round((totalLessonsCompleted / totalLessons) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-amber-400" />
          All Owl Ranks
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(['worker', 'academic', 'diplomat', 'peacekeeper', 'warrior'] as const).map((rank, index) => {
            const info = getOwlRankInfo(rank);
            const rankIndex = ['worker', 'academic', 'diplomat', 'peacekeeper', 'warrior'].indexOf(owlRank);
            const isCurrentOrPast = rankIndex >= index;
            const isCurrent = owlRank === rank;

            return (
              <div
                key={rank}
                className={`p-4 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500 ring-2 ring-amber-500/50'
                    : isCurrentOrPast
                    ? 'bg-gray-800/50 border-gray-600'
                    : 'bg-gray-900 border-gray-700 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{info.emoji}</div>
                <div className={`font-bold mb-1 ${info.color}`}>{info.name}</div>
                <div className="text-xs text-gray-500">{info.xp}</div>
                {isCurrent && (
                  <div className="mt-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                      <CheckCircle2 size={12} />
                      Current
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks..."
                className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1 - Beginner</option>
              <option value="2">Level 2 - Intermediate</option>
              <option value="3">Level 3 - Advanced</option>
            </select>
          </div>

          {(searchQuery || filterLevel !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterLevel('all');
              }}
              className="self-start px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredTracks.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-12 border border-gray-700 text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Tracks Found</h3>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-6">Learning Tracks</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTracks.map((track) => {
              const progress = track.lessons_count > 0 ? (track.completed_count / track.lessons_count) * 100 : 0;
              const isLocked = track.difficulty_level > 1 && userXP < (track.difficulty_level - 1) * 100;

              return (
                <div
                  key={track.id}
                  className={`group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border transition-all ${
                    isLocked
                      ? 'border-gray-700 opacity-60'
                      : 'border-gray-700 hover:border-amber-500/50 cursor-pointer'
                  }`}
                  onClick={() => !isLocked && handleTrackClick(track)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 flex items-center gap-2 group-hover:text-amber-400 transition-colors">
                        {track.title}
                        {isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">{track.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                          Level {track.difficulty_level}
                        </div>
                        <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Clock size={12} />
                          {track.estimated_hours}h
                        </div>
                        <div className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs font-semibold flex items-center gap-1">
                          <BookOpen size={12} />
                          {track.lessons_count} lessons
                        </div>
                      </div>
                    </div>
                    <GraduationCap className="w-8 h-8 text-amber-400 flex-shrink-0" />
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-semibold">{track.completed_count} / {track.lessons_count}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrackClick(track);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLocked ? (
                      <>
                        <Lock size={20} />
                        Requires {(track.difficulty_level - 1) * 100} XP
                      </>
                    ) : progress > 0 ? (
                      <>
                        <Play size={20} />
                        Continue Learning
                      </>
                    ) : (
                      <>
                        <BookOpen size={20} />
                        Start Track
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" />
          How to Earn XP
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-amber-400 font-bold text-xl mb-2">10-50 XP</div>
            <div className="font-semibold mb-1">Complete Lessons</div>
            <div className="text-sm text-gray-400">Watch videos and read content</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-green-400 font-bold text-xl mb-2">20-100 XP</div>
            <div className="font-semibold mb-1">Pass Quizzes</div>
            <div className="text-sm text-gray-400">Test your knowledge</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="text-blue-400 font-bold text-xl mb-2">50-200 XP</div>
            <div className="font-semibold mb-1">Complete Tracks</div>
            <div className="text-sm text-gray-400">Finish entire learning paths</div>
          </div>
        </div>
      </div>

      {activeModal === 'track' && selectedTrack && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-amber-400" />
                <h3 className="text-2xl font-bold">{selectedTrack.title}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-400 mb-6">{selectedTrack.description}</p>

            <div className="flex items-center gap-4 mb-6">
              <div className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg font-semibold">
                Level {selectedTrack.difficulty_level}
              </div>
              <div className="px-4 py-2 bg-gray-800 rounded-lg">
                <span className="text-gray-400">Estimated: </span>
                <span className="font-semibold">{selectedTrack.estimated_hours} hours</span>
              </div>
              <div className="px-4 py-2 bg-gray-800 rounded-lg">
                <span className="text-gray-400">Progress: </span>
                <span className="font-semibold">{selectedTrack.completed_count}/{selectedTrack.lessons_count}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-3">Lessons</h4>
              {trackLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No lessons available yet
                </div>
              ) : (
                trackLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-amber-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold group-hover:text-amber-400 transition-colors">
                            {lesson.title}
                          </div>
                          <div className="text-sm text-gray-400 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {lesson.estimated_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <Award size={14} />
                              {lesson.xp_reward} XP
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-400 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {activeModal === 'lesson' && selectedLesson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{selectedLesson.title}</h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                <Play className="w-16 h-16 text-amber-400" />
              </div>
              <div className="text-gray-300 leading-relaxed">
                {selectedLesson.content_text || 'Lesson content will be displayed here. This would include text, images, code examples, and interactive elements to help you learn.'}
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg font-semibold flex items-center gap-2">
                  <Award size={18} />
                  {selectedLesson.xp_reward} XP
                </div>
                <div className="px-4 py-2 bg-gray-800 rounded-lg flex items-center gap-2">
                  <Clock size={18} className="text-gray-400" />
                  <span>{selectedLesson.estimated_minutes} minutes</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
              >
                Close
              </button>
              {quizQuestions.length > 0 && (
                <button
                  onClick={handleStartQuiz}
                  className="px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg font-semibold hover:bg-blue-500/30 transition-all flex items-center gap-2"
                >
                  <Trophy size={18} />
                  Take Quiz
                </button>
              )}
              <button
                onClick={async () => {
                  if (!user || !selectedLesson) return;

                  try {
                    const { data: existingProgress } = await supabase
                      .from('academy_user_progress')
                      .select('*')
                      .eq('user_id', user.id)
                      .eq('lesson_id', selectedLesson.id)
                      .maybeSingle();

                    if (existingProgress) {
                      if (existingProgress.completed) {
                        alert('You have already completed this lesson!');
                        return;
                      }

                      await supabase
                        .from('academy_user_progress')
                        .update({
                          completed: true,
                          completed_at: new Date().toISOString()
                        })
                        .eq('id', existingProgress.id);
                    } else {
                      await supabase
                        .from('academy_user_progress')
                        .insert({
                          user_id: user.id,
                          lesson_id: selectedLesson.id,
                          track_id: selectedLesson.track_id,
                          completed: true,
                          completed_at: new Date().toISOString()
                        });
                    }

                    await supabase.rpc('add_user_xp', {
                      p_user_id: user.id,
                      p_xp_amount: selectedLesson.xp_reward
                    });

                    setActiveModal(null);
                    loadAcademyData();
                    alert(`Lesson completed! You earned ${selectedLesson.xp_reward} XP!`);
                  } catch (error) {
                    console.error('Error completing lesson:', error);
                    alert('Failed to complete lesson. Please try again.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/50 transition-all"
              >
                Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'leaderboard' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                XP Leaderboard
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: 'CryptoMaster', xp: 2450, owl: 'warrior' },
                { rank: 2, name: 'BlockchainPro', xp: 1890, owl: 'warrior' },
                { rank: 3, name: 'MiningExpert', xp: 1230, owl: 'peacekeeper' },
                { rank: 4, name: 'TokenWizard', xp: 980, owl: 'peacekeeper' },
                { rank: 5, name: 'You', xp: userXP, owl: owlRank }
              ].map((entry) => (
                <div
                  key={entry.rank}
                  className={`bg-gray-800/50 rounded-lg p-4 flex items-center justify-between ${
                    entry.name === 'You' ? 'border-2 border-amber-500' : 'border border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                      entry.rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                      entry.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      #{entry.rank}
                    </div>
                    <div>
                      <div className="font-semibold">{entry.name}</div>
                      <div className="text-sm text-gray-400">{getOwlRankInfo(entry.owl).name}</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-amber-400">{entry.xp} XP</div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full mt-6 px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {activeModal === 'quiz' && selectedLesson && quizQuestions.length > 0 && (
        <AcademyQuiz
          lessonId={selectedLesson.id}
          lessonTitle={selectedLesson.title}
          questions={quizQuestions.map(q => ({
            id: q.id,
            question: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer_index,
            explanation: q.explanation
          }))}
          xpReward={selectedLesson.xp_reward * 2}
          onComplete={handleQuizComplete}
          onClose={() => {
            setActiveModal('lesson');
            setQuizQuestions([]);
          }}
        />
      )}

      {activeModal === 'certificates' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6 text-green-400" />
                Your Certificates
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2">No Certificates Yet</h4>
              <p className="text-gray-400">
                Complete learning tracks to earn certificates and showcase your achievements
              </p>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full px-4 py-3 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
