"use client";

import type { Score } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Copy, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScorePreview } from "./ScorePreview";

type Props = {
  scores: Score[];
  onSelect: (s: Score) => void;
  onCreate: () => void;
  onCopy: (s: Score) => void;
};

export function Dashboard({ scores, onSelect, onCreate, onCopy }: Props) {
  return (
    <div
      className={cn(
        "page-fade flex flex-col flex-1 p-4",
        "overflow-hidden bg-(--bg)",
      )}
    >
      <div className="flex-1 overflow-y-auto space-y-4">
        <DashboardHeader count={scores.length} onCreate={onCreate} />

        <div
          className={cn(
            "grid gap-2",
            "grid-cols-[repeat(auto-fill,minmax(250px,1fr))]",
          )}
        >
          {scores.map((s) => (
            <ScoreCard
              key={s.id}
              score={s}
              onSelect={onSelect}
              onCopy={onCopy}
            />
          ))}

          <NewScoreCard onClick={onCreate} />
        </div>
      </div>
    </div>
  );
}

function DashboardHeader({
  count,
  onCreate,
}: {
  count: number;
  onCreate: () => void;
}) {
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="text-2xl font-bold tracking-[-0.02em]">My Scores</div>
        <div className="text-sm mt-0.5 text-(--tm)">{count}件</div>
      </div>
      <Button onClick={onCreate}>
        <Plus size={16} />
        新規ドラム譜
      </Button>
    </div>
  );
}

function ScoreCard({
  score,
  onSelect,
  onCopy,
}: {
  score: Score;
  onSelect: (s: Score) => void;
  onCopy: (s: Score) => void;
}) {
  return (
    <div
      onClick={() => onSelect(score)}
      className={cn(
        "rounded-md p-4 cursor-pointer transition-all",
        "relative overflow-hidden bg-(--s1) border border-(--bd)",
        "hover:border-(--bd2) hover:bg-(--s2) hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,.4)]",
      )}
    >
      <ScorePreview measures={score.measures} />
      <div className="text-base font-semibold truncate">{score.title}</div>
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded-full",
            "bg-(--s2) text-(--tm) tracking-[0.03em]",
          )}
        >
          {score.bpm} BPM
        </span>
        <span
          className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded-full",
            "bg-(--s2) text-(--tm) tracking-[0.03em]",
          )}
        >
          {score.measures.length}小節
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            onCopy(score);
          }}
          title="複製"
          className="ml-auto"
        >
          <Copy size={12} />
        </Button>
      </div>
    </div>
  );
}

function NewScoreCard({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-md p-4 cursor-pointer transition-all",
        "flex flex-col items-center justify-center gap-2 min-h-[130px]",
        "border border-dashed border-(--bd) text-(--tm)",
        "hover:text-(--t) hover:border-(--acc) hover:bg-(--acc-d)",
      )}
    >
      <Plus />
      <div className="text-xs font-medium">新規ドラム譜</div>
    </div>
  );
}
