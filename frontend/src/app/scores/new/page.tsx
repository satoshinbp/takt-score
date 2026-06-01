"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScoreEditor from "@/components/score-editor";
import { newScore } from "@/lib/constants";
import { createScore } from "@/services/score";
import { type ScoreDetail } from "@/types/common";

const NewScorePage = () => {
  const router = useRouter();
  const [score] = useState(() => newScore("New Score", 120));

  const handleSave = async (s: ScoreDetail) => {
    const created = await createScore({
      title: s.title,
      bpm: s.bpm,
      spotifyTrackId: s.spotifyTrackId,
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
