"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { Header } from "@/components/header";
import { cloneMeasure, type Score } from "@/lib/constants";
import { makeSamples } from "@/lib/samples";
import { loadScores, saveScores } from "@/lib/storage";

const Page = () => {
  const [scores, setScores] = useState<Score[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      const data = await loadScores();

      if (data.length === 0) {
        const samples = makeSamples();
        await saveScores(samples);
        setScores(samples);
      } else {
        setScores(data);
      }
    })();
  }, []);

  if (!scores) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Dashboard
        scores={scores}
        onCreate={() => router.push("/scores/new")}
        onCopy={(s) => {
          const copied: Score = {
            ...s,
            id: `s${Date.now()}`,
            title: `${s.title} (コピー)`,
            measures: s.measures.map(cloneMeasure),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const next = [...scores, copied];
          setScores(next);
          void saveScores(next);
        }}
      />
    </div>
  );
};

export default Page;
