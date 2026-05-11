"use client";

import { cn } from "@/lib/utils";
import type { Tap } from "../_hooks/useInnerTakt";

type Props = { taps: Tap[] };

const TOLERANCE_MS = 60;

export const TimingTrack = ({ taps }: Props) => {
  const recent = taps.slice(-32);

  return (
    <div className="w-full bg-card text-card-foreground p-6">
      <div className="flex justify-between mb-3">
        <span className="text-sm font-bold tracking-wider text-muted-foreground">
          TIMING DEVIATION
        </span>
        <span className="text-sm tracking-wide text-muted-foreground">
          ±{TOLERANCE_MS}ms
        </span>
      </div>
      <div className="flex gap-4">
        <div className="flex flex-col justify-between py-0.5 w-8 shrink-0">
          <span className="text-xs text-muted-foreground leading-none">
            EARLY
          </span>
          <span className="text-xs text-muted-foreground leading-none">
            LATE
          </span>
        </div>
        <div className="relative h-32 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-px bg-muted-foreground" />
          <div
            className="absolute inset-x-0 border-y border-dashed border-primary/15 bg-primary/5"
            style={{
              top: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
              bottom: `${50 - 25 * (15 / TOLERANCE_MS)}%`,
            }}
          />
          {recent.map((tap, i) => {
            const x = (i / Math.max(1, recent.length - 1)) * 100;
            const yPct = Math.max(
              -1,
              Math.min(1, tap.deviationMs / TOLERANCE_MS),
            );
            const y = 50 + yPct * 50;
            const absDev = Math.abs(tap.deviationMs);
            const toneClass =
              absDev < 25
                ? "bg-secondary shadow-secondary/50"
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
                  opacity: 0.4 + 0.6 * (i / Math.max(1, recent.length)),
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
