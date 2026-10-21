export function BitcoinIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="18" fill="url(#bitcoin-gradient)" />
      <defs>
        <linearGradient id="bitcoin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7931A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        d="M24 14h-2v-2h-2v2h-2v-2h-2v2h-3v2h1c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1h-1v2h3v2h2v-2h2v2h2v-2h2c2.21 0 4-1.79 4-4 0-1.45-.78-2.72-1.94-3.42A3.99 3.99 0 0 0 24 14zm-4 4v-2h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2zm4 8h-4v-2h4c1.1 0 2 .9 2 2s-.9 2-2 2z"
        fill="white"
      />
    </svg>
  );
}

export function MiningIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="5" y="12" width="30" height="20" rx="2" fill="#1F2937" stroke="#10B981" strokeWidth="1.5" />
      <rect x="8" y="15" width="10" height="7" fill="#10B981" opacity="0.3" />
      <rect x="22" y="15" width="10" height="7" fill="#10B981" opacity="0.3" />
      <line x1="8" y1="27" x2="32" y2="27" stroke="#10B981" strokeWidth="1" />
      <circle cx="11" cy="18" r="1" fill="#10B981" className="animate-pulse" />
      <circle cx="15" cy="18" r="1" fill="#10B981" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
      <circle cx="11" cy="20" r="1" fill="#10B981" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
      <path d="M20 6l3 4h-2v4h-2v-4h-2z" fill="#F59E0B" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 6L30 11V19C30 25 25 30 20 34C15 30 10 25 10 19V11L20 6Z"
        fill="url(#shield-gradient)"
        opacity="0.2"
      />
      <path
        d="M20 8L28 12V18C28 23 24.5 27 20 30C15.5 27 12 23 12 18V12L20 8Z"
        fill="url(#shield-gradient)"
        stroke="#3B82F6"
        strokeWidth="1.5"
      />
      <path
        d="M16 19L18.5 21.5L24 16"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="shield-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function HeartIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 32C14 27 8 22 8 15C8 11 11 8 15 8C17 8 19 9 20 11C21 9 23 8 25 8C29 8 32 11 32 15C32 22 26 27 20 32Z"
        fill="url(#heart-gradient)"
        className="animate-pulse"
      />
      <circle cx="17" cy="14" r="2" fill="white" opacity="0.3" />
      <defs>
        <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function RocketIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 6C20 6 28 10 28 18V24L26 28L20 30L14 28L12 24V18C12 10 20 6 20 6Z"
        fill="url(#rocket-gradient)"
      />
      <ellipse cx="20" cy="16" rx="4" ry="6" fill="#1F2937" />
      <ellipse cx="20" cy="16" rx="2" ry="3" fill="#3B82F6" className="animate-pulse" />
      <path d="M14 28L12 34L16 32L14 28Z" fill="#6B7280" />
      <path d="M26 28L28 34L24 32L26 28Z" fill="#6B7280" />
      <circle cx="20" cy="30" r="2" fill="#F59E0B" className="animate-pulse" />
      <circle cx="17" cy="32" r="1" fill="#F59E0B" opacity="0.5" className="animate-ping" />
      <circle cx="23" cy="32" r="1" fill="#F59E0B" opacity="0.5" className="animate-ping" style={{ animationDelay: '0.3s' }} />
      <defs>
        <linearGradient id="rocket-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4B5563" />
          <stop offset="100%" stopColor="#1F2937" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function GlobeIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="14" stroke="url(#globe-gradient)" strokeWidth="1.5" fill="none" />
      <ellipse cx="20" cy="20" rx="5" ry="14" stroke="url(#globe-gradient)" strokeWidth="1.5" fill="none" />
      <line x1="6" y1="20" x2="34" y2="20" stroke="url(#globe-gradient)" strokeWidth="1.5" />
      <path d="M20 6C22 10 23 15 23 20C23 25 22 30 20 34" stroke="url(#globe-gradient)" strokeWidth="1.5" fill="none" />
      <path d="M20 6C18 10 17 15 17 20C17 25 18 30 20 34" stroke="url(#globe-gradient)" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="20" r="2" fill="#3B82F6" className="animate-pulse" />
      <defs>
        <linearGradient id="globe-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ChartIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="8" y="24" width="4" height="10" fill="#10B981" rx="1" />
      <rect x="14" y="18" width="4" height="16" fill="#3B82F6" rx="1" />
      <rect x="20" y="14" width="4" height="20" fill="#8B5CF6" rx="1" />
      <rect x="26" y="10" width="4" height="24" fill="#F59E0B" rx="1" />
      <path d="M6 8L10 12L16 10L22 6L28 8L34 4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="10" cy="12" r="2" fill="#10B981" />
      <circle cx="22" cy="6" r="2" fill="#10B981" />
      <circle cx="34" cy="4" r="2" fill="#10B981" className="animate-pulse" />
    </svg>
  );
}

export function CommunityIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="12" r="4" fill="url(#community-gradient)" />
      <path d="M20 18C16 18 12 20 12 24V28H28V24C28 20 24 18 20 18Z" fill="url(#community-gradient)" />
      <circle cx="10" cy="14" r="3" fill="url(#community-gradient)" opacity="0.7" />
      <path d="M10 20C7 20 4 21 4 24V26H12V24C12 22 11 21 10 20Z" fill="url(#community-gradient)" opacity="0.7" />
      <circle cx="30" cy="14" r="3" fill="url(#community-gradient)" opacity="0.7" />
      <path d="M30 20C33 20 36 21 36 24V26H28V24C28 22 29 21 30 20Z" fill="url(#community-gradient)" opacity="0.7" />
      <defs>
        <linearGradient id="community-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LightningIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M22 4L10 20H20L18 36L30 20H20L22 4Z"
        fill="url(#lightning-gradient)"
        className="animate-pulse"
      />
      <path
        d="M22 4L10 20H20L18 36L30 20H20L22 4Z"
        stroke="#F59E0B"
        strokeWidth="1.5"
        fill="none"
      />
      <defs>
        <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
    </svg>
  );
}
