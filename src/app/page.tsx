"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cloneMeasure, makeSamples, type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";

export default function Page() {
  const [scores, setScores] = useState<Score[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadScores().then((data) => {
      if (data.length === 0) {
        const samples = makeSamples();
        saveScores(samples).then(() => setScores(samples));
      } else {
        setScores(data);
      }
    });
  }, []);

  if (!scores) return null;

  return (
    <div
      className="flex flex-col overflow-hidden h-screen bg-[var(--bg)] text-[var(--t)]"
    >
      <Header />
      <Dashboard
        scores={scores}
        onSelect={(s) => router.push(`/scores/${s.id}`)}
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
          saveScores(next);
        }}
      />
    </div>
  );
}
