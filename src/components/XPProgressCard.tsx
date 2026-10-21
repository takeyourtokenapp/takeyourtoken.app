import { Award, TrendingUp, Target, Star, Zap } from 'lucide-react';

interface XPProgressCardProps {
  currentXP: number;
  currentRank: {
    name: string;
    icon: string;
    minXP: number;
    maxXP: number;
    color: string;
    benefits: string[];
  };
  nextRank?: {
    name: string;
    icon: string;
    minXP: number;
    color: string;
  };
}

const owlRanks = [
  {
    name: 'Worker Owl',
    icon: '🦉',
    minXP: 0,
    maxXP: 99,
    color: 'from-gray-600 to-gray-800',
    borderColor: 'border-gray-600',
    benefits: ['Academy access', 'Basic lessons', 'Community forum']
  },
  {
    name: 'Academic Owl',
    icon: '📚',
    minXP: 100,
    maxXP: 299,
    color: 'from-blue-600 to-blue-800',
    borderColor: 'border-blue-600',
    benefits: ['+2% maintenance discount', 'Advanced lessons', 'Priority forum']
  },
  {
    name: 'Diplomat Owl',
    icon: '🤝',
    minXP: 300,
    maxXP: 699,
    color: 'from-purple-600 to-purple-800',
    borderColor: 'border-purple-600',
    benefits: ['Priority support', 'Expert lessons', 'Exclusive events']
  },
  {
    name: 'Peacekeeper Owl',
    icon: '🛡️',
    minXP: 700,
    maxXP: 1499,
    color: 'from-amber-600 to-amber-800',
    borderColor: 'border-amber-600',
    benefits: ['Early feature access', 'Beta testing', 'VIP lounge']
  },
  {
    name: 'Warrior Owl',
    icon: '⚔️',
    minXP: 1500,
    maxXP: 999999,
    color: 'from-gold-600 to-gold-800',
    borderColor: 'border-gold-600',
    benefits: ['Governance bonus', 'VIP status', 'Lifetime perks']
  }
];

export default function XPProgressCard({ currentXP, currentRank, nextRank }: XPProgressCardProps) {
  const xpInCurrentRank = currentXP - currentRank.minXP;
  const xpNeededForNextRank = nextRank ? nextRank.minXP - currentXP : 0;
  const xpRangeInCurrentRank = currentRank.maxXP - currentRank.minXP + 1;
  const progressPercent = Math.min((xpInCurrentRank / xpRangeInCurrentRank) * 100, 100);

  const recentAchievements = [
    { title: 'First Lesson Complete', xp: 10, icon: Star },
    { title: 'Quiz Master', xp: 20, icon: Award },
    { title: 'Week Streak', xp: 50, icon: Zap },
  ];

  return (
    <div className="bg-gradient-to-br from-owl-slate via-gray-900 to-black border-2 border-gold-700 rounded-2xl overflow-hidden shadow-gold-glow">
      <div className={`bg-gradient-to-r ${currentRank.color} p-6 border-b-2 ${currentRank.borderColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-6xl">{currentRank.icon}</div>
            <div>
              <div className="text-sm text-white/70 mb-1">Your Rank</div>
              <h3 className="text-2xl font-bold text-white">{currentRank.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Award size={16} className="text-white/70" />
                <span className="text-white/90 font-bold">{currentXP.toLocaleString()} XP</span>
              </div>
            </div>
          </div>

          {nextRank && (
            <div className="text-right">
              <div className="text-sm text-white/70 mb-1">Next Rank</div>
              <div className="text-4xl mb-1">{nextRank.icon}</div>
              <div className="text-xs text-white/60">{nextRank.name}</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {nextRank && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-400">Progress to {nextRank.name}</span>
              <span className="text-sm font-bold text-gold-400">
                {xpNeededForNextRank} XP needed
              </span>
            </div>

            <div className="relative">
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500 relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-lg">
                  {progressPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{currentRank.minXP} XP</span>
              <span>{nextRank.minXP} XP</span>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <Star size={18} className="text-gold-400" />
            Your Benefits
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {currentRank.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {recentAchievements.map((achievement, idx) => {
              const Icon = achievement.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-owl-slate/50 rounded-lg border border-gray-700 hover:border-gold-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gold-500/20 rounded-lg">
                      <Icon size={18} className="text-gold-400" />
                    </div>
                    <span className="text-sm font-medium">{achievement.title}</span>
                  </div>
                  <span className="text-gold-400 font-bold text-sm">+{achievement.xp} XP</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-purple-400" />
            <span className="font-semibold text-purple-400">XP Earning Opportunities</span>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Complete lesson:</span>
              <span className="font-semibold text-green-400">+10 XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pass quiz (70%+):</span>
              <span className="font-semibold text-green-400">+20 XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Earn certificate:</span>
              <span className="font-semibold text-green-400">+50 XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Refer a friend:</span>
              <span className="font-semibold text-green-400">+30 XP</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Contribute content:</span>
              <span className="font-semibold text-green-400">+100 XP</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-800">
          <h4 className="font-bold mb-3 text-center">All Ranks</h4>
          <div className="grid grid-cols-5 gap-2">
            {owlRanks.map((rank, idx) => {
              const isUnlocked = currentXP >= rank.minXP;
              const isCurrent = rank.name === currentRank.name;

              return (
                <div
                  key={idx}
                  className={`text-center p-2 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'bg-gold-500/20 border-gold-500 shadow-gold-glow scale-110'
                      : isUnlocked
                      ? 'bg-gray-800 border-gray-600'
                      : 'bg-gray-900 border-gray-800 opacity-50'
                  }`}
                >
                  <div className={`text-3xl mb-1 ${!isUnlocked && 'grayscale'}`}>
                    {rank.icon}
                  </div>
                  <div className="text-xs font-semibold truncate">{rank.name.replace(' Owl', '')}</div>
                  <div className="text-[10px] text-gray-500">{rank.minXP}+ XP</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
