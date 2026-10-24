import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'compact';
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * ThreadPilot AI Signature Brand Logo
 * Concept: Interwoven thread paths looping through connected business nodes,
 * forming an architectural T-P monogram with warm brass focal accent.
 */
export const ThreadPilotLogo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'md',
  className = '',
}) => {
  const isDark = theme === 'dark';

  // Size definitions
  const sizeMap = {
    sm: { symbol: 24, text: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { symbol: 32, text: 'text-lg', sub: 'text-[10px]', gap: 'gap-2.5' },
    lg: { symbol: 40, text: 'text-xl', sub: 'text-xs', gap: 'gap-3' },
    xl: { symbol: 52, text: 'text-2xl', sub: 'text-xs', gap: 'gap-3.5' },
  };

  const currentSize = sizeMap[size];

  // SVG Symbol representing interconnected thread loops and intelligent business nodes
  const SymbolSVG = (
    <svg
      width={currentSize.symbol}
      height={currentSize.symbol}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      aria-label="ThreadPilot AI Symbol"
    >
      <defs>
        {/* Navy/Blue thread gradient */}
        <linearGradient id="tp-navy-gradient" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isDark ? '#E2E8F0' : '#142B4A'} />
          <stop offset="100%" stopColor={isDark ? '#94A3B8' : '#2D4B72'} />
        </linearGradient>

        {/* Muted Blue thread path */}
        <linearGradient id="tp-blue-gradient" x1="12" y1="8" x2="36" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5276A5" />
          <stop offset="100%" stopColor="#3D6291" />
        </linearGradient>

        {/* Warm Brass Accent Gradient */}
        <linearGradient id="tp-brass-gradient" x1="28" y1="12" x2="42" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#DFC89F" />
          <stop offset="50%" stopColor="#C6A875" />
          <stop offset="100%" stopColor="#B3925C" />
        </linearGradient>

        {/* Subtle drop shadow */}
        <filter id="tp-glow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor={isDark ? '#000000' : '#142B4A'} floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background container plate with subtle rounded geometry */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill={isDark ? '#142B4A' : '#F8FAFC'}
        stroke={isDark ? '#243B53' : '#E2E8F0'}
        strokeWidth="1.5"
        className="transition-colors duration-200"
      />

      {/* Outer Interwoven Thread Loop: Horizontal & Vertical flow */}
      <path
        d="M12 28C12 20.268 18.268 14 26 14H34C37.3137 14 40 16.6863 40 20C40 23.3137 37.3137 26 34 26H18C14.6863 26 12 28.6863 12 32C12 35.3137 14.6863 38 18 38H32"
        stroke="url(#tp-blue-gradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Monogram Thread Spine: Forms the distinctive 'T' cross & loop */}
      <path
        d="M20 14V34C20 36.2091 21.7909 38 24 38C26.2091 38 28 36.2091 28 34V14"
        stroke="url(#tp-navy-gradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Horizontal Top Thread Bar */}
      <path
        d="M14 14H34"
        stroke="url(#tp-navy-gradient)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Signature Intelligence Node (Warm Brass Accent) */}
      <circle
        cx="34"
        cy="20"
        r="3.5"
        fill="url(#tp-brass-gradient)"
        stroke={isDark ? '#142B4A' : '#FFFFFF'}
        strokeWidth="1.5"
        filter="url(#tp-glow)"
      />

      {/* Connection Flow Node */}
      <circle
        cx="14"
        cy="28"
        r="2"
        fill={isDark ? '#94A3B8' : '#5276A5'}
      />
    </svg>
  );

  if (variant === 'symbol') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{SymbolSVG}</div>;
  }

  return (
    <div className={`inline-flex items-center ${currentSize.gap} group select-none ${className}`}>
      {SymbolSVG}
      {variant !== 'compact' && (
        <div className="flex flex-col text-left leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-bold tracking-tight ${currentSize.text} ${
                isDark ? 'text-white' : 'text-navy-900'
              }`}
            >
              ThreadPilot
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-brass-100 text-brass-800 border border-brass-200/80 shadow-xs"
            >
              AI
            </span>
          </div>
          <span
            className={`font-medium tracking-wider uppercase text-[9px] mt-1 ${
              isDark ? 'text-slate-400' : 'text-secondary-500'
            }`}
          >
            Enterprise OS
          </span>
        </div>
      )}
    </div>
  );
};

export default ThreadPilotLogo;
