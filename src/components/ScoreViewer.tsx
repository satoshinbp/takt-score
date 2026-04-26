"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const visualStepRef = useRef(0);
  const totalSteps = score.measures.length * SUBDIVISIONS;
  const playheadRatio = 0.35;
  const [edgePadding, setEdgePadding] = useState({ left: 0, right: 0 });

  const scrollToVisualStep = (stepFloat: number) => {
    const container = areaRef.current;
    const content = contentRef.current;

    if (!container || !content || totalSteps <= 0) return;

    const baseStep = Math.floor(stepFloat);
    const nextStep = Math.min(baseStep + 1, totalSteps - 1);
    const currentEl = content.querySelector(`[data-step-anchor="${baseStep}"]`);
    const nextEl = content.querySelector(`[data-step-anchor="${nextStep}"]`);

    if (!currentEl) return;

    const currentCenter = currentEl.offsetLeft + currentEl.offsetWidth / 2;
    const nextCenter = nextEl
      ? nextEl.offsetLeft + nextEl.offsetWidth / 2
      : currentCenter;
    const progress = stepFloat - baseStep;
    const cellCenter =
      currentCenter + (nextCenter - currentCenter) * Math.max(0, progress);
    const playheadX = container.clientWidth * playheadRatio;
    const nextScrollLeft = Math.max(0, cellCenter - playheadX);
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    container.scrollLeft = Math.min(nextScrollLeft, maxScrollLeft);
  };

  useLayoutEffect(() => {
    const container = areaRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    const computePadding = () => {
      const anchors = content.querySelectorAll("[data-step-anchor]");
      const firstAnchor = anchors[0] as HTMLElement | undefined;
      const lastAnchor = anchors[anchors.length - 1] as HTMLElement | undefined;

      if (!firstAnchor || !lastAnchor) return;

      const playheadX = container.clientWidth * playheadRatio;
      const left = Math.max(0, playheadX - firstAnchor.offsetWidth / 2);
      const right = Math.max(
        0,
        container.clientWidth - playheadX - lastAnchor.offsetWidth / 2,
      );

      setEdgePadding({ left, right });
    };

    const observer = new ResizeObserver(computePadding);
    observer.observe(container);
    observer.observe(content);
    computePadding();

    return () => observer.disconnect();
  }, [playheadRatio, score.measures.length]);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (pb.currentStep < 0) {
      visualStepRef.current = 0;
      scrollToVisualStep(0);

      return;
    }

    const stepDurationMs = 60000 / pb.bpm / 4;
    const previousStep = visualStepRef.current;
    const wrapped =
      pb.currentStep === 0 && previousStep > Math.max(0, totalSteps - 2);
    const fromStep = wrapped ? 0 : previousStep;
    const toStep = pb.currentStep;

    if (!pb.isPlaying || fromStep === toStep) {
      visualStepRef.current = toStep;
      scrollToVisualStep(toStep);

      return;
    }

    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / stepDurationMs);
      const visualStep = fromStep + (toStep - fromStep) * progress;
      visualStepRef.current = visualStep;
      scrollToVisualStep(visualStep);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [pb.bpm, pb.currentStep, pb.isPlaying, totalSteps]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
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
        <span className="w-20 flex-shrink-0 font-mono text-xs text-muted-foreground">
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
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
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

      <div className="relative flex-1 overflow-hidden">
        {pb.currentStep >= 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-4 z-10 w-px bg-accent/70"
            style={{ left: `${playheadRatio * 100}%` }}
          />
        )}
        <div
          ref={areaRef}
          className="h-full overflow-x-auto overflow-y-hidden px-6 py-4"
        >
          <div ref={contentRef} className="flex">
            <div
              aria-hidden="true"
              className="shrink-0"
              style={{ width: edgePadding.left }}
            />
            <ScoreGrid
              measures={score.measures}
              currentStep={pb.currentStep}
              horizontal
            />
            <div
              aria-hidden="true"
              className="shrink-0"
              style={{ width: edgePadding.right }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
