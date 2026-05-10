"use client";

import { cn } from "@/lib/utils";

const DOT_STYLES = {
  idle: "bg-zinc-700 shadow-md shadow-zinc-700/50",
  silent: "bg-red-500 shadow-md shadow-red-500/60",
  running: "bg-cyan-400 shadow-md shadow-cyan-400/60",
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
        colorClass,
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
        isSilent && isRunning
          ? "border-red-950 bg-red-950/30"
          : "border-zinc-800 bg-zinc-950",
      )}
    >
      <Dot isRunning={isRunning} isSilent={isSilent} />
      <span
        className={cn(
          !isRunning
            ? "text-zinc-600"
            : isSilent
              ? "text-red-500"
              : "text-cyan-400",
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
