"use client";

import { useState } from "react";
import { ScoreEditor } from "@/components/score-editor";
import { ScoreViewer } from "@/components/score-viewer";
import type { Score } from "@/lib/constants";

type Props = {
  score: Score;
  onSave: (s: Score) => void;
  onBack: () => void;
  onDelete?: () => void;
};

export const DetailPage = ({ score, onSave, onBack, onDelete }: Props) => {
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
      onDelete={onDelete}
    />
  );
}
