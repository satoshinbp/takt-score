"use client";

import { useState } from "react";
import type { Score } from "@/lib/constants";
import { ScoreViewer } from "./ScoreViewer";
import { ScoreEditor } from "./ScoreEditor";

type Props = {
  score: Score;
  onSave: (s: Score) => void;
  onBack: () => void;
};

export function DetailPage({ score, onSave, onBack }: Props) {
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
