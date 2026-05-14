"use client";

import { cn } from "@/lib/utils";

const DOT_STYLES = {
  idle: "bg-zinc-700 shadow-md shadow-zinc-700/50",
  silent: "bg-red-500 shadow-md shadow-red-500/60",
  running: "bg-chart-primary shadow-md shadow-chart-primary/60",
};

const Dot = ({
  isRunning,
  isSilent,
}: {
  isRunning: boolean;
  isSilent: boolean;
}) => {
  const colorClass = !isRunning
    ? DOT_STYLES.idle
    : isSilent
      ? DOT_STYLES.silent
      : DOT_STYLES.running;

  return (
    <div
      className={cn(
        "size-2 rounded-full transition-all duration-300",
        colorClass
      )}
    />
  );
};

type Props = {
  isRunning: boolean;
  isSilent: boolean;
  cycleProgress: { pos: number; total: number } | null;
};

const StatusBanner = ({ isRunning, isSilent, cycleProgress }: Props) => {
  const text = !isRunning
    ? "PRESS SPACE TO BEGIN"
    : isSilent
      ? "SILENT — KEEP THE TAKT"
      : "AUDIBLE";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 px-6 py-2.5 min-w-[320px] border",
        "text-xs font-bold tracking-wider transition-all duration-300",
        isSilent && isRunning && "border-destructive bg-destructive/10"
      )}
    >
      <Dot isRunning={isRunning} isSilent={isSilent} />
      <span
        className={cn(
          !isRunning
            ? "text-zinc-600"
            : isSilent
              ? "text-destructive"
              : "text-chart-primary"
        )}
      >
        {text}
      </span>
      {cycleProgress && (
        <span>
          {cycleProgress.pos + 1} / {cycleProgress.total}
        </span>
      )}
    </div>
  );
};

export default StatusBanner;
