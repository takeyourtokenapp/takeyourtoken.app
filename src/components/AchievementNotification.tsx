import { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import { Achievement } from '../utils/communityService';

interface AchievementNotificationProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export default function AchievementNotification({ achievement, onDismiss }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-cyan-500 border-blue-400',
      green: 'from-green-500 to-emerald-500 border-green-400',
      amber: 'from-amber-500 to-orange-500 border-amber-400',
      gold: 'from-yellow-500 to-amber-600 border-yellow-400',
      purple: 'from-purple-500 to-pink-500 border-purple-400',
      red: 'from-red-500 to-rose-500 border-red-400'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-sm transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-gradient-to-r ${getColorClasses(achievement.color)} p-6 rounded-xl border-2 shadow-2xl backdrop-blur-sm`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl animate-bounce">
              {achievement.icon}
            </div>
          </div>

          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Award size={20} className="animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-wider">Achievement Unlocked!</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{achievement.achievement_name}</h3>
            <p className="text-sm text-white/90">{achievement.achievement_description}</p>
          </div>

          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/60 animate-progress-bar" />
        </div>
      </div>
    </div>
  );
}
