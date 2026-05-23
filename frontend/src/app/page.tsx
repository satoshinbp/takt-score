"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/app/_components/header";
import NewScoreCard from "@/app/_components/new-score-card";
import ScoreCard from "@/app/_components/score-card";
import { useTranslation } from "@/hooks/use-translation";
import { cloneMeasure } from "@/lib/constants";
import { createScore, listScores } from "@/services/score";
import { type ScoreDetail } from "@/types/common";

const Page = () => {
  const [scores, setScores] = useState<ScoreDetail[] | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    void (async () => {
      setScores(await listScores());
    })();
  }, []);

  if (!scores) return null;

  const handleCopy = async (s: ScoreDetail) => {
    const copied = await createScore({
      title: `${s.title} ${t("scoreCard.copySuffix")}`,
      bpm: s.bpm,
      measures: s.measures.map(cloneMeasure),
    });
    setScores([copied, ...scores]);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col flex-1 gap-4 p-4">
          <DashboardHeader
            count={scores.length}
            onCreate={() => router.push("/scores/new")}
          />
          <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(16rem,1fr))]">
            {scores.map((s) => (
              <ScoreCard
                key={s.id}
                score={s}
                onCopy={(s) => void handleCopy(s)}
              />
            ))}
            <NewScoreCard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
