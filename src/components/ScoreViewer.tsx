"use client";

import { useEffect, useRef } from "react";
import { Pause, Play, Repeat, Square } from "lucide-react";
import { ScoreGrid } from "@/components/ScoreGrid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { usePlayback } from "@/hooks/usePlayback";
import { type Score, SUBDIVISIONS } from "@/lib/constants";

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
};

export const ScoreViewer = ({ score, onEdit, onBack }: Props) => {
  const pb = usePlayback(score);
  const areaRef = useRef<HTMLDivElement>(null);
  const totalSteps = score.measures.length * SUBDIVISIONS;

  useEffect(() => {
    if (pb.currentMeasure < 0 || !areaRef.current) return;
    const container = areaRef.current;
    const el = container.querySelector(
      `[data-measure="${pb.currentMeasure}"]`,
    ) as HTMLElement;

    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollLeft =
      container.scrollLeft +
      elRect.left -
      containerRect.left -
      (container.clientWidth - el.clientWidth) / 2;
    container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
  }, [pb.currentMeasure]);

  return (
    <div className="page-fade flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 border-b border-border bg-background">
        <Button
          variant="outline"
          onClick={() => {
            pb.stop();
            onBack();
          }}
        >
          ← 戻る
        </Button>
        <div className="text-lg font-semibold flex-1 min-w-0 truncate px-2">
          {score.title}
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value="play"
          onValueChange={(v) => {
            if (v === "edit") {
              pb.stop();
              onEdit();
            }
          }}
        >
          <ToggleGroupItem value="play">演奏</ToggleGroupItem>
          <ToggleGroupItem value="edit">編集</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 border-b border-border bg-card">
        <Toggle
          pressed={pb.isPlaying}
          onPressedChange={pb.toggle}
          title={pb.isPlaying ? "一時停止" : "再生"}
        >
          {pb.isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </Toggle>
        <Button
          type="button"
          variant="ghost"
          onClick={pb.stop}
          size="icon"
          title="停止"
        >
          <Square size={12} />
        </Button>
        <span className="w-20 flex-shrink-0 font-mono text-xs text-muted">
          {pb.currentStep >= 0
            ? `M${String(pb.currentMeasure + 1).padStart(2, "0")} / B${pb.currentBeat + 1}`
            : "M-- / B--"}
        </span>
        <Input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={Math.max(0, pb.currentStep)}
          onChange={(e) => pb.seekTo(+e.target.value)}
        />
        <div className="flex items-center gap-1.5 text-xs text-muted flex-shrink-0">
          <span>BPM</span>
          <Input
            type="number"
            value={pb.bpm}
            min={30}
            max={300}
            onChange={(e) => pb.setBpm(+e.target.value)}
            onBlur={(e) =>
              pb.setBpm(Math.max(30, Math.min(300, +e.target.value)))
            }
          />
        </div>
        <Toggle
          pressed={pb.loop}
          onPressedChange={() => pb.setLoop((l) => !l)}
          title="ループ"
        >
          <Repeat size={12} />
        </Toggle>
      </div>

      <div
        ref={areaRef}
        className="flex-1 overflow-x-auto overflow-y-hidden p-4"
      >
        <ScoreGrid
          measures={score.measures}
          currentStep={pb.currentStep}
          horizontal
        />
      </div>
    </div>
  );
};
