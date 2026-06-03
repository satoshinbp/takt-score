"use client";

import { Pause, Play, Repeat, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { useTranslation } from "@/hooks/useTranslation";
import { decodeStep, getTotalSteps } from "@/lib/playback-utils";
import type { Measure } from "@/types/common";

type TransportProps = {
  isPlaying: boolean;
  currentStep: number;
  bpm: number;
  loop: boolean;
  measures: Measure[];
  onToggle: () => void;
  onStop: () => void;
  onBpmChange: (v: number) => void;
  onSeek: (step: number) => void;
  onLoopToggle: () => void;
};

const Transport = ({
  isPlaying,
  currentStep,
  bpm,
  loop,
  measures,
  onToggle,
  onStop,
  onBpmChange,
  onSeek,
  onLoopToggle,
}: TransportProps) => {
  const { t } = useTranslation();
  const totalSteps = getTotalSteps(measures);
  const { measureIndex: currentMeasure, beatIndex: currentBeat } =
    currentStep >= 0
      ? decodeStep(currentStep, measures)
      : { measureIndex: -1, beatIndex: -1 };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t bg-card">
      <Toggle
        pressed={isPlaying}
        onPressedChange={onToggle}
        title={isPlaying ? t("transport.pause") : t("transport.play")}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
      </Toggle>
      <Button
        type="button"
        variant="ghost"
        onClick={onStop}
        size="icon"
        title={t("transport.stop")}
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
      <Toggle
        pressed={loop}
        onPressedChange={onLoopToggle}
        title={t("transport.loop")}
      >
        <Repeat size={12} />
      </Toggle>
    </div>
  );
};

export default Transport;
