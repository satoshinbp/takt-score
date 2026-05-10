"use client";

import { cn } from "@/lib/utils";

const Dot = ({
  isRunning,
  isSilent,
}: {
  isRunning: boolean;
  isSilent: boolean;
}) => {
  const color = !isRunning ? "#33334a" : isSilent ? "#ef4444" : "#22d3ee";

  return (
    <div
      className="size-2 rounded-full transition-all duration-300"
      style={{
        background: color,
        boxShadow: `0 0 12px ${color}`,
      }}
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
          ? "bg-[#180c10] border-[#3a1820]"
          : "bg-[#0e0d18] border-[#1e1d2c]",
      )}
    >
      <Dot isRunning={isRunning} isSilent={isSilent} />
      <span
        className={cn(
          !isRunning
            ? "text-[#44445a]"
            : isSilent
              ? "text-[#ef4444]"
              : "text-[#22d3ee]",
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
