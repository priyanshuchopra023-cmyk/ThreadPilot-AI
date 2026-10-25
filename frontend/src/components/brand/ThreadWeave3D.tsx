import React, { useEffect, useRef, useState } from 'react';

interface ThreadWeave3DProps {
  className?: string;
  interactive?: boolean;
  intensity?: 'subtle' | 'vibrant';
  showTelemetryNodes?: boolean;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface TelemetryNode {
  u: number;
  strandIndex: number;
  label: string;
  status: string;
  pulsePhase: number;
  color: string;
  brass: boolean;
}

/**
 * ThreadWeave3D
 * Signature 3D parametric interwoven textile thread experience for ThreadPilot AI.
 * Simulates high-precision yarn spinning spindles, multi-strand warp/weft weaves,
 * and intelligent supply chain telemetry nodes in interactive perspective space.
 */
export const ThreadWeave3D: React.FC<ThreadWeave3DProps> = ({
  className = '',
  interactive = true,
  intensity = 'vibrant',
  showTelemetryNodes = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<string>('Telemetry: Operational');
  const [reducedMotion, setReducedMotion] = useState(false);

  // Mouse tilt target and current smoothed orientation
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovering: false });

  useEffect(() => {
    // Check user preference for reduced motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Handle high-DPI retina display sizing
    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = Math.max(rect.width, 320);
      height = Math.max(rect.height, 240);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    resize();
    window.addEventListener('resize', resize);

    // Pause rendering when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Telemetry nodes attached to 3D trajectory
    const telemetryNodes: TelemetryNode[] = [
      { u: 0.15, strandIndex: 0, label: 'Spindle Frame 04', status: '1,420 RPM', pulsePhase: 0, color: '#38BDF8', brass: false },
      { u: 0.38, strandIndex: 1, label: 'Quality Telemetry', status: 'Cotton 40s Combed', pulsePhase: 1.5, color: '#C6A875', brass: true },
      { u: 0.62, strandIndex: 2, label: 'Batch Dispatch', status: 'Batch #TP-8840', pulsePhase: 3.0, color: '#818CF8', brass: false },
      { u: 0.85, strandIndex: 0, label: 'Tenant Ledger', status: 'Isolated Enclave', pulsePhase: 4.5, color: '#34D399', brass: false },
    ];

    // Mathematical curve calculation for strands
    // Generates a 3D interwoven parametric ribbon resembling textile yarn loops
    const getPointOnStrand = (u: number, strandIndex: number, time: number): Point3D => {
      const radiusX = width * 0.32;
      const radiusY = height * 0.28;
      const radiusZ = 120;

      // Unique phase offsets and frequencies for interwoven weaving
      const strandOffsets = [
        { phase: 0, freqU: 1.0, freqV: 3.0, wobble: 0.8 },
        { phase: Math.PI * 0.65, freqU: 1.0, freqV: 3.0, wobble: 0.9 },
        { phase: Math.PI * 1.35, freqU: 1.0, freqV: 3.0, wobble: 0.85 },
        { phase: Math.PI * 0.3, freqU: 2.0, freqV: 5.0, wobble: 0.6 }, // fine brass filament
      ];

      const config = strandOffsets[strandIndex % strandOffsets.length];
      const theta = u * Math.PI * 2 + (reducedMotion ? 0 : time * 0.25);
      const weaveAngle = u * Math.PI * 6 + config.phase + (reducedMotion ? 0 : time * 0.4);

      // Trefoil / Lissajous 3D woven knot coordinates
      const x = Math.sin(theta * config.freqU) * radiusX + Math.cos(weaveAngle) * 32 * config.wobble;
      const y = Math.cos(theta * config.freqU) * Math.sin(theta) * radiusY + Math.sin(weaveAngle) * 28 * config.wobble;
      const z = Math.sin(theta * 2 + config.phase) * radiusZ + Math.cos(weaveAngle * 0.5) * 45;

      return { x, y, z };
    };

    // 3D Matrix Rotation and Perspective Projection
    const project = (p: Point3D, rotX: number, rotY: number): { x: number; y: number; z: number; scale: number; alpha: number } => {
      // Rotate around Y-axis
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = p.x * cosY + p.z * sinY;
      const z1 = -p.x * sinY + p.z * cosY;

      // Rotate around X-axis
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;

      // Camera perspective projection
      const cameraDist = 480;
      const scale = cameraDist / (cameraDist + z2);

      const projX = (width / 2 + x1 * scale) * dpr;
      const projY = (height / 2 + y2 * scale) * dpr;

      // Atmospheric depth fog calculation
      const alpha = Math.max(0.15, Math.min(1.0, (z2 + 180) / 360));

      return { x: projX, y: projY, z: z2, scale, alpha };
    };

    let startTime = performance.now();
    let lastActiveCheck = 0;

    const render = (now: number) => {
      if (!isVisible) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001;

      // Smooth mouse lerp damping
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      const rotX = mouse.y * 0.45 + Math.sin(elapsed * 0.3) * 0.08;
      const rotY = mouse.x * 0.65 + elapsed * 0.2;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Strand definitions with physical textile styling
      const strands = [
        {
          name: 'Core Navy Warp',
          color: intensity === 'vibrant' ? '#60A5FA' : '#3B82F6',
          specular: '#BFDBFE',
          width: 3.6,
          steps: 80,
        },
        {
          name: 'Signature Brass Weft',
          color: intensity === 'vibrant' ? '#C6A875' : '#B89B65',
          specular: '#FDE68A',
          width: 2.8,
          steps: 80,
        },
        {
          name: 'Muted Steel Blue Fiber',
          color: '#5276A5',
          specular: '#93C5FD',
          width: 2.2,
          steps: 70,
        },
        {
          name: 'Fine Metallic Filament',
          color: '#E0C58E',
          specular: '#FFFFFF',
          width: 1.4,
          steps: 90,
        },
      ];

      // Build 3D segments for all strands
      interface RenderableSegment {
        strandIndex: number;
        p1: { x: number; y: number; z: number; scale: number; alpha: number };
        p2: { x: number; y: number; z: number; scale: number; alpha: number };
        avgZ: number;
      }

      const segments: RenderableSegment[] = [];

      strands.forEach((strand, strandIndex) => {
        const stepSize = 1.0 / strand.steps;
        let prevProj = project(getPointOnStrand(0, strandIndex, elapsed), rotX, rotY);

        for (let i = 1; i <= strand.steps; i++) {
          const u = i * stepSize;
          const currPt = getPointOnStrand(u, strandIndex, elapsed);
          const currProj = project(currPt, rotX, rotY);

          segments.push({
            strandIndex,
            p1: prevProj,
            p2: currProj,
            avgZ: (prevProj.z + currProj.z) * 0.5,
          });

          prevProj = currProj;
        }
      });

      // Painter's Algorithm: Sort segments back-to-front by depth (z)
      segments.sort((a, b) => a.avgZ - b.avgZ);

      // Render 3D segments with depth-shaded lighting
      segments.forEach((seg) => {
        const strand = strands[seg.strandIndex];
        const depthAlpha = Math.max(0.12, Math.min(0.95, (seg.avgZ + 150) / 300));
        const strokeWidth = strand.width * seg.p1.scale * dpr;

        ctx.beginPath();
        ctx.moveTo(seg.p1.x, seg.p1.y);
        ctx.lineTo(seg.p2.x, seg.p2.y);

        // Dynamic depth stroke
        ctx.strokeStyle = strand.color;
        ctx.globalAlpha = depthAlpha * (strand.name.includes('Brass') ? 0.95 : 0.85);
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Add specular filament highlight for foreground passes
        if (seg.avgZ > 20) {
          ctx.beginPath();
          ctx.moveTo(seg.p1.x, seg.p1.y);
          ctx.lineTo(seg.p2.x, seg.p2.y);
          ctx.strokeStyle = strand.specular;
          ctx.globalAlpha = Math.min(0.6, (seg.avgZ / 150) * 0.6);
          ctx.lineWidth = Math.max(0.8, strokeWidth * 0.35);
          ctx.stroke();
        }
      });

      // Render Intelligent Telemetry Nodes
      if (showTelemetryNodes) {
        telemetryNodes.forEach((node, idx) => {
          const pt3D = getPointOnStrand(node.u, node.strandIndex, elapsed);
          const proj = project(pt3D, rotX, rotY);

          // Node pulse animation
          const pulse = Math.sin(elapsed * 3 + node.pulsePhase) * 0.5 + 0.5;
          const radius = (4.5 + pulse * 1.5) * proj.scale * dpr;

          // Outer glowing halo
          ctx.save();
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * (1.8 + pulse * 0.6), 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = Math.max(0.08, 0.25 * proj.alpha * (0.6 + pulse * 0.4));
          ctx.fill();

          // Outer thin ring
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * (1.5 + pulse * 0.3), 0, Math.PI * 2);
          ctx.strokeStyle = node.brass ? '#C6A875' : node.color;
          ctx.lineWidth = 1.2 * dpr;
          ctx.globalAlpha = 0.6 * proj.alpha;
          ctx.stroke();

          // Solid luminous node core
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = node.color;
          ctx.globalAlpha = Math.max(0.3, 0.9 * proj.alpha);
          ctx.fill();

          // Center bright specular gleam
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = 0.95;
          ctx.fill();

          // Render micro-callout tag for prominent foreground node
          if (proj.z > 10 && idx === 1) {
            ctx.font = `${Math.round(9 * dpr)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
            ctx.fillStyle = '#C6A875';
            ctx.globalAlpha = 0.85;
            ctx.fillText(node.label, proj.x + 12 * dpr, proj.y - 4 * dpr);
            ctx.fillStyle = '#94A3B8';
            ctx.font = `${Math.round(8 * dpr)}px monospace`;
            ctx.fillText(node.status, proj.x + 12 * dpr, proj.y + 8 * dpr);
          }

          ctx.restore();
        });
      }

      ctx.restore();

      // Cycle telemetry status indicator every 4 seconds
      if (now - lastActiveCheck > 4000) {
        lastActiveCheck = now;
        const statuses = [
          'Telemetry: Real-time Warp Synced',
          'Batch Inspection: 100% Quality Pass',
          'Spindle Telemetry: 1,420 RPM Optimal',
          'Multi-Tenant Isolation: Verified',
        ];
        const nextStatus = statuses[Math.floor((now / 4000) % statuses.length)];
        setActiveTelemetry(nextStatus);
      }

      if (!reducedMotion) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
      observer.disconnect();
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, [interactive, intensity, showTelemetryNodes, reducedMotion]);

  // Pointer Interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  };

  const handlePointerLeave = () => {
    mouseRef.current.targetX = 0;
    mouseRef.current.targetY = 0;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full aspect-[16/10] max-h-[380px] rounded-2xl overflow-hidden bg-gradient-to-br from-navy-950 via-[#0B1A2F] to-navy-950 border border-navy-700/60 shadow-2xl backdrop-blur-xl ${className}`}
      aria-label="ThreadPilot AI 3D Interwoven Thread Experience"
    >
      {/* Ambient Lighting Gradients */}
      <div className="absolute -top-16 -left-16 w-60 h-60 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-60 h-60 rounded-full bg-brass-500/15 blur-3xl pointer-events-none" />

      {/* Perspective Geometric Grid Underlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="tp-3d-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#5276A5" strokeWidth="0.6" strokeDasharray="2 3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tp-3d-grid)" />
      </svg>

      {/* High-Performance 3D Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Real-time Dimensional Brand HUD Overlays */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy-900/80 border border-navy-700/70 backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-200 uppercase tracking-wider">
            {activeTelemetry}
          </span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brass-950/40 border border-brass-700/40 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-brass-400" />
          <span className="text-[10px] font-mono text-brass-300 font-semibold tracking-wide">
            3D SPINDLE CORE
          </span>
        </div>
      </div>

      {/* Floating Micro-Metric Cards along bottom */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none z-10 text-[11px]">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900/90 border border-navy-700/80 backdrop-blur-md text-slate-300 shadow-md">
          <span className="text-brass-400 font-bold font-mono">100%</span>
          <span>Tenant Isolated Core</span>
        </div>
        <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-900/90 border border-navy-700/80 backdrop-blur-md text-slate-300 shadow-md">
          <span className="text-blue-400 font-bold font-mono">60 FPS</span>
          <span>Fluid Matrix Weave</span>
        </div>
      </div>
    </div>
  );
};

export default ThreadWeave3D;
