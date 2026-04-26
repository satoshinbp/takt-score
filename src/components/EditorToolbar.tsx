"use client";

import * as Toolbar from "@radix-ui/react-toolbar";
import {
  ArrowDown,
  CirclePlus,
  ClipboardPaste,
  Copy,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const ToolbarBtn = ({
  children,
  onClick,
  disabled,
  destructive,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) => (
  <Toolbar.Button asChild>
    <Button
      variant={destructive ? "destructive" : "outline"}
      onClick={onClick}
      disabled={disabled}
      size="sm"
    >
      {children}
    </Button>
  </Toolbar.Button>
);

const ToolbarSeparator = () => (
  <Toolbar.Separator className="w-px h-5 flex-shrink-0 bg-border" />
);

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
}

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
    <Toolbar.Root className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b flex-wrap">
      <span className="text-xs uppercase mr-0.5">追加</span>
      <ToolbarBtn onClick={onAddBlank}>
        <Plus size={12} /> 空の小節
      </ToolbarBtn>
      <ToolbarBtn onClick={onAddDupe}>
        <CirclePlus size={12} /> {sel.length ? "選択を複製" : "末尾を複製"}
      </ToolbarBtn>

      <ToolbarSeparator />

      <span className="text-xs uppercase mr-0.5">選択操作</span>
      {sel.length === 0 ? (
        <span className="text-xs flex items-center gap-1 px-1">
          <ArrowDown size={12} /> 下のM番号をクリックして小節を選択
        </span>
      ) : (
        <>
          <span className="text-xs font-semibold px-2 py-0.5 text-accent border border-accent">
            M{selSorted.map((i) => i + 1).join(", ")} 選択中
          </span>
          <ToolbarBtn onClick={onCopy}>
            <Copy size={12} /> コピー
          </ToolbarBtn>
          {clipSize > 0 && (
            <ToolbarBtn onClick={onPaste}>
              <ClipboardPaste size={12} /> 貼り付け ({clipSize})
            </ToolbarBtn>
          )}
          <ToolbarBtn onClick={onClear}>
            <Trash size={12} /> クリア
          </ToolbarBtn>
          <ToolbarBtn destructive onClick={onDelete} disabled={!canDelete}>
            <X size={12} /> 削除
          </ToolbarBtn>
          <ToolbarBtn onClick={onDeselect}>解除</ToolbarBtn>
        </>
      )}

      {clipSize > 0 && sel.length === 0 && (
        <>
          <ToolbarSeparator />
          <ToolbarBtn onClick={onPaste}>
            <ClipboardPaste size={12} /> 貼り付け ({clipSize})
          </ToolbarBtn>
        </>
      )}
    </Toolbar.Root>
  );
};

export default EditorToolbar;
