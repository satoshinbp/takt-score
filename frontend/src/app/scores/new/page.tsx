"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScoreEditor from "@/components/score-editor";
import { newScore, type Score } from "@/lib/constants";
import { createScore } from "@/lib/storage";

const NewScorePage = () => {
  const router = useRouter();
  const [score] = useState(() => newScore("New Score", 120));

  const handleSave = async (s: Score) => {
    const created = await createScore({
      title: s.title,
      bpm: s.bpm,
      measures: s.measures,
    });
    router.push(`/scores/${created.id}`);
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
