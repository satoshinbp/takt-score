"use client";

import type { Tap } from "../_hooks/useInnerTakt";

type Props = { taps: Tap[] };

const TOLERANCE_MS = 60;

export const TimingTrack = ({ taps }: Props) => {
  const recent = taps.slice(-32);

  return (
    <div className="w-full max-w-[600px] rounded-xl border border-zinc-800 bg-zinc-950/80 px-6 py-5">
      <div className="flex justify-between mb-3">
        <span className="text-[9px] font-bold tracking-[0.14em] text-zinc-400">
          TIMING DEVIATION
        </span>
        <span className="text-[9px] tracking-[0.08em] text-zinc-600">
          ±{TOLERANCE_MS}ms
        </span>
      </div>
      <div className="relative h-20">
        <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-700" />
        <div
          className="absolute inset-x-0"
          style={{
            top: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
            bottom: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
            background: "rgba(34, 211, 238, 0.03)",
            borderTop: "1px dashed rgba(34, 211, 238, 0.13)",
            borderBottom: "1px dashed rgba(34, 211, 238, 0.13)",
          }}
        />
        <span className="absolute left-0 top-0 text-[8px] text-zinc-600">
          EARLY
        </span>
        <span className="absolute left-0 bottom-0 text-[8px] text-zinc-600">
          LATE
        </span>
        {recent.map((tap, i) => {
          const x = (i / Math.max(1, recent.length - 1)) * 100;
          const yPct = Math.max(
            -1,
            Math.min(1, tap.deviationMs / TOLERANCE_MS),
          );
          const y = 50 + yPct * 50;
          const absDev = Math.abs(tap.deviationMs);
          const color =
            absDev < 25 ? "#22d3ee" : absDev < 50 ? "#f97316" : "#ef4444";
          return (
            <div
              key={`${tap.timeSec}-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: 8,
                height: 8,
                background: color,
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 8px ${color}88`,
                opacity: 0.4 + 0.6 * (i / Math.max(1, recent.length)),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
