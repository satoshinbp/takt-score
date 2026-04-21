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
    <div
      className="flex items-center gap-3.5 px-[18px] py-2.5 flex-shrink-0 border-t"
      style={{ background: "var(--s1)", borderColor: "var(--bd)" }}
    >
      {/* Play / Pause */}
      <Toggle.Root
        pressed={isPlaying}
        onPressedChange={onToggle}
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-sm flex-shrink-0 transition-all duration-[130ms] hover:scale-105"
        style={{
          background: isPlaying ? "var(--danger)" : "var(--acc)",
          color: "#09090c",
        }}
      >
        {isPlaying ? "⏸" : "▶"}
      </Toggle.Root>

      {/* BPM */}
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--td)" }}>
        <span>BPM</span>
        <input
          type="number"
          value={bpm}
          min={30}
          max={300}
          onChange={(e) => onBpmChange(+e.target.value)}
          onBlur={(e) => onBpmChange(Math.max(30, Math.min(300, +e.target.value)))}
          className="w-[58px] text-center text-[15px] font-semibold px-1.5 py-0.5 rounded"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            background: "var(--s2)",
            border: "1px solid var(--bd)",
            color: "var(--t)",
          }}
        />
      </div>

      {/* Position */}
      <div
        className="text-xs"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--tm)" }}
      >
        {isPlaying ? (
          <>
            <strong style={{ color: "var(--t)" }}>
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
          className="w-7 h-7 flex items-center justify-center rounded text-sm transition-all duration-[120ms]"
          style={{
            border: loop ? "1px solid rgba(245,200,66,.35)" : "1px solid var(--bd)",
            background: loop ? "var(--acc-d)" : "transparent",
            color: loop ? "var(--acc)" : "var(--td)",
          }}
          title="Loop"
        >
          ⟳
        </Toggle.Root>
      </div>
    </div>
  );
}
