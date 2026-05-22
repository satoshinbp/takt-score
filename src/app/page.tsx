"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/app/_components/header";
import NewScoreCard from "@/app/_components/new-score-card";
import ScoreCard from "@/app/_components/score-card";
import { useTranslation } from "@/hooks/use-translation";
import { cloneMeasure, type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";

const Page = () => {
  const [scores, setScores] = useState<Score[] | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    void (async () => {
      const data = await loadScores();
      setScores(data);
    })();
  }, []);

  if (!scores) return null;

  return (
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
              onCopy={(s) => {
                const copied: Score = {
                  ...s,
                  id: `s${Date.now()}`,
                  title: `${s.title} ${t("scoreCard.copySuffix")}`,
                  measures: s.measures.map(cloneMeasure),
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                const next = [...scores, copied];
                setScores(next);
                void saveScores(next);
              }}
            />
          ))}
          <NewScoreCard />
        </div>
      </div>
    </div>
  );
};

export default Page;
