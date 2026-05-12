"use client";

import { cn } from "@/lib/utils";
import type { Tap } from "../_hooks/useInnerTakt";

type Props = { taps: Tap[] };

const TOLERANCE_MS = 60;
const TAPS_TO_SHOW = 32;

const TimingChart = ({ taps }: Props) => (
  <div className="relative h-32 flex-1">
    <div className="absolute inset-x-0 top-1/2 h-px bg-muted-foreground" />
    <div
      className="absolute inset-x-0 border-y border-dashed border-cyan-400/15 bg-cyan-400/5"
      style={{
        top: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
        bottom: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
      }}
    />
    {taps.map((tap, i) => {
      const x = (i / Math.max(1, TAPS_TO_SHOW - 1)) * 100;
      const yPct = Math.max(-1, Math.min(1, tap.deviationMs / TOLERANCE_MS));
      const y = 50 + yPct * 50;
      const absDev = Math.abs(tap.deviationMs);
      const toneClass =
        absDev < 25
          ? "bg-cyan-400 shadow-cyan-400/50"
          : absDev < 50
            ? "bg-orange-500 shadow-orange-500/50"
            : "bg-red-500 shadow-red-500/50";

      return (
        <div
          key={`${tap.timeSec}-${i}`}
          className={cn("absolute rounded-full shadow-md", toneClass)}
          style={{
            left: `${x}%`,
            top: `${y}%`,
            width: 8,
            height: 8,
            transform: "translate(-50%, -50%)",
            opacity: 0.4 + 0.6 * (i / Math.max(1, TAPS_TO_SHOW - 1)),
          }}
        />
      );
    })}
  </div>
);

const TimingTrack = ({ taps }: Props) => {
  const recent = taps.slice(-TAPS_TO_SHOW);

  return (
    <div className="w-full bg-card text-card-foreground p-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-bold tracking-wider text-muted-foreground">
          TIMING DEVIATION
        </span>
        <span className="text-sm tracking-wide text-muted-foreground">
          ±{TOLERANCE_MS}ms
        </span>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col justify-between w-8 shrink-0">
          <span className="text-xs text-muted-foreground leading-none">
            EARLY
          </span>
          <span className="text-xs text-muted-foreground leading-none">
            LATE
          </span>
        </div>
        <TimingChart taps={recent} />
      </div>
    </div>
  );
};

export default TimingTrack;
