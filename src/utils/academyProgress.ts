import { supabase } from '../lib/supabase';

export type AcademyRank = 'worker' | 'academic' | 'diplomat' | 'peacekeeper' | 'warrior';

export interface LessonProgress {
  lessonId: string;
  title: string;
  trackId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  quizScore: number | null;
  completedAt: string | null;
  xpEarned: number;
}

export interface TrackProgress {
  trackId: string;
  trackName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  totalXp: number;
  earnedXp: number;
  isCompleted: boolean;
  certificateId: string | null;
}

export interface AcademyProfile {
  userId: string;
  currentRank: AcademyRank;
  totalXp: number;
  lessonsCompleted: number;
  tracksCompleted: number;
  certificatesEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  rankProgress: number;
  nextRank: AcademyRank | null;
  xpToNextRank: number;
}

const RANK_THRESHOLDS: Record<AcademyRank, { minXp: number; maxXp: number }> = {
  worker: { minXp: 0, maxXp: 499 },
  academic: { minXp: 500, maxXp: 1999 },
  diplomat: { minXp: 2000, maxXp: 4999 },
  peacekeeper: { minXp: 5000, maxXp: 9999 },
  warrior: { minXp: 10000, maxXp: Infinity }
};

const RANK_ORDER: AcademyRank[] = ['worker', 'academic', 'diplomat', 'peacekeeper', 'warrior'];

export function getRankFromXp(xp: number): AcademyRank {
  for (const rank of [...RANK_ORDER].reverse()) {
    if (xp >= RANK_THRESHOLDS[rank].minXp) {
      return rank;
    }
  }
  return 'worker';
}

export function getNextRank(currentRank: AcademyRank): AcademyRank | null {
  const currentIndex = RANK_ORDER.indexOf(currentRank);
  if (currentIndex < RANK_ORDER.length - 1) {
    return RANK_ORDER[currentIndex + 1];
  }
  return null;
}

export function getRankProgress(xp: number, currentRank: AcademyRank): number {
  const threshold = RANK_THRESHOLDS[currentRank];
  if (threshold.maxXp === Infinity) return 100;

  const rangeSize = threshold.maxXp - threshold.minXp + 1;
  const progressInRange = xp - threshold.minXp;
  return Math.min(100, (progressInRange / rangeSize) * 100);
}

export function getXpToNextRank(xp: number, currentRank: AcademyRank): number {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) return 0;
  return RANK_THRESHOLDS[nextRank].minXp - xp;
}

export async function getUserAcademyProfile(userId: string): Promise<AcademyProfile | null> {
  const { data: progress, error } = await supabase
    .from('user_lesson_progress')
    .select(`
      *,
      academy_lessons(title, track_id, xp_reward)
    `)
    .eq('user_id', userId);

  if (error) throw error;

  const completedLessons = (progress || []).filter(p => p.completed_at !== null);
  const totalXp = completedLessons.reduce((sum, p) => {
    return sum + (p.academy_lessons?.xp_reward || 0);
  }, 0);

  const uniqueTracks = new Set(completedLessons.map(p => p.academy_lessons?.track_id));

  const { data: certificates } = await supabase
    .from('academy_certificates')
    .select('id')
    .eq('user_id', userId);

  const { data: streakData } = await supabase
    .from('academy_streaks')
    .select('current_streak, longest_streak, last_activity')
    .eq('user_id', userId)
    .maybeSingle();

  const currentRank = getRankFromXp(totalXp);
  const nextRank = getNextRank(currentRank);

  return {
    userId,
    currentRank,
    totalXp,
    lessonsCompleted: completedLessons.length,
    tracksCompleted: uniqueTracks.size,
    certificatesEarned: certificates?.length || 0,
    currentStreak: streakData?.current_streak || 0,
    longestStreak: streakData?.longest_streak || 0,
    lastActivityDate: streakData?.last_activity || null,
    rankProgress: getRankProgress(totalXp, currentRank),
    nextRank,
    xpToNextRank: getXpToNextRank(totalXp, currentRank)
  };
}

export async function getUserLessonProgress(userId: string): Promise<LessonProgress[]> {
  const { data: allLessons } = await supabase
    .from('academy_lessons')
    .select('id, title, track_id, xp_reward')
    .eq('is_published', true)
    .order('order_index');

  const { data: userProgress } = await supabase
    .from('user_lesson_progress')
    .select('*')
    .eq('user_id', userId);

  const progressMap = new Map(
    (userProgress || []).map(p => [p.lesson_id, p])
  );

  return (allLessons || []).map(lesson => {
    const progress = progressMap.get(lesson.id);

    return {
      lessonId: lesson.id,
      title: lesson.title,
      trackId: lesson.track_id,
      status: progress?.completed_at ? 'completed' : progress ? 'in_progress' : 'not_started',
      progress: progress?.progress_percent || 0,
      quizScore: progress?.quiz_score || null,
      completedAt: progress?.completed_at || null,
      xpEarned: progress?.completed_at ? lesson.xp_reward : 0
    };
  });
}

