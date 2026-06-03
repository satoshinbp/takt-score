"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { Tap } from "../_hooks/useInnerTakt";

type Props = { taps: Tap[] };

type CellProps = {
  label: string;
  value: string;
  suffix?: string;
  tone?: "idle" | "light" | "regular" | "accent";
};

const VALUE_TONE_CLASS = {
  idle: "text-muted-foreground",
  light: "text-muted-foreground",
  regular: "text-chart-regular",
  accent: "text-chart-accent",
};

const Cell = ({ label, value, suffix, tone = "idle" }: CellProps) => (
  <div className="text-center min-w-[70px]">
    <div
      className={cn("text-2xl font-bold leading-none", VALUE_TONE_CLASS[tone])}
    >
      {value}
      {suffix && (
        <span className="text-sm text-muted-foreground ml-0.5 leading-none">
          {suffix}
        </span>
      )}
    </div>
    <div className="text-xs font-bold tracking-wider mt-1.5 text-muted-foreground">
      {label}
    </div>
  </div>
);

const StatsPanel = ({ taps }: Props) => {
  const { t } = useTranslation();
  const labels = {
    mean: t("innerTakt.stats.mean"),
    stdev: t("innerTakt.stats.stdev"),
    best: t("innerTakt.stats.best"),
    worst: t("innerTakt.stats.worst"),
  };

  if (taps.length === 0) {
    return (
      <div className="flex gap-4">
        {Object.values(labels).map((l) => (
          <Cell key={l} label={l} value="—" />
        ))}
      </div>
    );
  }

  const devs = taps.map((tap) => tap.deviationMs);
  const abs = devs.map(Math.abs);
  const mean = devs.reduce((a, b) => a + b, 0) / devs.length;
  const variance = devs.reduce((a, b) => a + (b - mean) ** 2, 0) / devs.length;
  const std = Math.sqrt(variance);
  const best = Math.min(...abs);
  const worst = Math.max(...abs);

  const meanLabel = `${mean >= 0 ? "+" : ""}${Math.round(mean)}`;

  return (
    <div className="flex gap-4">
      <Cell label={labels.mean} value={meanLabel} suffix="ms" tone="light" />
      <Cell
        label={labels.stdev}
        value={String(Math.round(std))}
        suffix="ms"
        tone="accent"
      />
      <Cell
        label={labels.best}
        value={String(Math.round(best))}
        suffix="ms"
        tone="accent"
      />
      <Cell
        label={labels.worst}
        value={String(Math.round(worst))}
        suffix="ms"
        tone="regular"
      />
    </div>
  );
};

export default StatsPanel;
