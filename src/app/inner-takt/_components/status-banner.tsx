"use client";

import { cn } from "@/lib/utils";

const DOT_STYLES = {
  idle: "bg-muted-foreground shadow-md shadow-muted-foreground/50",
  silent: "bg-destructive shadow-md shadow-destructive/60",
  running: "bg-chart-regular shadow-md shadow-chart-regular/60",
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
            ? "text-muted-foreground"
            : isSilent
              ? "text-destructive"
              : "text-chart-regular"
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
