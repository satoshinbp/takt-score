"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import ScorePreview from "@/app/_components/score-card/preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { ScoreSummary } from "@/types/common";

type Props = {
  score: ScoreSummary;
  onCopy: (s: ScoreSummary) => void;
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
      {score.previewMeasure && <ScorePreview measure={score.previewMeasure} />}
      <div className="text-base font-semibold truncate">{score.title}</div>
      <div className="flex items-center gap-1 mt-2">
        <Badge variant="outline">{score.bpm} BPM</Badge>
        <Badge variant="outline">
          {t("scoreCard.measures", { count: score.measuresCount })}
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
