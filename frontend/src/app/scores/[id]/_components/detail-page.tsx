"use client";

import { useState } from "react";
import ScoreEditor from "@/components/score-editor";
import ScoreViewer from "@/components/score-viewer";
import type { ScoreDetail } from "@/types/common";

type Props = {
  score: ScoreDetail;
  initialEditing?: boolean;
  onSave: (s: ScoreDetail) => void;
  onBack: () => void;
  onDelete?: () => void;
};

const DetailPage = ({
  score,
  initialEditing = false,
  onSave,
  onBack,
  onDelete,
}: Props) => {
  const [mode, setMode] = useState<"view" | "edit">(
    initialEditing ? "edit" : "view",
  );
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
        onSaveStay={(s) => {
          setLive(s);
          onSave(s);
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
};

export default DetailPage;
