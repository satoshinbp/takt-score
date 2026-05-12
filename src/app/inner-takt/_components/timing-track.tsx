"use client";

import { cn } from "@/lib/utils";
import type { Tap } from "../_hooks/useInnerTakt";

type Props = { taps: Tap[] };

const TOLERANCE_MS = 60;
const GOOD_MS = 25;
const OK_MS = 50;
const TAPS_TO_SHOW = 32;

const TimingChart = ({ taps }: Props) => {
  const recent = taps.slice(-TAPS_TO_SHOW);

  return (
    <div className="relative h-32 flex-1">
      <div className="absolute inset-x-0 top-1/2 h-px bg-muted-foreground" />
      <div
        className="absolute inset-x-0 border-y border-dashed border-cyan-400/15 bg-cyan-400/5"
        style={{
          top: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
          bottom: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
        }}
      />
      {recent.map((tap, i) => {
        const x = (i / Math.max(1, TAPS_TO_SHOW - 1)) * 100;
        const yPct = Math.max(-1, Math.min(1, tap.deviationMs / TOLERANCE_MS));
        const y = 50 + yPct * 50;
        const absDev = Math.abs(tap.deviationMs);
        const toneClass =
          absDev < GOOD_MS
            ? "bg-cyan-400 shadow-cyan-400/50"
            : absDev < OK_MS
              ? "bg-orange-500 shadow-orange-500/50"
              : "bg-red-500 shadow-red-500/50";

        return (
          <div
            key={`${tap.timeSec}-${i}`}
            className={cn(
              "absolute size-2 rounded-full shadow-md -translate-x-1/2 -translate-y-1/2",
              toneClass
            )}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              opacity: 1 - 0.6 * ((recent.length - 1 - i) / (TAPS_TO_SHOW - 1)),
            }}
          />
        );
      })}
    </div>
  );
};

const TimingTrack = ({ taps }: Props) => {
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
        <TimingChart taps={taps} />
      </div>
    </div>
  );
};

export default TimingTrack;
