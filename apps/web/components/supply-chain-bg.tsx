"use client";

export function SupplyChainBg() {
  const shipBay = {
    startX: 66,
    lowerY: 72,
    upperY: 46,
    width: 42,
    height: 24,
    gap: 2,
    targetColumn: 5,
  };
  const targetBayX = shipBay.startX + shipBay.targetColumn * (shipBay.width + shipBay.gap);

  return (
    <>
      <style>{`
        /* ── Delivery truck: starts at right bezel and moves left ── */
        @keyframes truck-edge-left {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-26vw); }
        }
        @keyframes cargo-pulse {
          0%, 100% { opacity: 0.36; }
          50% { opacity: 0.74; }
        }

        /* ── Conveyor belt ── */
        @keyframes belt-stripe { 0%{transform:translateX(0)} 100%{transform:translateX(40px)} }
        @keyframes pkg-right   { 0%{transform:translateX(-280px)} 100%{transform:translateX(0)} }

        /* ── Crane hook lifts up, pauses, drops back ── */
        @keyframes crane-lift {
          0%   { transform: translateY(0px);   }
          30%  { transform: translateY(-72px);  }
          55%  { transform: translateY(-72px);  }
          85%  { transform: translateY(0px);   }
          100% { transform: translateY(0px);   }
        }
        /* Cable shortens in sync with hook rising */
        @keyframes cable-shorten {
          0%   { transform: scaleY(1);    transform-origin: top; }
          30%  { transform: scaleY(0.35); transform-origin: top; }
          55%  { transform: scaleY(0.35); transform-origin: top; }
          85%  { transform: scaleY(1);    transform-origin: top; }
          100% { transform: scaleY(1);    transform-origin: top; }
        }
        @keyframes fork-bob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        /* ── Warehouse gentle bob ── */
        @keyframes wh-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes ship-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes smoke-rise-1 {
          0% { transform: translateY(0) translateX(0) scale(0.92); opacity: 0.10; }
          50% { transform: translateY(-14px) translateX(-4px) scale(1.05); opacity: 0.16; }
          100% { transform: translateY(-28px) translateX(-10px) scale(1.18); opacity: 0; }
        }
        @keyframes smoke-rise-2 {
          0% { transform: translateY(0) translateX(0) scale(0.88); opacity: 0.08; }
          50% { transform: translateY(-18px) translateX(6px) scale(1.08); opacity: 0.14; }
          100% { transform: translateY(-34px) translateX(12px) scale(1.22); opacity: 0; }
        }
      `}</style>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          opacity: 0.98,
          filter: "saturate(1.16) drop-shadow(0 0 18px rgba(89,225,217,0.16))",
        }}
      >
        {/* ════════════════════════════════════════════════════════════════
            ZONE B — MID (20%–55% from top): Warehouses, left and right
            ════════════════════════════════════════════════════════════════ */}

        {/* Warehouse LEFT + conveyor */}
        <svg width="392" height="198" viewBox="-84 0 514 250"
          className="absolute hidden lg:block"
          style={{
            left: "-44px",
            top: "18%",
            opacity: 0.85,
            zIndex: 2,
            animation: "wh-bob 10s ease-in-out infinite",
          }}>
          {/* Unified ground reference line */}
          <rect x="0" y="220" width="430" height="3" rx="1" fill="#59e1d9" opacity="0.42" />

          {/* Warehouse body */}
          <rect x="0" y="80" width="200" height="140" rx="3" fill="#59e1d9" />
          <polygon points="0,80 100,14 200,80" fill="#59e1d9" />
          <rect x="76" y="14" width="48" height="14" rx="3" fill="#59e1d9" opacity="0.6" />
          <rect x="14" y="104" width="42" height="30" rx="3" fill="#061018" opacity="0.4" />
          <rect x="144" y="104" width="42" height="30" rx="3" fill="#061018" opacity="0.4" />

          {/* Door is flush with the ground line */}
          <rect x="72" y="150" width="56" height="70" rx="2" fill="#061018" opacity="0.46" />
          <rect x="60" y="142" width="80" height="10" rx="2" fill="#59e1d9" opacity="0.5" />

          {/* Conveyor belt emerges from the door threshold.
              Belt centerline y=185 matches the door midpoint. */}
          <rect x="112" y="175" width="272" height="20" rx="6" fill="#59e1d9" />
          <g style={{ animation: "belt-stripe 1s linear infinite" }}>
            {[112,132,152,172,192,212,232,252,272,292,312,332,352,372].map((x) => (
              <line key={x} x1={x} y1="175" x2={x - 14} y2="195"
                stroke="#061018" strokeWidth="6" opacity="0.18" />
            ))}
          </g>

          {/* First roller begins inside the door opening for a seamless exit */}
          {[112,148,184,220,256,292,328].map((x) => (
            <circle key={x} cx={x + 10} cy="185" r="10" fill="#061018" opacity="0.3" />
          ))}

          <g style={{ animation: "pkg-right 3.5s linear infinite" }}>
            <rect x="114" y="151" width="38" height="30" rx="4" fill="#59e1d9" opacity="0.75" />
            <rect x="212" y="153" width="30" height="26" rx="4" fill="#82d949" opacity="0.65" />
            <rect x="296" y="149" width="42" height="32" rx="4" fill="#59e1d9" opacity="0.8" />
          </g>

          {/* Supports and belt bottom share the same ground baseline */}
          <rect x="124" y="195" width="9" height="25" rx="4" fill="#59e1d9" />
          <rect x="292" y="195" width="9" height="25" rx="4" fill="#59e1d9" />
          <rect x="356" y="195" width="9" height="25" rx="4" fill="#59e1d9" />
        </svg>

        {/* Factory RIGHT */}
        <svg width="210" height="224" viewBox="0 0 210 230"
          className="absolute hidden md:block"
          style={{
            right: 0,
            top: "clamp(92px, 14vh, 160px)",
            opacity: 0.7,
            filter: "blur(0px)",
            animation: "wh-bob 13s ease-in-out infinite 4s",
          }}>
          <rect x="34" y="86" width="160" height="118" rx="4" fill="#ff9a5a" />
          <polygon points="34,86 84,58 112,86" fill="#ff9a5a" opacity="0.96" />
          <polygon points="112,86 152,42 194,86" fill="#ff9a5a" />
          <rect x="28" y="44" width="18" height="112" rx="4" fill="#ff9a5a" opacity="0.92" />
          <rect x="48" y="62" width="14" height="94" rx="4" fill="#ff9a5a" opacity="0.78" />
          <rect x="56" y="108" width="34" height="26" rx="3" fill="#061018" opacity="0.34" />
          <rect x="148" y="106" width="32" height="26" rx="3" fill="#061018" opacity="0.32" />
          <rect x="98" y="146" width="48" height="58" rx="3" fill="#061018" opacity="0.4" />
          <ellipse cx="40" cy="28" rx="16" ry="12" fill="#ff9a5a" opacity="0.18" style={{ animation: "smoke-rise-1 5.2s ease-out infinite" }} />
          <ellipse cx="30" cy="12" rx="18" ry="13" fill="#ff9a5a" opacity="0.14" style={{ animation: "smoke-rise-1 5.2s ease-out infinite 1.2s" }} />
          <ellipse cx="57" cy="44" rx="13" ry="10" fill="#ff9a5a" opacity="0.16" style={{ animation: "smoke-rise-2 4.8s ease-out infinite .6s" }} />
          <ellipse cx="69" cy="24" rx="17" ry="12" fill="#ff9a5a" opacity="0.12" style={{ animation: "smoke-rise-2 4.8s ease-out infinite 1.8s" }} />
          <rect x="24" y="201" width="176" height="3" rx="1" fill="#ff9a5a" opacity="0.35" />
        </svg>




        {/* ════════════════════════════════════════════════════════════════
            ZONE D — BOTTOM DOCK: Ship left, crane at ship edge, stacks on far right
            ════════════════════════════════════════════════════════════════ */}

        {/* Cargo ship — docked in the lower-left dock zone */}
        <svg width="280" height="107" viewBox="0 0 360 130"
          className="absolute hidden lg:block"
          style={{
            left: 0,
            bottom: 2,
            opacity: 0.8,
            animation: "ship-bob 7s ease-in-out infinite",
          }}>
          {/* Port / dock block */}
          <rect x="0" y="108" width="360" height="16" rx="4" fill="#59e1d9" opacity="0.18" />
          <rect x="0" y="122" width="360" height="6" rx="2" fill="#061018" opacity="0.34" />
          {/* Hull */}
          <path d="M 26,84 H 272 L 328,98 L 314,110 H 60 L 26,96 Z" fill="#59e1d9" />
          {/* Hull shadow */}
          <path d="M 42,90 H 258 L 294,100 L 286,106 H 72 L 42,96 Z" fill="#061018" opacity="0.35" />
          {/* Deck */}
          <rect x="62" y="70" width="212" height="12" rx="3" fill="#59e1d9" opacity="0.9" />
          {/* Ship cargo bay grid */}
          {[0, 1, 2, 3, 4, 5].map((col) => {
            const x = shipBay.startX + col * (shipBay.width + shipBay.gap);
            return (
              <rect
                key={`bay-${col}`}
                x={x}
                y={shipBay.lowerY}
                width={shipBay.width}
                height={shipBay.height}
                rx="3"
                fill="none"
                stroke="#59e1d9"
                strokeOpacity="0.18"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Lower row loaded containers */}
          {[0, 1, 2, 3, 4].map((col, i) => {
            const x = shipBay.startX + col * (shipBay.width + shipBay.gap);
            const fill = i === 1 || i === 4 ? "#ff9a5a" : "#59e1d9";
            return (
              <g key={`lower-${col}`}>
                <rect x={x + 1} y={shipBay.lowerY + 0.5} width="40" height="23" rx="3" fill={fill} opacity="0.8" />
                <line x1={x + 11} y1={shipBay.lowerY + 1} x2={x + 11} y2={shipBay.lowerY + 23}
                  stroke="#061018" strokeWidth="1.4" opacity="0.24" />
                <line x1={x + 21} y1={shipBay.lowerY + 1} x2={x + 21} y2={shipBay.lowerY + 23}
                  stroke="#061018" strokeWidth="1.4" opacity="0.24" />
                <line x1={x + 31} y1={shipBay.lowerY + 1} x2={x + 31} y2={shipBay.lowerY + 23}
                  stroke="#061018" strokeWidth="1.4" opacity="0.24" />
              </g>
            );
          })}

          {/* Upper row loaded containers */}
          {[0, 1, 2].map((col, i) => {
            const x = shipBay.startX + col * (shipBay.width + shipBay.gap);
            const fill = i === 1 ? "#ff9a5a" : "#59e1d9";
            return (
              <g key={`upper-${col}`}>
                <rect x={x + 1} y={shipBay.upperY + 0.5} width="40" height="23" rx="3" fill={fill} opacity="0.78" />
                <line x1={x + 11} y1={shipBay.upperY + 1} x2={x + 11} y2={shipBay.upperY + 23}
                  stroke="#061018" strokeWidth="1.4" opacity="0.24" />
                <line x1={x + 21} y1={shipBay.upperY + 1} x2={x + 21} y2={shipBay.upperY + 23}
                  stroke="#061018" strokeWidth="1.4" opacity="0.24" />
                <line x1={x + 31} y1={shipBay.upperY + 1} x2={x + 31} y2={shipBay.upperY + 23}
                  stroke="#061018" strokeWidth="1.4" opacity="0.24" />
              </g>
            );
          })}

          {/* Bridge */}
          <rect x="316" y="42" width="28" height="54" rx="4" fill="#59e1d9" opacity="0.82" />
          <rect x="324" y="52" width="7" height="11" rx="2" fill="#061018" opacity="0.35" />
          <rect x="334" y="52" width="7" height="11" rx="2" fill="#061018" opacity="0.35" />
          <rect x="328" y="36" width="8" height="10" rx="2" fill="#59e1d9" opacity="0.7" />

          {/* Target slot derived from the same cargo bay grid as the lifted container */}
          <rect x={targetBayX} y={shipBay.lowerY} width={shipBay.width} height={shipBay.height} rx="3"
            fill="#061018" opacity="0.32" stroke="#59e1d9" strokeWidth="1.5" strokeOpacity="0.55" strokeDasharray="7 5" />
        </svg>

        {/* ─── GANTRY / PORT CRANE — moved to the ship edge to avoid overlapping the hull ── */}
        <svg width="116" height="232" viewBox="0 0 160 320"
          className="absolute hidden md:block"
          style={{
            bottom: 0,
            left: 76,
            opacity: 0.8,
          }}>
          {/* ── Static structure ── */}
          {/* Vertical mast */}
          <rect x="72" y="30" width="16" height="220" rx="4" fill="#59e1d9" />
          {/* Mast cross-braces */}
          <line x1="72" y1="80"  x2="88" y2="110" stroke="#59e1d9" strokeWidth="3" opacity="0.5" />
          <line x1="88" y1="80"  x2="72" y2="110" stroke="#59e1d9" strokeWidth="3" opacity="0.5" />
          <line x1="72" y1="130" x2="88" y2="160" stroke="#59e1d9" strokeWidth="3" opacity="0.5" />
          <line x1="88" y1="130" x2="72" y2="160" stroke="#59e1d9" strokeWidth="3" opacity="0.5" />
          {/* Horizontal boom — extends LEFT */}
          <rect x="10" y="30" width="140" height="12" rx="4" fill="#59e1d9" />
          {/* Boom tip reinforcement */}
          <rect x="10" y="24" width="20" height="24" rx="3" fill="#59e1d9" opacity="0.7" />
          {/* Counter-jib (short, extends RIGHT) */}
          <rect x="130" y="30" width="30" height="10" rx="3" fill="#59e1d9" opacity="0.6" />
          {/* Counter-weight */}
          <rect x="140" y="40" width="18" height="24" rx="4" fill="#59e1d9" opacity="0.5" />
          {/* Mast top cap */}
          <rect x="64" y="22" width="32" height="14" rx="4" fill="#59e1d9" opacity="0.9" />
          {/* Diagonal support cables */}
          <line x1="80" y1="22" x2="10"  y2="36" stroke="#59e1d9" strokeWidth="1.5" opacity="0.5" />
          <line x1="80" y1="22" x2="150" y2="36" stroke="#59e1d9" strokeWidth="1.5" opacity="0.4" />
          {/* ── Animated: cable + hook + container ── */}
          {/* Cable — scaleY animates in sync but CSS transform-origin on SVG is tricky,
              so we animate the whole hook group's Y position instead */}
          <line x1="20" y1="42" x2="20" y2="180"
            stroke="#59e1d9" strokeWidth="2" opacity="0.5"
            style={{ animation: "cable-shorten 5s ease-in-out infinite", transformOrigin: "20px 42px" }}
          />
          {/* Hook group — translates up -72px at peak */}
          <g style={{ animation: "crane-lift 5s ease-in-out infinite" }}>
            {/* Hook arm */}
            <rect x="14" y="178" width="12" height="18" rx="3" fill="#59e1d9" />
            {/* Hook curve */}
            <path d="M 14,196 Q 8,210 18,216 Q 28,222 30,212"
              fill="none" stroke="#59e1d9" strokeWidth="4" strokeLinecap="round" />
            {/* Shipping container sized from the ship bay grid with minimal loading clearance */}
            <rect x="0" y="216" width="40" height="23" rx="3" fill="#59e1d9" opacity="0.82" />
            {/* Container ribbing */}
            <line x1="10" y1="216" x2="10" y2="239" stroke="#061018" strokeWidth="1.8" opacity="0.3" />
            <line x1="20" y1="216" x2="20" y2="239" stroke="#061018" strokeWidth="1.8" opacity="0.3" />
            <line x1="30" y1="216" x2="30" y2="239" stroke="#061018" strokeWidth="1.8" opacity="0.3" />
            {/* Sling chains */}
            <line x1="20" y1="196" x2="8"  y2="216" stroke="#59e1d9" strokeWidth="1.5" opacity="0.6" />
            <line x1="20" y1="196" x2="32" y2="216" stroke="#59e1d9" strokeWidth="1.5" opacity="0.6" />
          </g>
        </svg>


      </div>
    </>
  );
}
