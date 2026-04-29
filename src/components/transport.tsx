"use client";

import { Pause, Play, Repeat, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

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
};

const Transport = ({
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
    <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0 border-t bg-background">
      <Toggle
        pressed={isPlaying}
        onPressedChange={onToggle}
        title={isPlaying ? "一時停止" : "再生"}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
      </Toggle>

      {onStop && (
        <Button
          type="button"
          variant="ghost"
          onClick={onStop}
          size="icon"
          title="停止"
        >
          <Square size={12} />
        </Button>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
        <span>BPM</span>
        <Input
          type="number"
          value={bpm}
          min={30}
          max={300}
          onChange={(e) => onBpmChange(+e.target.value)}
          onBlur={(e) =>
            onBpmChange(Math.max(30, Math.min(300, +e.target.value)))
          }
        />
      </div>

      <div className="text-xs font-mono text-muted-foreground">
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

      <div className="ml-auto">
        <Toggle pressed={loop} onPressedChange={onLoopToggle} title="ループ">
          <Repeat size={12} />
        </Toggle>
      </div>
    </div>
  );
};

export default Transport;
