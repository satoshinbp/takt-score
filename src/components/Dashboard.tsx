"use client";

import type { Score } from "@/lib/constants";
import { Button } from "@radix-ui/themes";
import { Plus } from "lucide-react";
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
    <div className="page-fade flex flex-col flex-1 p-4 overflow-hidden bg-[var(--bg)]">
      <div className="flex-1 overflow-y-auto space-y-4">
        <DashboardHeader count={scores.length} onCreate={onCreate} />

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          }}
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
        <div className="text-sm mt-0.5 text-[var(--tm)]">{count}件</div>
      </div>
      <Button
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all duration-[120ms] bg-[var(--acc)] text-[#09090c]"
      >
        ＋ 新規作成
      </Button>
    </div>
  );
}

type ScoreCardProps = {
  score: Score;
  onSelect: (s: Score) => void;
  onCopy: (s: Score) => void;
};

function ScoreCard({ score: s, onSelect, onCopy }: ScoreCardProps) {
  return (
    <div
      onClick={() => onSelect(s)}
      className={cn(
        "rounded-md p-4 cursor-pointer transition-all",
        "relative overflow-hidden bg-[var(--s1)] border border-[var(--bd)]",
        "hover:border-[var(--bd2)] hover:bg-[var(--s2)] hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,.4)]",
      )}
    >
      <ScorePreview measures={s.measures} />
      <div className="text-base font-semibold truncate">{s.title}</div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[var(--s2)] text-[var(--tm)] tracking-[0.03em]">
          {s.bpm} BPM
        </span>
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[var(--s2)] text-[var(--tm)] tracking-[0.03em]">
          {s.measures.length}小節
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCopy(s);
          }}
          title="複製"
          className="ml-auto p-1 rounded text-[var(--tm)] hover:text-[var(--t)] hover:bg-[var(--s3)] transition-colors duration-[120ms]"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="5" width="9" height="9" rx="1.5" />
            <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
          </svg>
        </button>
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
        "border border-dashed border-[var(--bd)] text-[var(--tm)]",
        "hover:text-[var(--t)] hover:border-[var(--acc)] hover:bg-[var(--acc-d)]",
      )}
    >
      <Plus />
      <div className="text-xs font-medium">新規ドラム譜</div>
    </div>
  );
}
