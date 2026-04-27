"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Pause, Play, Repeat, Square } from "lucide-react";
import ScoreGrid from "@/components/score-grid";
import ViewerHeader from "@/components/score-viewer-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { usePlayback } from "@/hooks/usePlayback";
import { type Score, SUBDIVISIONS } from "@/lib/constants";

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
  <div className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 border-b border-border bg-card">
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
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
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

type ScoreAreaProps = {
  measures: Score["measures"];
  currentStep: number;
  isPlaying: boolean;
  bpm: number;
};

const PLAYHEAD_RATIO = 0.35;

const ScoreArea = ({
  measures,
  currentStep,
  isPlaying,
  bpm,
}: ScoreAreaProps) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const visualStepRef = useRef(0);
  const totalSteps = measures.length * SUBDIVISIONS;
  const [edgePadding, setEdgePadding] = useState({ left: 0, right: 0 });

  const scrollToVisualStep = useCallback(
    (stepFloat: number) => {
      const container = areaRef.current;
      const content = contentRef.current;

      if (!container || !content || totalSteps <= 0) return;

      const baseStep = Math.floor(stepFloat);
      const nextStep = Math.min(baseStep + 1, totalSteps - 1);
      const currentAnchor = content.querySelector<HTMLElement>(
        `[data-step-anchor="${baseStep}"]`,
      );
      const nextAnchor = content.querySelector<HTMLElement>(
        `[data-step-anchor="${nextStep}"]`,
      );

      if (!currentAnchor) return;

      const currentCenter =
        currentAnchor.offsetLeft + currentAnchor.offsetWidth / 2;
      const nextCenter = nextAnchor
        ? nextAnchor.offsetLeft + nextAnchor.offsetWidth / 2
        : currentCenter;
      const cellCenter =
        currentCenter +
        (nextCenter - currentCenter) * Math.max(0, stepFloat - baseStep);
      const nextScrollLeft = Math.max(
        0,
        cellCenter - container.clientWidth * PLAYHEAD_RATIO,
      );
      container.scrollLeft = Math.min(
        nextScrollLeft,
        container.scrollWidth - container.clientWidth,
      );
    },
    [totalSteps],
  );

  useLayoutEffect(() => {
    const container = areaRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    const computePadding = () => {
      const anchors = content.querySelectorAll("[data-step-anchor]");
      const firstAnchor = anchors[0] as HTMLElement | undefined;
      const lastAnchor = anchors[anchors.length - 1] as HTMLElement | undefined;

      if (!firstAnchor || !lastAnchor) return;

      const playheadX = container.clientWidth * PLAYHEAD_RATIO;
      setEdgePadding({
        left: Math.max(0, playheadX - firstAnchor.offsetWidth / 2),
        right: Math.max(
          0,
          container.clientWidth - playheadX - lastAnchor.offsetWidth / 2,
        ),
      });
    };

    const observer = new ResizeObserver(computePadding);
    observer.observe(container);
    observer.observe(content);
    computePadding();

    return () => observer.disconnect();
  }, [measures.length]);

  useEffect(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (currentStep < 0) {
      visualStepRef.current = 0;
      scrollToVisualStep(0);

      return;
    }

    const previousStep = visualStepRef.current;
    const isWrappedLoop =
      currentStep === 0 && previousStep > Math.max(0, totalSteps - 2);
    const fromStep = isWrappedLoop ? 0 : previousStep;
    const toStep = currentStep;

    if (!isPlaying || fromStep === toStep) {
      visualStepRef.current = toStep;
      scrollToVisualStep(toStep);

      return;
    }

    const startedAt = performance.now();
    const animDurationMs = (toStep - fromStep) * (60000 / bpm / 4);

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / animDurationMs);
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
  }, [bpm, currentStep, isPlaying, scrollToVisualStep, totalSteps]);

  return (
    <div className="relative flex-1 overflow-hidden">
      {currentStep >= 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-4 z-10 flex w-1 -translate-x-1/2 justify-center bg-primary/20"
          style={{ left: `${PLAYHEAD_RATIO * 100}%` }}
        >
          <div className="h-full w-px bg-primary shadow-sm" />
        </div>
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
          <ScoreGrid measures={measures} currentStep={currentStep} horizontal />
          <div
            aria-hidden="true"
            className="shrink-0"
            style={{ width: edgePadding.right }}
          />
        </div>
      </div>
    </div>
  );
};

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

const ScoreViewer = ({ score, onEdit, onBack, onDelete }: Props) => {
  const pb = usePlayback(score);
  const totalSteps = score.measures.length * SUBDIVISIONS;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ViewerHeader
        title={score.title}
        onBack={() => {
          pb.stop();
          onBack();
        }}
        onEdit={() => {
          pb.stop();
          onEdit();
        }}
        onDelete={onDelete}
      />
      <Transport
        isPlaying={pb.isPlaying}
        currentStep={pb.currentStep}
        currentMeasure={pb.currentMeasure}
        currentBeat={pb.currentBeat}
        bpm={pb.bpm}
        loop={pb.loop}
        totalSteps={totalSteps}
        onToggle={pb.toggle}
        onStop={pb.stop}
        onBpmChange={pb.setBpm}
        onSeek={pb.seekTo}
        onLoopToggle={() => pb.setLoop((l) => !l)}
      />
      <ScoreArea
        measures={score.measures}
        currentStep={pb.currentStep}
        isPlaying={pb.isPlaying}
        bpm={pb.bpm}
      />
    </div>
  );
};

export default ScoreViewer;
