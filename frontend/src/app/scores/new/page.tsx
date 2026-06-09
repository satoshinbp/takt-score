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

  const createAndGo = async (s: ScoreDetail, keepEditing: boolean) => {
    const created = await createScore({
      title: s.title,
      bpm: s.bpm,
      spotifyTrackId: s.spotifyTrackId,
      measures: s.measures,
    });
    // A new score has no id until it is created, so "save & continue" lands on
    // the saved score's page already in edit mode rather than staying here.
    router.push(`/scores/${created.id}${keepEditing ? "?edit=1" : ""}`);
  };

  return (
    <ScoreEditor
      score={score}
      isNew
      onSave={(s) => void createAndGo(s, false)}
      onSaveStay={(s) => void createAndGo(s, true)}
      onBack={() => router.push("/")}
    />
  );
};

export default NewScorePage;
