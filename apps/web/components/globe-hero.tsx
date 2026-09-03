"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import createGlobe, { type Marker } from "cobe";

// ─── Tenant HQ markers [lat, lng] ─────────────────────────────────────────────
const MARKERS: Marker[] = [
  { location: [41.85, -87.65], size: 0.07 },
  { location: [42.33, -83.05], size: 0.07 },
  { location: [30.33, -81.66], size: 0.07 },
  { location: [44.98, -93.27], size: 0.07 },
  { location: [30.27, -97.74], size: 0.07 },
];

// ─── Meteor arc routes [lat0, lng0, lat1, lng1] ───────────────────────────────
const ARC_ROUTES = [
  // Trans-Atlantic
  { lat0: 40.71, lng0: -74.01, lat1: 51.51, lng1:  -0.13, color: "#59e1d9" },
  { lat0: 25.77, lng0: -80.19, lat1: 48.85, lng1:   2.35, color: "#82d949" },
  { lat0:-23.55, lng0: -46.63, lat1: 52.37, lng1:   4.90, color: "#ff9a5a" },

  // Europe ↔ Africa
  { lat0: 51.51, lng0:  -0.13, lat1: -1.29, lng1:  36.82, color: "#ff9a5a" },
  { lat0: 48.85, lng0:   2.35, lat1:-33.93, lng1:  18.42, color: "#59e1d9" },

  // Europe ↔ Middle East / Asia
  { lat0: 51.51, lng0:  -0.13, lat1: 25.20, lng1:  55.27, color: "#82d949" },
  { lat0: 41.01, lng0:  28.95, lat1: 19.07, lng1:  72.88, color: "#59e1d9" },

  // South / Southeast Asia ↔ East Asia
  { lat0: 19.07, lng0:  72.88, lat1:  1.35, lng1: 103.82, color: "#ff9a5a" },
  { lat0:  1.35, lng0: 103.82, lat1: 31.23, lng1: 121.47, color: "#82d949" },
  { lat0: 31.23, lng0: 121.47, lat1: 35.68, lng1: 139.69, color: "#59e1d9" },

  // Trans-Pacific
  { lat0: 35.68, lng0: 139.69, lat1: 34.05, lng1:-118.24, color: "#ff9a5a" },
  { lat0: 35.68, lng0: 139.69, lat1:-33.87, lng1: 151.21, color: "#82d949" },

  // Pacific ↔ Americas (West Coast)
  { lat0:-33.87, lng0: 151.21, lat1: 34.05, lng1:-118.24, color: "#59e1d9" },
  { lat0: 34.05, lng0:-118.24, lat1:-33.45, lng1: -70.67, color: "#ff9a5a" },

  // Indian Ocean
  { lat0:-33.93, lng0:  18.42, lat1: 28.61, lng1:  77.21, color: "#82d949" },
  { lat0: 28.61, lng0:  77.21, lat1: -4.04, lng1:  39.67, color: "#59e1d9" },

  // North America internal + to Asia
  { lat0: 41.85, lng0: -87.65, lat1: 49.25, lng1:-123.10, color: "#ff9a5a" },
  { lat0: 49.25, lng0:-123.10, lat1: 35.68, lng1: 139.69, color: "#82d949" },
];

// ─── 3D math helpers ──────────────────────────────────────────────────────────

function latLngToVec(lat: number, lng: number): [number, number, number] {
  const φ = (lat * Math.PI) / 180;
  const λ = (lng * Math.PI) / 180;
  return [Math.cos(φ) * Math.cos(λ), Math.cos(φ) * Math.sin(λ), Math.sin(φ)];
}

// Spherical linear interpolation between two lat/lng points
function slerpArc(
  lat0: number, lng0: number, lat1: number, lng1: number, t: number
): [number, number, number] {
  const [x0, y0, z0] = latLngToVec(lat0, lng0);
  const [x1, y1, z1] = latLngToVec(lat1, lng1);
  const dot   = Math.min(1, x0*x1 + y0*y1 + z0*z1);
  const omega = Math.acos(Math.max(-1, dot));
  if (omega < 0.001) return [x0, y0, z0];
  const s = Math.sin(omega);
  const a = Math.sin((1 - t) * omega) / s;
  const b = Math.sin(t * omega) / s;
  const elev = 1 + Math.sin(t * Math.PI) * 0.12;  // lift arc above surface
  return [(a*x0 + b*x1)*elev, (a*y0 + b*y1)*elev, (a*z0 + b*z1)*elev];
}

