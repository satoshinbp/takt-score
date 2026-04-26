"use client";

import * as Toggle from "@radix-ui/react-toggle";
import { cn } from "@/lib/utils";

type Props = {
  isPlaying: boolean;
  onToggle: () => void;
  onStop?: () => void;
  bpm: number;
  onBpmChange: (v: number) => void;
  loop: boolean;
  onLoopToggle: () => void;
  currentMeasure: number;
  currentBeat: number;
}

export const Transport = ({
  isPlaying,
  onToggle,
  onStop,
  bpm,
  onBpmChange,
  loop,
  onLoopToggle,
  currentMeasure,
  currentBeat,
}: Props) => {
  return (
    <div className="flex items-center gap-3.5 px-4 py-2.5 flex-shrink-0 border-t border-border bg-background">
      {/* Play / Pause */}
      <Toggle.Root
        pressed={isPlaying}
        onPressedChange={onToggle}
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0",
          "transition-all duration-150 hover:scale-105 text-accent-foreground",
          isPlaying ? "bg-destructive" : "bg-accent",
        )}
      >
        {isPlaying ? "⏸" : "▶"}
      </Toggle.Root>

      {/* Stop */}
      {onStop && (
        <button
          type="button"
          onClick={onStop}
          className={cn(
            "w-8 h-8 rounded flex items-center justify-center text-sm flex-shrink-0",
            "transition-all duration-150 hover:bg-card border border-border text-muted hover:text-foreground",
          )}
          title="停止"
        >
          ⏹
        </button>
      )}

      {/* BPM */}
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span>BPM</span>
        <input
          type="number"
          value={bpm}
          min={30}
          max={300}
          onChange={(e) => onBpmChange(+e.target.value)}
          onBlur={(e) =>
            onBpmChange(Math.max(30, Math.min(300, +e.target.value)))
          }
          className={cn(
            "w-14 text-center text-sm font-semibold px-1.5 py-0.5 rounded font-mono",
            "bg-card border border-border text-foreground",
          )}
        />
      </div>

      {/* Position */}
      <div className="text-xs font-mono text-muted">
        {currentMeasure >= 0 ? (
          <>
            <strong className="text-foreground">
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
          className={cn(
            "w-7 h-7 flex items-center justify-center rounded text-sm transition-all duration-150",
            loop
              ? "border border-accent/30 text-accent"
              : "border border-border bg-transparent text-muted",
          )}
          title="Loop"
        >
          ⟳
        </Toggle.Root>
      </div>
    </div>
  );
}
