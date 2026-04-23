"use client";

import * as Toggle from "@radix-ui/react-toggle";

type Props = {
  isPlaying: boolean;
  onToggle: () => void;
  bpm: number;
  onBpmChange: (v: number) => void;
  loop: boolean;
  onLoopToggle: () => void;
  currentMeasure: number;
  currentBeat: number;
};

export function Transport({
  isPlaying,
  onToggle,
  bpm,
  onBpmChange,
  loop,
  onLoopToggle,
  currentMeasure,
  currentBeat,
}: Props) {
  return (
    <div className="flex items-center gap-3.5 px-[18px] py-2.5 flex-shrink-0 border-t border-[var(--border)] bg-[var(--surface-1)]">
      {/* Play / Pause */}
      <Toggle.Root
        pressed={isPlaying}
        onPressedChange={onToggle}
        className={`w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all duration-[130ms] hover:scale-105 text-[#09090c] ${isPlaying ? "bg-[var(--danger)]" : "bg-[var(--accent)]"}`}
      >
        {isPlaying ? "⏸" : "▶"}
      </Toggle.Root>

      {/* BPM */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
        <span>BPM</span>
        <input
          type="number"
          value={bpm}
          min={30}
          max={300}
          onChange={(e) => onBpmChange(+e.target.value)}
          onBlur={(e) => onBpmChange(Math.max(30, Math.min(300, +e.target.value)))}
          className="w-[58px] text-center text-[15px] font-semibold px-1.5 py-0.5 rounded font-mono bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)]"
        />
      </div>

      {/* Position */}
      <div className="text-xs font-mono text-[var(--text-muted)]">
        {isPlaying ? (
          <>
            <strong className="text-[var(--text)]">
              {String(currentMeasure + 1).padStart(2, "0")}
            </strong>
            :{currentBeat + 1}
          </>
        ) : (
          <span>--:--</span>
        )}
      </div>

      {/* Loop toggle */}
      <div className="ml-auto">
        <Toggle.Root
          pressed={loop}
          onPressedChange={onLoopToggle}
          className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-all duration-[120ms] ${loop ? "border border-[rgba(245,200,66,.35)] bg-[var(--accent-subtle)] text-[var(--accent)]" : "border border-[var(--border)] bg-transparent text-[var(--text-dim)]"}`}
          title="Loop"
        >
          ⟳
        </Toggle.Root>
      </div>
    </div>
  );
}
