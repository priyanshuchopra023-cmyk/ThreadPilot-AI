import React, { useRef, useEffect, useState, useMemo } from 'react';

export type ThreadAIState = 'idle' | 'listening' | 'thinking' | 'processing' | 'responding';

interface ThreadAICoreProps {
  state?: ThreadAIState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  interactive?: boolean;
  className?: string;
  showStatusLabel?: boolean;
}

/**
 * ThreadAICore
 * Original, cinematic intelligent assistant presence for ThreadPilot AI.
 * Represents autonomous textile intelligence through fluid harmonic thread ribbons,
 * neural orbital rings, a luminous computational nexus, and responsive state transitions.
 *
 * Supported Visual States:
 * - 'idle': Calm breathing pulse, gentle celestial rotation, harmonic thread ribbons.
 * - 'listening': Expands slightly, focused luminous alignment, ribbons tense toward center.
 * - 'thinking': Accelerated orbital rotation, cascading phase-shifted harmonic wave oscillations.
 * - 'processing': High-velocity computational particle weave along structural spline nodes.
 * - 'responding': Harmonious outward bloom, rhythmic pulsation synchronized with intelligence delivery.
 */
export const ThreadAICore: React.FC<ThreadAICoreProps> = ({
  state = 'idle',
  size = 'md',
  interactive = true,
  className = '',
  showStatusLabel = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Pixel dimension map
  const dimension = useMemo(() => {
    switch (size) {
      case 'sm': return 44;
      case 'md': return 84;
      case 'lg': return 140;
      case 'xl': return 200;
      case 'hero': return 280;
      default: return 84;
    }
  }, [size]);

  // Handle subtle mouse tilt interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px * 18, y: -py * 18 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let time = 0;

    // Handle Reduced Motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Handle Retina / DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimension * dpr;
    canvas.height = dimension * dpr;

    // Visibility Observer to suspend rendering loop off-screen
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);

    // State parameters for dynamic visual tuning
    const stateConfig = {
      idle: {
        speed: 0.018,
        pulseScale: 1.0,
        coreGlow: '#5276A5',
        ribbon1: 'rgba(82, 118, 165, 0.65)',
        ribbon2: 'rgba(198, 168, 117, 0.6)',
        nodeCount: 8,
        particleSpeed: 1.0,
        waveFreq: 3,
      },
      listening: {
        speed: 0.026,
        pulseScale: 1.08,
        coreGlow: '#D4AF37',
        ribbon1: 'rgba(212, 175, 55, 0.8)',
        ribbon2: 'rgba(234, 220, 193, 0.7)',
        nodeCount: 12,
        particleSpeed: 1.4,
        waveFreq: 4,
      },
      thinking: {
        speed: 0.048,
        pulseScale: 1.05,
        coreGlow: '#818CF8',
        ribbon1: 'rgba(129, 140, 248, 0.85)',
        ribbon2: 'rgba(56, 189, 248, 0.75)',
        nodeCount: 14,
        particleSpeed: 2.2,
        waveFreq: 6,
      },
      processing: {
        speed: 0.065,
        pulseScale: 1.12,
        coreGlow: '#06B6D4',
        ribbon1: 'rgba(6, 182, 212, 0.9)',
        ribbon2: 'rgba(198, 168, 117, 0.85)',
        nodeCount: 18,
        particleSpeed: 3.0,
        waveFreq: 8,
      },
      responding: {
        speed: 0.022,
        pulseScale: 1.14,
        coreGlow: '#10B981',
        ribbon1: 'rgba(16, 185, 129, 0.85)',
        ribbon2: 'rgba(198, 168, 117, 0.75)',
        nodeCount: 10,
        particleSpeed: 1.2,
        waveFreq: 4,
      },
    }[state];

    // Smooth state interpolation target
    let currentSpeed = stateConfig.speed;
    let currentScale = stateConfig.pulseScale;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, dimension, dimension);

      const cx = dimension / 2;
      const cy = dimension / 2;
      const radius = dimension * 0.38;

      if (!prefersReducedMotion) {
        time += currentSpeed;
      } else {
        time = 0.5; // Fixed graceful static keyframe
      }

      // Smooth state breathing pulse
      const breathe = prefersReducedMotion ? 1 : 1 + Math.sin(time * 2.2) * 0.05 * currentScale;

      // 1. Ambient Holographic Bloom (Outer Glow)
      const ambientGrad = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius * 1.3);
      ambientGrad.addColorStop(0, stateConfig.coreGlow + '35');
      ambientGrad.addColorStop(0.5, stateConfig.coreGlow + '15');
      ambientGrad.addColorStop(1, 'rgba(11, 21, 36, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Rotating Orbital Ribbon (Sinusoidal Parametric Strand)
      const strandPoints1: { x: number; y: number }[] = [];
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        const rWave = radius * (0.88 + Math.sin(theta * stateConfig.waveFreq + time * 2) * 0.08) * breathe;
        const x = cx + Math.cos(theta + time * 0.6) * rWave;
        const y = cy + Math.sin(theta + time * 0.6) * (rWave * 0.72); // Subtle isometric tilt
        strandPoints1.push({ x, y });
      }

      ctx.beginPath();
      for (let i = 0; i < strandPoints1.length; i++) {
        if (i === 0) ctx.moveTo(strandPoints1[i].x, strandPoints1[i].y);
        else ctx.lineTo(strandPoints1[i].x, strandPoints1[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = stateConfig.ribbon1;
      ctx.lineWidth = Math.max(1.2, dimension * 0.022);
      ctx.stroke();

      // 3. Counter-Rotating Harmonic Brass Ribbon
      const strandPoints2: { x: number; y: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        const rWave = radius * (0.75 + Math.cos(theta * 3 - time * 2.5) * 0.07) * breathe;
        const x = cx + Math.sin(theta - time * 0.8) * (rWave * 0.76);
        const y = cy + Math.cos(theta - time * 0.8) * rWave;
        strandPoints2.push({ x, y });
      }

      ctx.beginPath();
      for (let i = 0; i < strandPoints2.length; i++) {
        if (i === 0) ctx.moveTo(strandPoints2[i].x, strandPoints2[i].y);
        else ctx.lineTo(strandPoints2[i].x, strandPoints2[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = stateConfig.ribbon2;
      ctx.lineWidth = Math.max(1, dimension * 0.018);
      ctx.stroke();

      // 4. Orbiting Intelligence Telemetry Nodes
      for (let n = 0; n < stateConfig.nodeCount; n++) {
        const offset = (n / stateConfig.nodeCount) * Math.PI * 2;
        const nodeAngle = offset + time * stateConfig.particleSpeed;
        const nx = cx + Math.cos(nodeAngle) * (radius * 0.82 * breathe);
        const ny = cy + Math.sin(nodeAngle) * (radius * 0.62 * breathe);
        const nodeSize = (n % 2 === 0 ? 2.2 : 1.4) * (dimension / 84);

        ctx.beginPath();
        ctx.arc(nx, ny, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = n % 2 === 0 ? '#C6A875' : '#FFFFFF';
        ctx.shadowColor = stateConfig.coreGlow;
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Central Computational Luminous Nexus
      const coreRadius = radius * (0.34 + Math.sin(time * 3) * 0.04) * breathe;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreGrad.addColorStop(0, '#FFFFFF');
      coreGrad.addColorStop(0.35, stateConfig.coreGlow);
      coreGrad.addColorStop(0.85, '#142B4A');
      coreGrad.addColorStop(1, 'rgba(20, 43, 74, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Inner woven geometric diamond glyph
      const glyphSize = coreRadius * 0.6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time * 0.5);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = Math.max(1, dimension * 0.015);
      ctx.beginPath();
      ctx.moveTo(0, -glyphSize);
      ctx.lineTo(glyphSize, 0);
      ctx.lineTo(0, glyphSize);
      ctx.lineTo(-glyphSize, 0);
      ctx.closePath();
      ctx.stroke();

      // Horizontal central thread strand
      ctx.beginPath();
      ctx.moveTo(-glyphSize * 1.3, 0);
      ctx.lineTo(glyphSize * 1.3, 0);
      ctx.strokeStyle = '#C6A875';
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [dimension, state]);

  // State label & color configuration
  const stateMeta = {
    idle: { label: 'Thread AI • Standby', badge: 'bg-navy-900/10 text-navy-700 border-navy-200/80', dot: 'bg-blue-500' },
    listening: { label: 'Thread AI • Listening', badge: 'bg-brass-50 text-brass-800 border-brass-300', dot: 'bg-brass-500 animate-ping' },
    thinking: { label: 'Thread AI • Synthesizing', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500 animate-pulse' },
    processing: { label: 'Thread AI • Processing Ledger', badge: 'bg-cyan-50 text-cyan-800 border-cyan-200', dot: 'bg-cyan-500 animate-pulse' },
    responding: { label: 'Thread AI • Responding', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
  }[state];

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex flex-col items-center justify-center select-none ${className}`}
      style={{
        transform: interactive
          ? `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${isHovered ? 1.02 : 1})`
          : undefined,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
      }}
      aria-label={`Thread AI Core (${stateMeta.label})`}
    >
      {/* 3D Dynamic Spline Canvas */}
      <canvas
        ref={canvasRef}
        style={{ width: dimension, height: dimension }}
        className="block"
      />

      {/* Optional State Indicator Pill */}
      {showStatusLabel && (
        <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${stateMeta.badge} transition-all duration-300`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stateMeta.dot}`} />
          <span>{stateMeta.label}</span>
        </div>
      )}
    </div>
  );
};

export default ThreadAICore;
