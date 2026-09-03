"use client";

const TEAL   = "#59e1d9";
const ORANGE = "#ff9a5a";
const DARK   = "#061018";
const GREEN  = "#82d949";

// Layout (all absolute in 1400-wide viewBox):
//   Forklift body  x=500–564   forks x=568–620
//   Truck trailer  x=620–816   cab   x=814–874  (cab on RIGHT = drives right)
//   Truck arrives from LEFT (off-screen), stops, gets loaded, drives off RIGHT.

export function TruckLoader() {
  return (
    <div className="flex h-[110px] w-full items-end justify-center overflow-hidden">
      <style>{`
        /* Truck starts around the middle band, loads, then exits through the viewport edge. */
        @keyframes tl-truck {
          0%,  72%  { transform: translateX(0px);    opacity: 1; }
          96%       { transform: translateX(58vw); opacity: 1; }
          99%, 100% { transform: translateX(58vw); opacity: 0; }
        }
        /* Forks lower to load */
        @keyframes tl-forks {
          0%,  18% { transform: translateY(0px);  }
          30%, 48% { transform: translateY(22px); }
          60%,100% { transform: translateY(0px);  }
        }
        /* Crate on forks disappears when placed */
        @keyframes tl-box-forks {
          0%,  18% { opacity: 1; transform: translateY(0px);  }
          30%      { opacity: 1; transform: translateY(22px); }
          38%      { opacity: 0; transform: translateY(22px); }
          100%     { opacity: 0; }
        }
        /* Crate appears inside truck */
        @keyframes tl-box-truck {
          0%,  37% { opacity: 0; }
          47%,100% { opacity: 1; }
        }
        /* Exhaust when truck drives off */
        @keyframes tl-exhaust {
          0%,72% { opacity: 0; transform: translateY(0px); }
          78%    { opacity: 0.5; transform: translateY(-8px); }
          90%    { opacity: 0;   transform: translateY(-18px); }
          100%   { opacity: 0; }
        }
      `}</style>

      <svg
        width="100%"
        height="110"
        viewBox="0 0 1400 110"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden
        style={{ overflow: "visible" }}
      >
        {/* ground — at very bottom */}
        <line x1="0" y1="109" x2="1400" y2="109" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* ── FORKLIFT (orange) — static, left side ─────────────── */}
        {/* body */}
        <rect x="500" y="64" width="64" height="32" rx="3" fill={ORANGE} opacity="0.92" />
        {/* operator cage */}
        <rect x="528" y="50" width="28" height="18" rx="2" fill={ORANGE} opacity="0.65" />
        {/* cage top bar */}
        <rect x="526" y="48" width="32" height="4"  rx="2" fill={ORANGE} opacity="0.75" />
        {/* operator head */}
        <circle cx="542" cy="49" r="5" fill={ORANGE} opacity="0.85" />
        {/* mast */}
        <rect x="562" y="28" width="7" height="68" rx="2" fill={ORANGE} opacity="0.88" />

        {/* forks + crate — animated */}
        <g style={{ animation: "tl-forks 10s ease-in-out infinite", transformOrigin: "569px 60px" }}>
          <rect x="569" y="53" width="52" height="3.5" rx="1.5" fill={ORANGE} />
          <rect x="569" y="63" width="52" height="3.5" rx="1.5" fill={ORANGE} />
          {/* crate on forks */}
          <g style={{ animation: "tl-box-forks 10s ease-in-out infinite" }}>
            <rect x="574" y="32" width="32" height="23" rx="2" fill={GREEN} opacity="0.9" />
            <line x1="590" y1="32" x2="590" y2="55" stroke={DARK} strokeWidth="1.5" opacity="0.3" />
            <line x1="574" y1="43" x2="606" y2="43" stroke={DARK} strokeWidth="1"   opacity="0.2" />
          </g>
        </g>

        {/* forklift wheels — bottom at y=109 (ground) */}
        {[516, 548].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="100" r="9"  fill={DARK}   opacity="0.7" />
            <circle cx={cx} cy="100" r="4"  fill={ORANGE} opacity="0.6" />
          </g>
        ))}


        {/* ── TRUCK (teal) — drives in from left, loads, drives off right ── */}
        <g style={{ animation: "tl-truck 10s ease-in-out infinite" }}>
          {/* exhaust puff */}
          <ellipse cx="877" cy="50" rx="8" ry="5" fill={TEAL} opacity="0.45"
            style={{ animation: "tl-exhaust 10s ease-out infinite", transformOrigin: "877px 50px" }} />

          {/* trailer */}
          <rect x="620" y="42" width="196" height="50" rx="3" fill={TEAL} opacity="0.88" />
          <line x1="718" y1="42" x2="718" y2="92" stroke={DARK} strokeWidth="1.5" opacity="0.18" />
          <line x1="669" y1="42" x2="669" y2="92" stroke={DARK} strokeWidth="1"   opacity="0.12" />

          {/* crate inside truck (appears after loading) */}
          <g style={{ animation: "tl-box-truck 10s ease-in-out infinite" }}>
            <rect x="630" y="50" width="34" height="30" rx="2" fill={GREEN} opacity="0.9" />
            <line x1="647" y1="50" x2="647" y2="80" stroke={DARK} strokeWidth="1.5" opacity="0.3" />
            <line x1="630" y1="65" x2="664" y2="65" stroke={DARK} strokeWidth="1"   opacity="0.2" />
          </g>

          {/* cab */}
          <rect x="814" y="46" width="60" height="46" rx="4" fill={TEAL} />
          {/* windshield */}
          <rect x="822" y="52" width="38" height="24" rx="2" fill={DARK} opacity="0.45" />
          {/* exhaust pipe */}
          <rect x="871" y="38" width="6"  height="14" rx="2" fill={TEAL} opacity="0.7" />
          {/* headlight */}
          <rect x="872" y="64" width="4"  height="7"  rx="1" fill="#fffde0" opacity="0.75" />

          {/* wheels — bottom at y=109 (ground) */}
          {[650, 750, 828].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="98" r="11" fill={DARK}  opacity="0.72" />
              <circle cx={cx} cy="98" r="5"  fill={TEAL}  opacity="0.55" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
