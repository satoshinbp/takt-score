"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import ScorePreview from "@/app/_components/score-card/preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import type { Score } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  score: Score;
  onCopy: (s: Score) => void;
};

const ScoreCard = ({ score, onCopy }: Props) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "relative p-4 transition-all border bg-card text-card-foreground",
        "hover:-translate-y-px hover:shadow-lg",
      )}
    >
      {score.measures.length > 0 && (
        <ScorePreview measure={score.measures[0]} />
      )}
      <div className="text-base font-semibold truncate">{score.title}</div>
      <div className="flex items-center gap-1 mt-2">
        <Badge variant="outline">{score.bpm} BPM</Badge>
        <Badge variant="outline">
          {t("scoreCard.measures", { count: score.measures.length })}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCopy(score)}
          title={t("scoreCard.duplicate")}
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

export default ScoreCard;
