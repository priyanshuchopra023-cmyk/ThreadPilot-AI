import React from 'react';
import { Layers, ShieldCheck, Zap, Activity } from 'lucide-react';

interface AuthHeroIllustrationProps {
  className?: string;
}

/**
 * AuthHeroIllustration
 * A 3D-inspired dimensional visual representation of the ThreadPilot AI
 * hosiery and textile manufacturing supply chain operating system.
 * Features interwoven luminous threads, intelligent telemetry nodes,
 * and floating real-time micro-metrics.
 */
export const AuthHeroIllustration: React.FC<AuthHeroIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* Dimensional Isometric SVG Stage */}
      <div className="relative w-full aspect-[16/10] max-h-[380px] rounded-2xl overflow-hidden bg-gradient-to-br from-navy-900/80 via-navy-950 to-navy-900/90 border border-white/10 shadow-2xl backdrop-blur-xl p-6 flex flex-col justify-between">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-brass-500/20 blur-3xl pointer-events-none" />

        {/* Dynamic 3D Thread Weave Vector Canvas */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 600 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Thread Gradients */}
            <linearGradient id="thread-warp-1" x1="50" y1="20" x2="550" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#C6A875" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="thread-weft-1" x1="550" y1="40" x2="50" y2="340" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C6A875" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="grid-plane" x1="300" y1="0" x2="300" y2="380" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0B192C" stopOpacity="0.1" />
            </linearGradient>

            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#38BDF8" floodOpacity="0.6" />
            </filter>
            <filter id="brass-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#C6A875" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Perspective Matrix Floor Grid */}
          <g opacity="0.35">
            <path d="M 50 280 L 300 120 L 550 280 L 300 360 Z" stroke="#334E68" strokeWidth="1" fill="url(#grid-plane)" />
            <path d="M 112 240 L 362 80" stroke="#243B53" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M 175 200 L 425 40" stroke="#243B53" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M 237 160 L 487 0" stroke="#243B53" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M 175 280 L 425 120" stroke="#243B53" strokeWidth="0.8" strokeDasharray="3 3" />
            <path d="M 300 360 L 300 120" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* Flowing Luminous Warp Threads */}
          <path
            d="M 60 160 C 180 80, 240 260, 380 180 C 460 130, 500 210, 540 240"
            stroke="url(#thread-warp-1)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          <path
            d="M 80 260 C 190 280, 260 140, 390 230 C 470 290, 520 180, 550 160"
            stroke="url(#thread-weft-1)"
            strokeWidth="2.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Vertical Architectural Connecting Strands */}
          <line x1="160" y1="125" x2="160" y2="230" stroke="#5276A5" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.7" />
          <line x1="320" y1="100" x2="320" y2="245" stroke="#C6A875" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.7" />
          <line x1="450" y1="130" x2="450" y2="250" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.7" />

          {/* Active Data Nodes */}
          <circle cx="160" cy="125" r="5" fill="#38BDF8" filter="url(#node-glow)" />
          <circle cx="160" cy="125" r="2.5" fill="#FFFFFF" />

          <circle cx="320" cy="200" r="6" fill="#C6A875" filter="url(#brass-glow)" />
          <circle cx="320" cy="200" r="3" fill="#FFFFFF" />

          <circle cx="450" cy="170" r="5" fill="#38BDF8" filter="url(#node-glow)" />
          <circle cx="450" cy="170" r="2.5" fill="#FFFFFF" />
        </svg>

        {/* Top Floating Glass Badge: OCR Pipeline Speed */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800/90 border border-white/15 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Activity className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-xs font-semibold text-slate-100 tabular-nums">
              Telemetry Active: <span className="text-emerald-400">99.98% uptime</span>
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brass-500/15 border border-brass-400/30 text-brass-300 text-[11px] font-medium tracking-wide">
            <Zap className="w-3 h-3 text-brass-400" />
            <span>Multi-Tenant Sharding</span>
          </div>
        </div>

        {/* Bottom Floating KPI Metric Cards */}
        <div className="relative z-10 grid grid-cols-2 gap-3 pt-4">
          <div className="p-3 rounded-xl bg-navy-800/85 border border-white/15 backdrop-blur-md shadow-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Inventory Yield</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-white tabular-nums tracking-tight">142,800</span>
                <span className="text-[10px] font-semibold text-emerald-400 tabular-nums">+14.2%</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-navy-800/85 border border-white/15 backdrop-blur-md shadow-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brass-500/20 border border-brass-400/30 flex items-center justify-center text-brass-300 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Data Isolation</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold text-white tracking-tight">SOC2 Type II</span>
                <span className="text-[10px] font-semibold text-brass-300">Tenant-Safe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthHeroIllustration;
