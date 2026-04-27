"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import ScoreEditor from "@/components/score-editor";
import { newScore, type Score } from "@/lib/constants";
import { loadScores, saveScores } from "@/lib/storage";

const NewScorePage = () => {
  const router = useRouter();
  const [score] = useState(() => newScore("New Score", 120));

  const handleSave = async (s: Score) => {
    const all = await loadScores();
    await saveScores([...all, s]);
    router.push(`/scores/${s.id}`);
  };

  return (
    <div className="flex flex-col overflow-hidden h-screen">
      <Header />
      <ScoreEditor
        score={score}
        isNew
        onSave={() => {
          void handleSave;
        }}
        onBack={() => router.push("/")}
      />
    </div>
  );
};

export default NewScorePage;
