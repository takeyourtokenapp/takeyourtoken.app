import { useState } from 'react';
import {
  User,
  Crown,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
  Lock,
  CheckCircle,
  Star,
  Award,
  BookOpen,
  Target
} from 'lucide-react';

interface AvatarTier {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  requiredXP: number;
  boosts: {
    name: string;
    value: string;
    icon: React.ReactNode;
  }[];
  unlocked: boolean;
  equipped: boolean;
}

export default function Avatars() {
  const [currentXP] = useState(3500);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>('academic');

  const avatarTiers: AvatarTier[] = [
    {
      id: 'worker',
      name: 'Worker Owl',
      icon: <User className="w-12 h-12" />,
      color: 'from-gray-400 to-gray-600',
      description: 'The foundation of every great empire starts with dedicated workers.',
      requiredXP: 0,
      boosts: [
        { name: 'Base Mining Rate', value: '+0%', icon: <Zap className="w-4 h-4" /> },
        { name: 'Daily Rewards', value: 'Standard', icon: <Star className="w-4 h-4" /> }
      ],
      unlocked: true,
      equipped: false
    },
    {
      id: 'academic',
      name: 'Academic Owl',
      icon: <BookOpen className="w-12 h-12" />,
      color: 'from-blue-400 to-blue-600',
      description: 'Knowledge is power. Scholars who master the academy unlock wisdom bonuses.',
      requiredXP: 1000,
      boosts: [
        { name: 'Academy XP Bonus', value: '+10%', icon: <BookOpen className="w-4 h-4" /> },
        { name: 'Quiz Rewards', value: '+15%', icon: <Target className="w-4 h-4" /> },
        { name: 'Certificate Value', value: '+5%', icon: <Award className="w-4 h-4" /> }
      ],
      unlocked: true,
      equipped: true
    },
    {
      id: 'diplomat',
      name: 'Diplomat Owl',
      icon: <Shield className="w-12 h-12" />,
      color: 'from-green-400 to-emerald-600',
      description: 'Masters of negotiation. Diplomats enjoy better marketplace deals.',
      requiredXP: 5000,
      boosts: [
        { name: 'Marketplace Fees', value: '-10%', icon: <TrendingUp className="w-4 h-4" /> },
        { name: 'Referral Bonus', value: '+20%', icon: <User className="w-4 h-4" /> },
        { name: 'Trade Volume Limit', value: '+25%', icon: <Zap className="w-4 h-4" /> }
      ],
      unlocked: false,
      equipped: false
    },
    {
      id: 'peacekeeper',
      name: 'Peacekeeper Owl',
      icon: <Crown className="w-12 h-12" />,
      color: 'from-amber-400 to-orange-600',
      description: 'Guardians of the realm. Peacekeepers enjoy governance privileges.',
      requiredXP: 15000,
      boosts: [
        { name: 'Governance Weight', value: '+25%', icon: <Crown className="w-4 h-4" /> },
        { name: 'Proposal Creation', value: 'Unlocked', icon: <Target className="w-4 h-4" /> },
        { name: 'veTYT Multiplier', value: '1.15x', icon: <Lock className="w-4 h-4" /> }
      ],
      unlocked: false,
      equipped: false
    },
    {
      id: 'warrior',
      name: 'Warrior Owl',
      icon: <Sparkles className="w-12 h-12" />,
      color: 'from-red-400 to-rose-600',
      description: 'Elite defenders of TYT. Warriors command the highest rewards and respect.',
      requiredXP: 50000,
      boosts: [
        { name: 'Mining Efficiency', value: '+15%', icon: <Zap className="w-4 h-4" /> },
        { name: 'Maintenance Discount', value: '+5%', icon: <TrendingUp className="w-4 h-4" /> },
        { name: 'Exclusive Events', value: 'Access', icon: <Star className="w-4 h-4" /> },
        { name: 'Priority Support', value: '24/7', icon: <Shield className="w-4 h-4" /> }
      ],
      unlocked: false,
      equipped: false
    }
  ];

  const getProgressToNext = () => {
    const currentTierIndex = avatarTiers.findIndex(t => !t.unlocked);
    if (currentTierIndex === -1) return 100;
    const nextTier = avatarTiers[currentTierIndex];
    const prevTier = avatarTiers[currentTierIndex - 1];
    const prevXP = prevTier?.requiredXP || 0;
    const progress = ((currentXP - prevXP) / (nextTier.requiredXP - prevXP)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-400" />
            Owl Avatars
          </h1>
          <p className="text-gray-400 mt-1">Unlock powerful boosts by leveling up your avatar</p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl px-6 py-3 border border-gray-700">
          <div className="text-sm text-gray-400">Your XP</div>
          <div className="text-2xl font-bold text-amber-400">{currentXP.toLocaleString()} XP</div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-300">Progress to Next Tier</span>
          <span className="text-sm text-amber-400 font-semibold">{getProgressToNext().toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${getProgressToNext()}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Current: {currentXP.toLocaleString()} XP</span>
          <span>Next: {avatarTiers.find(t => !t.unlocked)?.requiredXP.toLocaleString() || 'Max'} XP</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {avatarTiers.map((avatar) => (
          <div
            key={avatar.id}
            className={`relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border transition-all ${
              avatar.equipped
                ? 'border-amber-500 ring-2 ring-amber-500/30'
                : avatar.unlocked
                ? 'border-gray-700 hover:border-gray-600 cursor-pointer'
                : 'border-gray-700/50 opacity-75'
            }`}
            onClick={() => avatar.unlocked && setSelectedAvatar(avatar.id)}
          >
            {avatar.equipped && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-xs font-bold rounded-full">
                EQUIPPED
              </div>
            )}

            {!avatar.unlocked && (
              <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <Lock className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-400">
                    Requires {avatar.requiredXP.toLocaleString()} XP
                  </div>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center mb-4 text-white`}>
                {avatar.icon}
              </div>

              <h3 className="text-xl font-bold text-center mb-2">{avatar.name}</h3>
              <p className="text-sm text-gray-400 text-center mb-4">{avatar.description}</p>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Perks & Boosts
                </div>
                {avatar.boosts.map((boost, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 bg-gray-900/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <span className="text-amber-400">{boost.icon}</span>
                      {boost.name}
                    </div>
                    <span className="text-sm font-bold text-green-400">{boost.value}</span>
                  </div>
                ))}
              </div>

              {avatar.unlocked && !avatar.equipped && (
                <button
                  className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all"
                >
                  Equip Avatar
                </button>
              )}

              {avatar.equipped && (
                <div className="w-full mt-4 py-3 bg-gray-700 text-center text-gray-300 font-semibold rounded-lg flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Currently Active
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400" />
          How to Earn XP
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400 mb-1">+50 XP</div>
            <div className="text-sm text-gray-300">Daily Login</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400 mb-1">+100 XP</div>
            <div className="text-sm text-gray-300">Complete Academy Lesson</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400 mb-1">+250 XP</div>
            <div className="text-sm text-gray-300">Marketplace Trade</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-pink-400 mb-1">+500 XP</div>
            <div className="text-sm text-gray-300">Refer a Friend</div>
          </div>
        </div>
      </div>
    </div>
  );
}
