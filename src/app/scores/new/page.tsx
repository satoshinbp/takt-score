"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { newScore, type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";
import { Header } from "@/components/Header";
import { ScoreEditor } from "@/components/ScoreEditor";

export default function NewScorePage() {
  const router = useRouter();
  const [score] = useState(() => newScore("New Score", 120));

  const handleSave = async (s: Score) => {
    const all = await loadScores();
    await saveScores([...all, s]);
    router.push(`/scores/${s.id}`);
  };

  return (
    <div
      className="flex flex-col overflow-hidden h-screen bg-[var(--background)] text-[var(--text)]"
    >
      <Header breadcrumb="新規作成" />
      <ScoreEditor
        score={score}
        isNew
        onSave={handleSave}
        onBack={() => router.push("/")}
      />
    </div>
  );
}
