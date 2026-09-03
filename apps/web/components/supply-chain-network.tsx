"use client";

// Animated supply chain flow network — connects every node with
// flowing dotted paths and moving cargo dots. Positions are tuned
// to match the approximate screen locations of each SupplyChainBg element.

const TS  = "hsl(184,73%,61%)";     // teal
const TSO = "hsl(184,73%,61%,0.45)"; // teal semi

export function SupplyChainNetwork() {
  return (
    <>
      <style>{`
        /* flowing dashes along each route */
        @keyframes scn-flow-a { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
        @keyframes scn-flow-b { from { stroke-dashoffset: 400; } to { stroke-dashoffset: 0; } }
        @keyframes scn-flow-c { from { stroke-dashoffset: 500; } to { stroke-dashoffset: 0; } }
        @keyframes scn-flow-d { from { stroke-dashoffset: 350; } to { stroke-dashoffset: 0; } }
        @keyframes scn-flow-e { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }

        /* cargo dot sliding along each path */
        @keyframes scn-dot-a {
          0%   { offset-distance: 0%;   opacity:0; }
          5%   { opacity:1; }
          95%  { opacity:1; }
          100% { offset-distance: 100%; opacity:0; }
        }

        .scn-dot { animation: scn-dot-a 4s linear infinite; }
        .scn-dot-b { animation: scn-dot-a 5s linear infinite 1s; }
        .scn-dot-c { animation: scn-dot-a 3.5s linear infinite 0.5s; }
        .scn-dot-d { animation: scn-dot-a 4.5s linear infinite 2s; }
        .scn-dot-e { animation: scn-dot-a 6s linear infinite 1.5s; }

        /* node pulse */
        @keyframes scn-pulse {
          0%,100% { r: 4px; opacity:0.5; }
          50%     { r: 7px; opacity:0.9; }
        }
        .scn-node { animation: scn-pulse 2.5s ease-in-out infinite; }
        .scn-node-b { animation: scn-pulse 2.5s ease-in-out infinite 0.8s; }
        .scn-node-c { animation: scn-pulse 2.5s ease-in-out infinite 1.6s; }
        .scn-node-d { animation: scn-pulse 2.5s ease-in-out infinite 0.4s; }
        .scn-node-e { animation: scn-pulse 2.5s ease-in-out infinite 1.2s; }
      `}</style>

      {/*
        Layout (approx % positions of each supply chain node):
          Factory      — right:7%,  top:24%   → (93%, 24%)
          Warehouse    — left:14%,  top:38%   → (14%, 38%)
          Port/Ship    — left:12%,  bottom:26% → (12%, 74%)
          Crane        — left:17%,  bottom:34% → (17%, 66%)
          Truck scene  — centre-right, bottom:22% → (55%, 78%)
          Plane        — flies top-left to top-right ~top:12%

        Flow routes:
          A  Factory   → Truck scene   (production to dispatch)
          B  Warehouse → Truck scene   (storage to dispatch)
          C  Truck     → Port/Ship     (road to sea)
          D  Port      → Crane         (dock activity, internal)
          E  Warehouse → Factory       (supply loop)
      */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
        style={{ zIndex: 3, opacity: 0.72 }}
      >
        <defs>
          {/* Cargo dot shapes for each route */}
          <circle id="scn-c-a" cx="0" cy="0" r="0.6" fill={TS} />
          <circle id="scn-c-b" cx="0" cy="0" r="0.6" fill={TS} />
          <circle id="scn-c-c" cx="0" cy="0" r="0.7" fill="rgba(255,255,255,0.7)" />
          <circle id="scn-c-d" cx="0" cy="0" r="0.5" fill={TS} />
          <circle id="scn-c-e" cx="0" cy="0" r="0.55" fill={TSO} />
        </defs>

        {/* ── Route A: Factory (93%,24%) → Truck scene (56%,78%) ── */}
        <path id="scn-path-a"
          d="M 93,24 C 88,42 72,55 56,78"
          fill="none" stroke={TSO} strokeWidth="0.22"
          strokeDasharray="2 2"
          style={{ animation:"scn-flow-c 3s linear infinite" }}
        />
        <use href="#scn-c-a" style={{
          offsetPath: "path('M 93,24 C 88,42 72,55 56,78')",
          offsetRotate: "auto",
        }} className="scn-dot" />
        <use href="#scn-c-a" style={{
          offsetPath: "path('M 93,24 C 88,42 72,55 56,78')",
          offsetRotate: "auto",
          animationDelay: "2s",
        }} className="scn-dot" />

        {/* ── Route B: Warehouse (14%,48%) → Truck scene (56%,78%) ── */}
        <path id="scn-path-b"
          d="M 14,48 C 28,52 42,62 56,78"
          fill="none" stroke={TSO} strokeWidth="0.22"
          strokeDasharray="2 2"
          style={{ animation:"scn-flow-a 2.8s linear infinite" }}
        />
        <use href="#scn-c-b" style={{
          offsetPath: "path('M 14,48 C 28,52 42,62 56,78')",
          offsetRotate: "auto",
        }} className="scn-dot-b" />

        {/* ── Route C: Truck (56%,78%) → Port (12%,74%) ── */}
        <path id="scn-path-c"
          d="M 56,78 C 40,80 26,78 12,74"
          fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.20"
          strokeDasharray="1.5 2.5"
          style={{ animation:"scn-flow-b 4s linear infinite" }}
        />
        <use href="#scn-c-c" style={{
          offsetPath: "path('M 56,78 C 40,80 26,78 12,74')",
          offsetRotate: "auto",
        }} className="scn-dot-c" />
        <use href="#scn-c-c" style={{
          offsetPath: "path('M 56,78 C 40,80 26,78 12,74')",
          offsetRotate: "auto",
          animationDelay: "2.5s",
        }} className="scn-dot-c" />

        {/* ── Route D: Port (12%,74%) → Crane (17%,62%) ── (internal dock) */}
        <path id="scn-path-d"
          d="M 12,74 C 13,70 15,66 17,62"
          fill="none" stroke={TSO} strokeWidth="0.18"
          strokeDasharray="1 2"
          style={{ animation:"scn-flow-d 2s linear infinite" }}
        />
        <use href="#scn-c-d" style={{
          offsetPath: "path('M 12,74 C 13,70 15,66 17,62')",
          offsetRotate: "auto",
        }} className="scn-dot-d" />

        {/* ── Route E: Warehouse (14%,48%) → Factory (93%,24%) supply loop ── */}
        <path id="scn-path-e"
          d="M 14,45 C 30,28 66,24 93,24"
          fill="none" stroke={TSO} strokeWidth="0.18"
          strokeDasharray="1.5 3"
          style={{ animation:"scn-flow-e 5s linear infinite" }}
        />
        <use href="#scn-c-e" style={{
          offsetPath: "path('M 14,45 C 30,28 66,24 93,24')",
          offsetRotate: "auto",
        }} className="scn-dot-e" />

        {/* ── Node dots at each hub ── */}
        {/* Factory */}
        <circle cx="93" cy="24" fill={TS} className="scn-node" />
        {/* Warehouse */}
        <circle cx="14" cy="47" fill={TS} className="scn-node-b" />
        {/* Port */}
        <circle cx="12" cy="74" fill={TS} className="scn-node-c" />
        {/* Crane */}
        <circle cx="17" cy="62" fill="rgba(255,255,255,0.6)" className="scn-node-d" />
        {/* Truck dispatch */}
        <circle cx="56" cy="78" fill={TS} className="scn-node-e" />
      </svg>
    </>
  );
}
