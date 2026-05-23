"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b border-border bg-background">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={12} />
        {t("scoreEditor.back")}
      </Button>
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder={t("scoreEditor.titlePlaceholder")}
      />
      <Button onClick={onSave}>
        {isNew ? t("scoreEditor.create") : t("scoreEditor.save")}
      </Button>
    </div>
  );
};

export default ScoreEditorHeader;
