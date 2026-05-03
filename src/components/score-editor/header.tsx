"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onBack: () => void;
  title: string;
  onTitleChange: (t: string) => void;
  onSave: () => void;
  isNew: boolean;
};

const ScoreEditorHeader = ({
  onBack,
  title,
  onTitleChange,
  onSave,
  isNew,
}: Props) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b border-border bg-background">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={12} />
        戻る
      </Button>
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="タイトル..."
      />
      <Button onClick={onSave}>{isNew ? "作成" : "保存"}</Button>
    </div>
  );
};

export default ScoreEditorHeader;
