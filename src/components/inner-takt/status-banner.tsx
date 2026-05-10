"use client";

type Props = {
  running: boolean;
  isSilent: boolean;
  cycleProgress: { pos: number; total: number } | null;
};

export const StatusBanner = ({ running, isSilent, cycleProgress }: Props) => {
  const dotColor = !running ? "#33334a" : isSilent ? "#ef4444" : "#22d3ee";
  const textColor = !running ? "#44445a" : isSilent ? "#ef4444" : "#22d3ee";
  const bgColor = isSilent && running ? "#180c10" : "#0e0d18";
  const borderColor = isSilent && running ? "#3a1820" : "#1e1d2c";
  const text = !running
    ? "PRESS SPACE TO BEGIN"
    : isSilent
      ? "SILENT — KEEP THE TAKT"
      : "AUDIBLE";

  return (
    <div
      className="flex items-center justify-center gap-3 rounded-full px-6 py-2.5 transition-all duration-300 min-w-[320px]"
      style={{
        background: bgColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div
        className="rounded-full transition-all duration-300"
        style={{
          width: 10,
          height: 10,
          background: dotColor,
          boxShadow: running ? `0 0 12px ${dotColor}` : "none",
        }}
      />
      <span
        className="text-[11px] font-bold tracking-[0.18em]"
        style={{ color: textColor }}
      >
        {text}
      </span>
      {cycleProgress && (
        <span className="text-[10px] tracking-[0.1em] text-zinc-500 ml-1.5">
          {cycleProgress.pos + 1} / {cycleProgress.total}
        </span>
      )}
    </div>
  );
};
