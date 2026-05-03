"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}: ViewerHeaderProps) => (
  <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b bg-background">
    <Button variant="outline" onClick={onBack}>
      <ArrowLeft size={12} />
      戻る
    </Button>
    <div className="text-lg font-semibold flex-1 min-w-0 truncate px-2">
      {title}
    </div>
    <Button title="outline" value="edit" onClick={onEdit}>
      編集
    </Button>
    {onDelete && (
      <Button variant="destructive" onClick={onDelete}>
        削除
      </Button>
    )}
  </div>
);

export default ScoreViewerHeader;
