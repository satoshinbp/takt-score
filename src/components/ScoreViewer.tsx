"use client";

import { useEffect, useRef } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { usePlayback } from "@/hooks/usePlayback";
import { type Score } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ScoreGrid } from "@/components/ScoreGrid";
import { Transport } from "@/components/Transport";

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
};

export const ScoreViewer = ({ score, onEdit, onBack }: Props) => {
  const pb = usePlayback(score);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pb.currentMeasure < 0 || !areaRef.current) return;
    const container = areaRef.current;
    const el = container.querySelector(
      `[data-measure="${pb.currentMeasure}"]`,
    ) as HTMLElement;

    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTop =
      container.scrollTop +
      elRect.top -
      containerRect.top -
      (container.clientHeight - el.clientHeight) / 2;
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
  }, [pb.currentMeasure]);

  return (
    <div className="page-fade flex flex-col h-full overflow-hidden bg-background">
      {/* Top bar */}
      <Toolbar.Root className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 border-b border-border bg-background">
        <Toolbar.Button
          onClick={() => {
            pb.stop();
            onBack();
          }}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium",
            "transition-all duration-150 bg-transparent border border-border",
            "text-muted hover:bg-card hover:text-foreground",
          )}
        >
          ← 戻る
        </Toolbar.Button>
        <div className="text-lg font-semibold flex-1 min-w-0 truncate px-1.5">
          {score.title}
        </div>
        <Toolbar.ToggleGroup
          type="single"
          value="view"
          onValueChange={(v) => {
            if (v === "edit") {
              pb.stop();
              onEdit();
            }
          }}
          className="flex overflow-hidden rounded border border-border"
        >
          <Toolbar.ToggleItem
            value="view"
            className={cn(
              "px-3 py-1 text-xs font-semibold tracking-wider transition-all duration-150",
              "data-[state=on]:bg-card data-[state=on]:text-foreground",
              "data-[state=off]:bg-transparent data-[state=off]:text-muted",
            )}
          >
            ビュー
          </Toolbar.ToggleItem>
          <Toolbar.ToggleItem
            value="edit"
            className={cn(
              "px-3 py-1 text-xs font-semibold tracking-wider transition-all duration-150",
              "data-[state=on]:bg-card data-[state=on]:text-foreground",
              "data-[state=off]:bg-transparent data-[state=off]:text-muted",
              "hover:text-foreground",
            )}
          >
            編集
          </Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
      </Toolbar.Root>

      {/* Performance bar */}
      {pb.isPlaying && (
        <div className="flex items-baseline gap-3 px-4 py-2 flex-shrink-0 border-b border-border bg-card">
          <span className="text-xl font-bold font-mono text-accent">
            M{pb.currentMeasure + 1}
          </span>
          <span className="text-sm font-mono text-muted">
            Beat {pb.currentBeat + 1}
          </span>
          <span className="text-xs ml-auto text-muted">
            {score.measures.length}小節
          </span>
        </div>
      )}

      <div ref={areaRef} className="flex-1 overflow-auto px-4 py-3.5 pb-2.5">
        <ScoreGrid measures={score.measures} currentStep={pb.currentStep} />
      </div>

      <Transport
        isPlaying={pb.isPlaying}
        onToggle={pb.toggle}
        bpm={pb.bpm}
        onBpmChange={pb.setBpm}
        loop={pb.loop}
        onLoopToggle={() => pb.setLoop((l) => !l)}
        currentMeasure={pb.currentMeasure}
        currentBeat={pb.currentBeat}
      />
    </div>
  );
};
