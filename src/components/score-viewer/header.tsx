"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

type ViewerHeaderProps = {
  title: string;
  onBack: () => void;
  onEdit: () => void;
  onDelete?: () => void;
};

const ScoreViewerHeader = ({
  title,
  onBack,
  onEdit,
  onDelete,
}: ViewerHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b bg-background">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft size={12} />
        {t("scoreViewer.back")}
      </Button>
      <div className="text-lg font-semibold flex-1 min-w-0 truncate px-2">
        {title}
      </div>
      <Button title="outline" value="edit" onClick={onEdit}>
        {t("scoreViewer.edit")}
      </Button>
      {onDelete && (
        <Button variant="destructive" onClick={onDelete}>
          {t("scoreViewer.delete")}
        </Button>
      )}
    </div>
  );
};

export default ScoreViewerHeader;
