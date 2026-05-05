"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <ScoreEditor
      score={score}
      isNew
      onSave={(s) => {
        void handleSave(s);
      }}
      onBack={() => router.push("/")}
    />
  );
};

export default NewScorePage;
