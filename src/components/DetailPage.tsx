"use client";

import { useState } from "react";
import type { Score } from "@/lib/constants";
import { ScoreEditor } from "@/components/ScoreEditor";
import { ScoreViewer } from "@/components/ScoreViewer";

type Props = {
  score: Score;
  onSave: (s: Score) => void;
  onBack: () => void;
}

export const DetailPage = ({ score, onSave, onBack }: Props) => {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [live, setLive] = useState(score);

  if (mode === "edit") {
    return (
      <ScoreEditor
        score={live}
        isNew={false}
        onSave={(s) => {
          setLive(s);
          onSave(s);
          setMode("view");
        }}
        onBack={() => setMode("view")}
      />
    );
  }

  return (
    <ScoreViewer
      score={live}
      onEdit={() => setMode("edit")}
      onBack={onBack}
    />
  );
}
