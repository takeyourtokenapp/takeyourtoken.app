import { useMemo } from 'react';

interface PortfolioChartProps {
  data: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  size?: number;
  showLegend?: boolean;
}

export default function PortfolioChart({ data, size = 200, showLegend = true }: PortfolioChartProps) {
  const { segments, total } = useMemo(() => {
    const totalValue = data.values.reduce((sum, val) => sum + val, 0);
    let currentAngle = -90;

    const segs = data.values.map((value, index) => {
      const percentage = (value / totalValue) * 100;
      const angle = (value / totalValue) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return {
        label: data.labels[index],
        value: value,
        percentage: percentage,
        color: data.colors[index],
        startAngle: startAngle,
        endAngle: currentAngle
      };
    });

    return { segments: segs, total: totalValue };
  }, [data]);

  const createArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(0, 0, radius, endAngle);
    const end = polarToCartesian(0, 0, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', 0, 0,
      'Z'
    ].join(' ');
  };

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  };

  const radius = 40;
  const innerRadius = 25;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox="-50 -50 100 100" className="w-full h-full">
            <g>
              {segments.map((segment, index) => (
                <path
                  key={index}
                  d={createArc(segment.startAngle, segment.endAngle, radius)}
                  fill={segment.color}
                  className="transition-all duration-300 hover:opacity-80"
                  style={{ cursor: 'pointer' }}
                />
              ))}

              <circle
                cx="0"
                cy="0"
                r={innerRadius}
                fill="rgb(17, 24, 39)"
              />
            </g>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-lg font-bold">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-gray-300">{segment.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  ${segment.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SimplePieChart({ percentage, color = '#10B981', size = 80 }: {
  percentage: number;
  color?: string;
  size?: number;
}) {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="3"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}
