"use client";

import type { Tap } from "@/hooks/useInnerTakt";

type Props = { taps: Tap[] };

type CellProps = {
  label: string;
  value: string;
  suffix?: string;
  color?: string;
};

const Cell = ({ label, value, suffix, color }: CellProps) => (
  <div className="text-center min-w-[70px]">
    <div
      className="text-[22px] font-extrabold leading-none"
      style={{ color: color ?? "#33334a" }}
    >
      {value}
      {suffix && (
        <span className="text-[11px] text-zinc-500 ml-0.5">{suffix}</span>
      )}
    </div>
    <div
      className="text-[9px] font-bold tracking-[0.14em] mt-1.5"
      style={{ color: color ? "#5a5a78" : "#33334a" }}
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
  const variance =
    devs.reduce((a, b) => a + (b - mean) ** 2, 0) / devs.length;
  const std = Math.sqrt(variance);
  const best = Math.min(...abs);
  const worst = Math.max(...abs);

  const meanLabel = `${mean >= 0 ? "+" : ""}${Math.round(mean)}`;

  return (
    <div className="flex gap-4">
      <Cell label="MEAN" value={meanLabel} suffix="ms" color="#e8e8f8" />
      <Cell
        label="STDEV"
        value={String(Math.round(std))}
        suffix="ms"
        color="#22d3ee"
      />
      <Cell
        label="BEST"
        value={String(Math.round(best))}
        suffix="ms"
        color="#22d3ee"
      />
      <Cell
        label="WORST"
        value={String(Math.round(worst))}
        suffix="ms"
        color="#f97316"
      />
    </div>
  );
};