export async function getTrackProgress(userId: string): Promise<TrackProgress[]> {
  const { data: tracks } = await supabase
    .from('academy_tracks')
    .select(`
      id,
      name,
      academy_lessons(id, xp_reward)
    `)
    .eq('is_active', true);

  const { data: userProgress } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  const { data: certificates } = await supabase
    .from('academy_certificates')
    .select('track_id, id')
    .eq('user_id', userId);

  const completedLessonIds = new Set(
    (userProgress || []).map(p => p.lesson_id)
  );

  const certificateMap = new Map(
    (certificates || []).map(c => [c.track_id, c.id])
  );

  return (tracks || []).map(track => {
    const lessons = track.academy_lessons || [];
    const completedLessons = lessons.filter(l => completedLessonIds.has(l.id));
    const totalXp = lessons.reduce((sum, l) => sum + (l.xp_reward || 0), 0);
    const earnedXp = completedLessons.reduce((sum, l) => sum + (l.xp_reward || 0), 0);

    return {
      trackId: track.id,
      trackName: track.name,
      totalLessons: lessons.length,
      completedLessons: completedLessons.length,
      progressPercent: lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0,
      totalXp,
      earnedXp,
      isCompleted: completedLessons.length === lessons.length && lessons.length > 0,
      certificateId: certificateMap.get(track.id) || null
    };
  });
}

export async function completeLesson(
  userId: string,
  lessonId: string,
  quizScore?: number
): Promise<{ success: boolean; xpEarned: number; newRank?: AcademyRank }> {
  const { data: lesson } = await supabase
    .from('academy_lessons')
    .select('xp_reward, title, track_id')
    .eq('id', lessonId)
    .single();

  if (!lesson) {
    return { success: false, xpEarned: 0 };
  }

  const { error } = await supabase
    .from('user_lesson_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      progress_percent: 100,
      quiz_score: quizScore,
      completed_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,lesson_id'
    });

  if (error) {
    return { success: false, xpEarned: 0 };
  }

  await updateStreak(userId);

  const profile = await getUserAcademyProfile(userId);
  const previousXp = (profile?.totalXp || 0) - lesson.xp_reward;
  const previousRank = getRankFromXp(previousXp);
  const newRank = profile?.currentRank;

  return {
    success: true,
    xpEarned: lesson.xp_reward,
    newRank: newRank !== previousRank ? newRank : undefined
  };
}

async function updateStreak(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('academy_streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('academy_streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity: today
    });
    return;
  }

  const lastActivity = existing.last_activity;
  const lastDate = new Date(lastActivity);
  const todayDate = new Date(today);
  const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let newStreak = existing.current_streak;
  if (daysDiff === 0) {
    return;
  } else if (daysDiff === 1) {
    newStreak = existing.current_streak + 1;
  } else {
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, existing.longest_streak);

  await supabase
    .from('academy_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_activity: today
    })
    .eq('user_id', userId);
}

export async function claimCertificate(
  userId: string,
  trackId: string
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  const { data: track } = await supabase
    .from('academy_tracks')
    .select(`
      id,
      name,
      academy_lessons(id)
    `)
    .eq('id', trackId)
    .single();

  if (!track) {
    return { success: false, error: 'Track not found' };
  }

  const lessonIds = track.academy_lessons?.map(l => l.id) || [];

  const { data: completed } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
    .not('completed_at', 'is', null);

  if ((completed?.length || 0) < lessonIds.length) {
    return { success: false, error: 'Not all lessons completed' };
  }

  const { data: existingCert } = await supabase
    .from('academy_certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .maybeSingle();

  if (existingCert) {
    return { success: true, certificateId: existingCert.id };
  }

  const { data: cert, error } = await supabase
    .from('academy_certificates')
    .insert({
      user_id: userId,
      track_id: trackId,
      issued_at: new Date().toISOString(),
      certificate_hash: `CERT-${userId.slice(0, 8)}-${trackId.slice(0, 8)}-${Date.now()}`
    })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: 'Failed to issue certificate' };
  }

  return { success: true, certificateId: cert.id };
}

export function getRankBenefits(rank: AcademyRank): string[] {
  const benefits: Record<AcademyRank, string[]> = {
    worker: [
      'Access to basic courses',
      'Community forum access'
    ],
    academic: [
      'All Worker benefits',
      'Access to intermediate courses',
      '5% maintenance discount',
      'Weekly newsletter'
    ],
    diplomat: [
      'All Academic benefits',
      'Access to advanced courses',
      '10% maintenance discount',
      'Priority support',
      'Exclusive webinars'
    ],
    peacekeeper: [
      'All Diplomat benefits',
      'Access to expert courses',
      '15% maintenance discount',
      'Beta feature access',
      'Monthly strategy calls'
    ],
    warrior: [
      'All Peacekeeper benefits',
      'Access to all courses',
      '20% maintenance discount',
      'Direct founder access',
      'Governance voting power boost',
      'Exclusive NFT drops'
    ]
  };

  return benefits[rank];
}
