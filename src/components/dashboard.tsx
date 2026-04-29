"use client";

import Link from "next/link";
import { Copy, Plus } from "lucide-react";
import ScorePreview from "@/components/score-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Score } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  scores: Score[];
  onCreate: () => void;
  onCopy: (s: Score) => void;
};

export const Dashboard = ({ scores, onCreate, onCopy }: Props) => {
  return (
    <div className="flex flex-col flex-1 px-6 py-4">
      <div className="flex flex-col flex-1 gap-4">
        <DashboardHeader count={scores.length} onCreate={onCreate} />
        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
          {scores.map((s) => (
            <ScoreCard key={s.id} score={s} onCopy={onCopy} />
          ))}
          <NewScoreCard />
        </div>
      </div>
    </div>
  );
};

const DashboardHeader = ({
  count,
  onCreate,
}: {
  count: number;
  onCreate: () => void;
}) => {
  return (
    <div className="flex justify-between items-end">
      <div>
        <div className="text-2xl font-bold">My Scores</div>
        <div className="text-sm text-muted-foreground">{count}件</div>
      </div>
      <Button onClick={onCreate}>
        <Plus size={16} />
        新規ドラム譜
      </Button>
    </div>
  );
};

const ScoreCard = ({
  score,
  onCopy,
}: {
  score: Score;
  onCopy: (s: Score) => void;
}) => {
  return (
    <div
      className={cn(
        "relative p-4 transition-all border",
        "hover:-translate-y-px hover:shadow-lg",
      )}
    >
      {score.measures.length > 0 && (
        <ScorePreview measure={score.measures[0]} />
      )}
      <div className="text-base font-semibold truncate">{score.title}</div>
      <div className="flex items-center gap-1 mt-2">
        <Badge variant="outline">{score.bpm} BPM</Badge>
        <Badge variant="outline">{score.measures.length}小節</Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCopy(score)}
          title="複製"
          className="z-20 ml-auto"
        >
          <Copy size={12} />
        </Button>
      </div>
      <Link
        href={`/scores/${score.id}`}
        className="absolute inset-0 z-10"
        aria-label={score.title}
      />
    </div>
  );
};

const NewScoreCard = () => {
  return (
    <Link
      href="/scores/new"
      className={cn(
        "p-4 flex flex-col items-center justify-center gap-2 min-h-43 w-full",
        "transition-all border border-dashed bg-muted text-muted-foreground",
        "hover:text-primary hover:border-primary hover:-translate-y-px",
      )}
    >
      <Plus />
      <div className="text-xs font-medium">新規ドラム譜</div>
    </Link>
  );
};
