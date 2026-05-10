"use client";

import { cn } from "@/lib/utils";
import type { Tap } from "../_hooks/useInnerTakt";

type Props = { taps: Tap[] };

type CellProps = {
  label: string;
  value: string;
  suffix?: string;
  tone?: "idle" | "light" | "cyan" | "orange";
};

const VALUE_TONE_CLASS = {
  idle: "text-zinc-700",
  light: "text-zinc-100",
  cyan: "text-secondary",
  orange: "text-orange-500",
};

const Cell = ({ label, value, suffix, tone = "idle" }: CellProps) => (
  <div className="text-center min-w-[70px]">
    <div
      className={cn("text-2xl font-bold leading-none", VALUE_TONE_CLASS[tone])}
    >
      {value}
      {suffix && (
        <span className="text-sm text-muted-foreground ml-0.5">{suffix}</span>
      )}
    </div>
    <div
      className={cn(
        "text-xs font-bold tracking-wider mt-1.5",
        tone === "idle" ? "text-muted" : "text-muted-foreground",
      )}
    >
      {label}
    </div>
  </div>
);

export const StatsPanel = ({ taps }: Props) => {
  if (taps.length === 0) {
    return (
      <div className="flex gap-4">
        {["MEAN", "STDEV", "BEST", "WORST"].map((l) => (
          <Cell key={l} label={l} value="—" />
        ))}
      </div>
    );
  }

  const devs = taps.map((t) => t.deviationMs);
  const abs = devs.map(Math.abs);
  const mean = devs.reduce((a, b) => a + b, 0) / devs.length;
  const variance = devs.reduce((a, b) => a + (b - mean) ** 2, 0) / devs.length;
  const std = Math.sqrt(variance);
  const best = Math.min(...abs);
  const worst = Math.max(...abs);

  const meanLabel = `${mean >= 0 ? "+" : ""}${Math.round(mean)}`;

  return (
    <div className="flex gap-4">
      <Cell label="MEAN" value={meanLabel} suffix="ms" tone="light" />
      <Cell
        label="STDEV"
        value={String(Math.round(std))}
        suffix="ms"
        tone="cyan"
      />
      <Cell
        label="BEST"
        value={String(Math.round(best))}
        suffix="ms"
        tone="cyan"
      />
      <Cell
        label="WORST"
        value={String(Math.round(worst))}
        suffix="ms"
        tone="orange"
      />
    </div>
  );
};