// Orthographic projection matching cobe's rotation direction
function project(
  vec: [number, number, number],
  phi: number, theta: number,
  cx: number, cy: number, r: number
) {
  const [x, y, z] = vec;
  // Counter-clockwise rotation around z-axis (matches cobe's phi direction)
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const rx =  x * cosP - y * sinP;
  const ry =  x * sinP + y * cosP;
  const rz =  z;
  // Theta tilt around x-axis
  const ty =  ry * Math.cos(theta) - rz * Math.sin(theta);
  const tz =  ry * Math.sin(theta) + rz * Math.cos(theta);
  return { sx: cx + r * ty, sy: cy - r * tz, vis: rx > 0 };
}

// ─── Component ────────────────────────────────────────────────────────────────

const THETA = 0.22;

export function GlobeHero({ onEnter, tenant }: { onEnter: () => void; tenant?: string }) {
  const cobeRef  = useRef<HTMLCanvasElement>(null);
  const arcRef   = useRef<HTMLCanvasElement>(null);
  const starRef  = useRef<HTMLCanvasElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const phiRef   = useRef(0.4);
  const frameRef = useRef(0);
  const [ready, setReady] = useState(false);

  // ── Draw starfield once ────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = starRef.current;
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;

    // seeded-ish randomness so it's stable across re-renders
    let seed = 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

    // Galaxy dust / nebula blobs — clustered around globe centre (0.5, 0.5)
    const nebulae = [
      { x: 0.50, y: 0.50, r: 420, color: "rgba(14,35,110,0.10)"  }, // main centre glow
      { x: 0.50, y: 0.50, r: 260, color: "rgba(20,55,150,0.08)"  }, // tighter inner ring
      { x: 0.44, y: 0.46, r: 180, color: "rgba(25,60,160,0.06)"  }, // slight off-centre accent
      { x: 0.56, y: 0.54, r: 200, color: "rgba(18,45,130,0.05)"  }, // mirror accent
      { x: 0.50, y: 0.50, r: 600, color: "rgba(6,16,60,0.05)"    }, // very wide outer haze
    ];
    nebulae.forEach(({ x, y, r, color }) => {
      const grd = ctx.createRadialGradient(x * canvas.width, y * canvas.height, 0, x * canvas.width, y * canvas.height, r);
      grd.addColorStop(0, color);
      grd.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(x * canvas.width, y * canvas.height, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    });

    // Background star field
    for (let i = 0; i < 320; i++) {
      const x     = rand() * canvas.width;
      const y     = rand() * canvas.height;
      const size  = rand() * 1.1 + 0.2;
      const alpha = rand() * 0.55 + 0.12;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,220,255,${alpha})`;
      ctx.fill();
    }

    // Brighter foreground stars
    for (let i = 0; i < 22; i++) {
      const x     = rand() * canvas.width;
      const y     = rand() * canvas.height;
      const size  = rand() * 1.6 + 0.8;
      const alpha = rand() * 0.4 + 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,240,255,${alpha})`;
      ctx.fill();
      // tiny cross flare on the brightest ones
      if (alpha > 0.75) {
        ctx.globalAlpha = alpha * 0.3;
        ctx.strokeStyle = "rgba(200,220,255,1)";
        ctx.lineWidth   = 0.5;
        ctx.beginPath(); ctx.moveTo(x - size * 3, y); ctx.lineTo(x + size * 3, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - size * 3); ctx.lineTo(x, y + size * 3); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }, []);

  useEffect(() => {
    const cobeEl = cobeRef.current;
    const arcEl  = arcRef.current;
    const wrap   = wrapRef.current;
    if (!cobeEl || !arcEl || !wrap) return;

    // Compute size from window — never rely on offsetWidth which can be 0
    const size = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.88);
    const cx = size / 2, cy = size / 2;
    const r  = size * 0.445;

    // Apply explicit pixel dimensions to the wrapper so CSS fills work
    wrap.style.width  = `${size}px`;
    wrap.style.height = `${size}px`;

    // ── Arc overlay canvas (2D)
    arcEl.width  = size;
    arcEl.height = size;
    const ctx = arcEl.getContext("2d")!;

    // ── Cobe WebGL globe (no built-in arcs — we draw our own)
    const globe = createGlobe(cobeEl, {
      devicePixelRatio: 2,
      width:  size * 2,
      height: size * 2,
      phi:    phiRef.current,
      theta:  THETA,
      dark:   1,
      diffuse:       0.62,
      mapSamples:    24000,
      mapBrightness: 4.2,
      baseColor:   [0.07, 0.13, 0.36],
      markerColor: [0.18, 0.36, 0.62],
      glowColor:   [0.02, 0.05, 0.18],
      markers: [],
    });

    // ── Per-arc animation state
    type ArcState = { progress: number; speed: number; active: boolean; delay: number };
    const arcStates: ArcState[] = ARC_ROUTES.map((_, i) => ({
      progress: (i / ARC_ROUTES.length),          // evenly pre-seeded across 0–1
      speed:    0.0010 + Math.random() * 0.0008,
      active:   true,                             // all start active, staggered by progress
      delay:    0,
    }));
    let tick = 0;

    // ── Main animation loop
    function animate() {
      phiRef.current += 0.0025;
      globe.update({ phi: phiRef.current });
      tick++;

      // Clear arc canvas
      ctx.clearRect(0, 0, size, size);

      ARC_ROUTES.forEach((arc, i) => {
        const st = arcStates[i];
        if (!st.active && tick > st.delay) st.active = true;
        if (!st.active) return;

        st.progress += st.speed;
        if (st.progress > 1.08) st.progress = -0.04 + Math.random() * 0.08;

        const HEAD  = Math.min(1, st.progress);
        const TAIL  = Math.max(0, st.progress - 0.09);  // thin 9% tail
        const STEPS = 28;

        const pts: { sx: number; sy: number; vis: boolean }[] = [];
        for (let j = 0; j <= STEPS; j++) {
          const t = TAIL + (HEAD - TAIL) * (j / STEPS);
          if (t < 0 || t > 1) continue;
          const v = slerpArc(arc.lat0, arc.lng0, arc.lat1, arc.lng1, t);
          pts.push(project(v, phiRef.current, THETA, cx, cy, r));
        }
        if (pts.length < 2) return;

        // ── 1. Full route path (solid line start → end) ──
        {
          const ROUTE_STEPS = 64;
          ctx.save();
          ctx.setLineDash([]);
          ctx.lineWidth   = 0.8;
          ctx.strokeStyle = arc.color;
          ctx.globalAlpha = 0.30;
          ctx.lineCap = "round";
          let started = false;
          ctx.beginPath();
          for (let j = 0; j <= ROUTE_STEPS; j++) {
            const t = j / ROUTE_STEPS;
            const v = slerpArc(arc.lat0, arc.lng0, arc.lat1, arc.lng1, t);
            const p = project(v, phiRef.current, THETA, cx, cy, r);
            if (!p.vis) { started = false; continue; }
            if (!started) { ctx.moveTo(p.sx, p.sy); started = true; }
            else ctx.lineTo(p.sx, p.sy);
          }
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // ── 2. Moving meteor tail (fades from transparent → bright) ──
        for (let j = 1; j < pts.length; j++) {
          const a = pts[j - 1], b = pts[j];
          if (!a.vis || !b.vis) continue;
          const frac = j / pts.length;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.globalAlpha = frac * frac * 0.95;
          ctx.lineWidth   = 0.4 + frac * 1.1;
          ctx.strokeStyle = arc.color;
          ctx.lineCap     = "round";
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // ── 3. Bright star head ──
        const head = pts[pts.length - 1];
        if (head?.vis && HEAD > 0 && HEAD < 1) {
          // outer glow
          const grd = ctx.createRadialGradient(head.sx, head.sy, 0, head.sx, head.sy, 6);
          grd.addColorStop(0,   arc.color + "ff");
          grd.addColorStop(0.4, arc.color + "99");
          grd.addColorStop(1,   arc.color + "00");
          ctx.beginPath();
          ctx.arc(head.sx, head.sy, 6, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
          // bright white core
          ctx.beginPath();
          ctx.arc(head.sx, head.sy, 1.3, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        }
      });

      frameRef.current = requestAnimationFrame(animate);
    }
    frameRef.current = requestAnimationFrame(animate);
    setTimeout(() => setReady(true), 350);

    return () => {
      cancelAnimationFrame(frameRef.current);
      globe.destroy();
    };
  }, []);

  const fadeUp = {
    hidden:  { opacity: 0, y: 28, filter: "blur(6px)" },
    visible: { opacity: 1, y: 0,  filter: "blur(0px)" },
  };

  const stagger = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.14, delayChildren: 0.5 } },
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">

      {/* Starfield */}
      <canvas ref={starRef} className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 0 }} />

      {/* starfield is full-screen; visual globe atmosphere/pulse are now positioned inside the globe wrapper so they stay aligned */}

      {/* Globe wrapper — JS sets px size; CSS fade only */}
      <div
        ref={wrapRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ opacity: ready ? 1 : 0, transition: "opacity 1.2s ease" }}
      >
        {/* Atmosphere (relative to wrapper) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={ready ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 50%, transparent 42%, rgba(30,70,200,0.13) 50%, rgba(15,40,140,0.07) 60%, transparent 72%)",
            filter:     "blur(6px)",
          }}
        />

        {/* Rim glow (relative to wrapper) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 0.6 } : {}}
          transition={{ duration: 1.2, delay: 0.35 }}
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 45px 8px rgba(30,80,220,0.10), inset 0 0 40px 6px rgba(20,55,180,0.12)",
          }}
        />
        <canvas ref={cobeRef} className="absolute inset-0 h-full w-full" />
        <canvas ref={arcRef}  className="pointer-events-none absolute inset-0 h-full w-full" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%]"
          style={{ background: "linear-gradient(to top, #000 0%, #000 18%, rgba(0,0,0,0.55) 55%, transparent 100%)" }}
        />

        {/* Pulse rings — staggered scale-in (inside wrapper so they align with globe) */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 + i * 0.12 }}
            animate={ready ? { opacity: 1, scale: 1 + i * 0.18 } : {}}
            transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.6 + i * 0.15 }}
            className="pointer-events-none absolute inset-0 rounded-full border border-[hsl(184,73%,61%)]/[0.08]"
            style={{
              animation:      `pulse-ring ${3.2 + i * 0.9}s ease-in-out infinite`,
              animationDelay: `${i * 0.85}s`,
              zIndex:         6,
            }}
          />
        ))}
      </div>

      {/* Text — staggered blur-up reveal */}
      <motion.div
        className="pointer-events-none relative z-10 text-center"
        variants={stagger}
        initial="hidden"
        animate={ready ? "visible" : "hidden"}
      >
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-[0.68rem] uppercase tracking-[0.44em] text-white/65"
        >
          EasyFlow · Super Admin
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-[-0.02em] text-white md:text-7xl">
            Supply Chain
          </h1>
        </motion.div>

        <motion.div
          variants={{
            hidden:  { opacity: 0, y: 20, filter: "blur(12px)", letterSpacing: "0.05em" },
            visible: { opacity: 1, y: 0,  filter: "blur(0px)",  letterSpacing: "-0.01em" },
          }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-5xl font-light tracking-[-0.01em] text-white/70 md:text-7xl">
            Consciousness
          </span>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-sm text-sm leading-7 text-white/75"
        >
          Complete supply chain visibility. One platform.
        </motion.p>
      </motion.div>

      {/* Enter button — bouncy spring entrance */}
      <motion.div
        className="absolute bottom-12 z-10"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={ready ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 1.1 }}
      >
        <motion.button
          onClick={onEnter}
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.14)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="rounded-full border border-white/20 bg-white/8 px-7 py-3 text-sm font-medium tracking-wide text-white/80 backdrop-blur-sm"
        >
          Enter Platform →
        </motion.button>
      </motion.div>

      {/* Tenant pill */}
      <AnimatePresence>
        {tenant && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
            className="absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs text-white/60 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(184,73%,61%)]" />
            {tenant.replace(/-/g, " ")}
            <button
              className="ml-1 text-white/30 transition hover:text-white"
              onClick={() => { window.history.pushState({}, "", "/globe"); window.location.reload(); }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.10; transform: translate(-50%,-50%) scale(1);    }
          50%       { opacity: 0.25; transform: translate(-50%,-50%) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
