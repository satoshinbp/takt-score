"use client";

import {
  ArrowDown,
  CirclePlus,
  ClipboardPaste,
  Copy,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Props = {
  sel: number[];
  clipSize: number;
  canDelete: boolean;
  onAddBlank: () => void;
  onAddDupe: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onDelete: () => void;
  onDeselect: () => void;
};

const EditorToolbar = ({
  sel,
  clipSize,
  canDelete,
  onAddBlank,
  onAddDupe,
  onCopy,
  onPaste,
  onClear,
  onDelete,
  onDeselect,
}: Props) => {
  const selSorted = [...sel].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b flex-wrap">
      <span className="text-xs uppercase mr-0.5">追加</span>

      <Button variant="outline" onClick={onAddBlank} size="sm">
        <Plus size={12} /> 空の小節
      </Button>
      <Button variant="outline" onClick={onAddDupe} size="sm">
        <CirclePlus size={12} /> {sel.length ? "選択を複製" : "末尾を複製"}
      </Button>

      <Separator orientation="vertical" />

      <span className="text-xs uppercase mr-0.5">選択操作</span>
      {sel.length === 0 ? (
        <span className="text-xs flex items-center gap-1 px-1">
          <ArrowDown size={12} /> 下のM番号をクリックして小節を選択
        </span>
      ) : (
        <>
          <Badge>M{selSorted.map((i) => i + 1).join(", ")} 選択中</Badge>
          <Button variant="outline" onClick={onCopy} size="sm">
            <Copy size={12} /> コピー
          </Button>
          {clipSize > 0 && (
            <Button variant="outline" onClick={onPaste} size="sm">
              <ClipboardPaste size={12} /> 貼り付け ({clipSize})
            </Button>
          )}
          <Button variant="outline" onClick={onClear} size="sm">
            <Trash size={12} /> クリア
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!canDelete}
            size="sm"
          >
            <X size={12} /> 削除
          </Button>
          <Button variant="outline" onClick={onDeselect} size="sm">
            解除
          </Button>
        </>
      )}

      {clipSize > 0 && sel.length === 0 && (
        <>
          <Separator orientation="vertical" />
          <Button variant="outline" onClick={onPaste} size="sm">
            <ClipboardPaste size={12} /> 貼り付け ({clipSize})
          </Button>
        </>
      )}
    </div>
  );
};

export default EditorToolbar;
