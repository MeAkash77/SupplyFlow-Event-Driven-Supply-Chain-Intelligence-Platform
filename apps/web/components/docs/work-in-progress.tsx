"use client";

import { useEffect, useState } from "react";

// Animated construction/building animation shown for WIP pages
export function WorkInProgress({ eta }: { eta?: string }) {
  const [dots, setDots] = useState(0);
  const [brickRow, setBrickRow] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => setDots((d) => (d + 1) % 4), 500);
    const brickInterval = setInterval(() => setBrickRow((r) => (r + 1) % 6), 800);
    return () => { clearInterval(dotsInterval); clearInterval(brickInterval); };
  }, []);

  const dotStr = ".".repeat(dots).padEnd(3, " ");

  const brickColors = [
    "bg-[hsl(184,73%,61%)]/25",
    "bg-[hsl(25,95%,63%)]/25",
    "bg-[hsl(82,78%,71%)]/20",
    "bg-white/10",
  ];

  const brickLayout = [
    [1, 0, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 0],
  ];

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">

      {/* Animated building */}
      <div className="relative mb-8 flex flex-col-reverse gap-1">
        {/* Crane arm */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="relative flex items-start">
            {/* Tower */}
            <div className="w-2 bg-[hsl(184,73%,61%)]/30 rounded-sm" style={{ height: 48 }} />
            {/* Horizontal boom */}
            <div className="mt-0 h-2 w-32 bg-[hsl(184,73%,61%)]/30 rounded-sm" />
            {/* Hanging cable */}
            <div
              className="absolute w-px bg-[hsl(184,73%,61%)]/40 transition-all duration-700"
              style={{
                left: 128,
                top: 8,
                height: brickRow < 3 ? 32 : 18,
              }}
            />
            {/* Hook/load */}
            <div
              className="absolute transition-all duration-700"
              style={{
                left: 120,
                top: brickRow < 3 ? 36 : 22,
              }}
            >
              <div className="h-4 w-4 rounded border border-[hsl(25,95%,63%)]/40 bg-[hsl(25,95%,63%)]/15" />
            </div>
          </div>
        </div>

        {/* Building rows — build up from bottom */}
        {brickLayout.slice(0, Math.min(brickRow + 1, 6)).map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((offset, ci) => (
              <div
                key={ci}
                className={`h-4 rounded-sm transition-all duration-300 ${brickColors[(ri + offset + ci) % brickColors.length]}`}
                style={{
                  width: offset ? 28 : 20,
                  opacity: ri === Math.min(brickRow, 5) ? 0.6 : 1,
                  transform: ri === Math.min(brickRow, 5) ? "translateY(-2px)" : "translateY(0)",
                }}
              />
            ))}
          </div>
        ))}

        {/* Base/ground */}
        <div className="h-1.5 w-52 rounded-full bg-white/8" />
      </div>

      {/* Scaffolding dots */}
      <div className="mb-3 flex items-center gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[hsl(184,73%,61%)]/30 transition-all duration-300"
            style={{ opacity: i <= brickRow ? 0.9 : 0.2 }}
          />
        ))}
      </div>

      {/* Text */}
      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-brand)" }}>
        Under construction{dotStr}
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-7 text-white/40">
        This section of the docs is being written. EasyFlow is releasing in iterations —
        content for this page is coming shortly.
      </p>

      {eta && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[hsl(25,95%,63%)]/20 bg-[hsl(25,95%,63%)]/8 px-4 py-1.5 text-xs font-medium text-[hsl(25,95%,63%)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(25,95%,63%)] animate-pulse" />
          Expected: {eta}
        </div>
      )}

      <p className="mt-8 text-xs text-white/20">
        Releasing in iterations · More coming soon
      </p>
    </div>
  );
}
