"use client";

import type { Score } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
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
    <div className="page-fade flex flex-col flex-1 p-4 overflow-hidden bg-(--background)">
      <div className="flex-1 overflow-y-auto space-y-4">
        <DashboardHeader count={scores.length} onCreate={onCreate} />
        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
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
        <div className="text-2xl font-bold tracking-tight">My Scores</div>
        <div className="text-sm text-(--text-muted)">{count}件</div>
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(score);
        }
      }}
      className={cn(
        "p-4 cursor-pointer transition-all",
        "relative overflow-hidden bg-surface-1 border border-border",
        "hover:border-strong hover:bg-surface-2 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,.4)]",
      )}
    >
      <ScorePreview measures={score.measures} />
      <div className="text-base font-semibold truncate">{score.title}</div>
      <div className="flex items-center gap-1.5 mt-2">
        <Badge variant="outline">{score.bpm} BPM</Badge>
        <Badge variant="outline">{score.measures.length}小節</Badge>
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
    <button
      onClick={onClick}
      className={cn(
        "p-4 flex flex-col items-center justify-center gap-2 min-h-[130px] w-full",
        "cursor-pointer transition-all border-border border-dashed text-muted",
        "hover:text-(--text) hover:border-accent hover:bg-(--accent-subtle) hover:-translate-y-px",
      )}
    >
      <Plus />
      <div className="text-xs font-medium">新規ドラム譜</div>
    </button>
  );
}
