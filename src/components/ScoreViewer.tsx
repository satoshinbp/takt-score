"use client";

import { useRef, useEffect } from "react";
import * as Toolbar from "@radix-ui/react-toolbar";
import { type Score } from "@/lib/constants";
import { usePlayback } from "@/hooks/usePlayback";
import { DrumGrid } from "./DrumGrid";
import { Transport } from "./Transport";

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
};

export function ScoreViewer({ score, onEdit, onBack }: Props) {
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
    <div className="page-fade flex flex-col h-full overflow-hidden bg-[var(--bg)]">
      {/* Top bar */}
      <Toolbar.Root className="flex items-center gap-2.5 px-[18px] py-2 flex-shrink-0 border-b border-[var(--bd)] bg-[var(--s1)]">
        <Toolbar.Button
          onClick={() => {
            pb.stop();
            onBack();
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-[120ms] bg-transparent border border-[var(--bd)] text-[var(--td)] hover:bg-[var(--s2)] hover:text-[var(--t)]"
        >
          ← 戻る
        </Toolbar.Button>
        <div className="text-[17px] font-semibold flex-1 min-w-0 truncate px-1.5">
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
          className="flex overflow-hidden rounded border border-[var(--bd)]"
        >
          <Toolbar.ToggleItem
            value="view"
            className="px-3 py-1 text-[11px] font-semibold tracking-[0.04em] transition-all duration-[120ms] data-[state=on]:bg-[var(--s2)] data-[state=on]:text-[var(--t)] data-[state=off]:bg-transparent data-[state=off]:text-[var(--tm)]"
          >
            ビュー
          </Toolbar.ToggleItem>
          <Toolbar.ToggleItem
            value="edit"
            className="px-3 py-1 text-[11px] font-semibold tracking-[0.04em] transition-all duration-[120ms] data-[state=on]:bg-[var(--s2)] data-[state=on]:text-[var(--t)] data-[state=off]:bg-transparent data-[state=off]:text-[var(--tm)] hover:text-[var(--t)]"
          >
            編集
          </Toolbar.ToggleItem>
        </Toolbar.ToggleGroup>
      </Toolbar.Root>

      {/* Performance bar */}
      {pb.isPlaying && (
        <div className="flex items-baseline gap-3 px-[18px] py-2 flex-shrink-0 border-b border-[var(--bd)] bg-[var(--s2)]">
          <span className="text-[20px] font-bold font-mono text-[var(--acc)]">
            M{pb.currentMeasure + 1}
          </span>
          <span className="text-[13px] font-mono text-[var(--td)]">
            Beat {pb.currentBeat + 1}
          </span>
          <span className="text-[11px] ml-auto text-[var(--tm)]">
            {score.measures.length}小節
          </span>
        </div>
      )}

      <div
        ref={areaRef}
        className="flex-1 overflow-auto px-[18px] py-3.5 pb-2.5"
      >
        <DrumGrid measures={score.measures} currentStep={pb.currentStep} />
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
}
