"use client";

import { Pause, Play, Repeat, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

type TransportProps = {
  isPlaying: boolean;
  currentStep: number;
  currentMeasure: number;
  currentBeat: number;
  bpm: number;
  loop: boolean;
  totalSteps: number;
  onToggle: () => void;
  onStop: () => void;
  onBpmChange: (v: number) => void;
  onSeek: (step: number) => void;
  onLoopToggle: () => void;
};

const Transport = ({
  isPlaying,
  currentStep,
  currentMeasure,
  currentBeat,
  bpm,
  loop,
  totalSteps,
  onToggle,
  onStop,
  onBpmChange,
  onSeek,
  onLoopToggle,
}: TransportProps) => (
  <div className="flex items-center gap-2 px-4 py-2 border-b bg-card">
    <Toggle
      pressed={isPlaying}
      onPressedChange={onToggle}
      title={isPlaying ? "一時停止" : "再生"}
    >
      {isPlaying ? <Pause size={12} /> : <Play size={12} />}
    </Toggle>
    <Button
      type="button"
      variant="ghost"
      onClick={onStop}
      size="icon"
      title="停止"
    >
      <Square size={12} />
    </Button>
    <span className="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground">
      {currentStep >= 0
        ? `M${String(currentMeasure + 1).padStart(2, "0")} / B${currentBeat + 1}`
        : "M-- / B--"}
    </span>
    <Input
      type="range"
      min={0}
      max={totalSteps - 1}
      value={Math.max(0, currentStep)}
      onChange={(e) => onSeek(+e.target.value)}
    />
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
    <Toggle pressed={loop} onPressedChange={onLoopToggle} title="ループ">
      <Repeat size={12} />
    </Toggle>
  </div>
);

export default Transport;
