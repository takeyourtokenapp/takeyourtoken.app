import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatisticsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export default function StatisticsCard({
  icon,
  label,
  value,
  change,
  changeLabel,
  color = 'blue',
  size = 'md',
  loading = false
}: StatisticsCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20'
    },
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/50',
      text: 'text-green-400',
      glow: 'shadow-green-500/20'
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20'
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/50',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20'
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/50',
      text: 'text-red-400',
      glow: 'shadow-red-500/20'
    }
  };

  const sizeClasses = {
    sm: {
      container: 'p-4',
      icon: 'w-4 h-4',
      iconBox: 'p-2',
      label: 'text-xs',
      value: 'text-lg',
      change: 'text-xs'
    },
    md: {
      container: 'p-6',
      icon: 'w-5 h-5',
      iconBox: 'p-2',
      label: 'text-sm',
      value: 'text-2xl',
      change: 'text-sm'
    },
    lg: {
      container: 'p-8',
      icon: 'w-6 h-6',
      iconBox: 'p-3',
      label: 'text-base',
      value: 'text-3xl',
      change: 'text-base'
    }
  };

  const colors = colorClasses[color];
  const sizes = sizeClasses[size];

  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-4 h-4" />;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-400';
    if (change > 0) return 'text-green-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl ${sizes.container} animate-pulse`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-700 rounded w-24"></div>
          <div className={`${sizes.iconBox} bg-gray-700 rounded-lg ${colors.bg}`}></div>
        </div>
        <div className="h-8 bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-gray-800 to-gray-900 border ${colors.border} rounded-xl ${sizes.container} hover:shadow-lg ${colors.glow} transition-all duration-300 hover:scale-105`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`text-gray-400 ${sizes.label} font-medium uppercase tracking-wide`}>
          {label}
        </div>
        <div className={`${sizes.iconBox} ${colors.bg} rounded-lg border ${colors.border}`}>
          <div className={colors.text}>{icon}</div>
        </div>
      </div>

      <div className={`${sizes.value} font-bold text-white mb-2`}>
        {value}
      </div>

      {(change !== undefined || changeLabel) && (
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span className={`flex items-center gap-1 ${sizes.change} font-semibold ${getTrendColor()}`}>
              {getTrendIcon()}
              {Math.abs(change)}%
            </span>
          )}
          {changeLabel && (
            <span className={`${sizes.change} text-gray-500`}>
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function StatisticsGrid({
  children,
  columns = 4
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {children}
    </div>
  );
}

export function MiniStatCard({
  icon,
  label,
  value,
  color = 'blue'
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}) {
  return (
    <StatisticsCard
      icon={icon}
      label={label}
      value={value}
      color={color}
      size="sm"
    />
  );
}
