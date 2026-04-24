"use client";

import { cn } from "@/lib/utils";
import * as Toolbar from "@radix-ui/react-toolbar";
import { Plus, Trash } from "lucide-react";

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

export function EditorToolbar({
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
}: Props) {
  const selSorted = [...sel].sort((a, b) => a - b);

  return (
    <Toolbar.Root className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b flex-wrap">
      <span className="text-xs uppercase mr-0.5">追加</span>
      <ToolbarBtn onClick={onAddBlank}>
        <Plus size={12} /> 空の小節
      </ToolbarBtn>
      <ToolbarBtn onClick={onAddDupe}>
        {sel.length ? "⊕ 選択を複製" : "⊕ 末尾を複製"}
      </ToolbarBtn>

      <Toolbar.Separator className="w-px h-[18px] flex-shrink-0 bg-border" />

      <span className="text-xs uppercase mr-0.5">選択操作</span>
      {sel.length === 0 ? (
        <span className="text-xs flex items-center gap-1 px-1">
          <span className="opacity-60">↓</span>{" "}
          下のM番号をクリックして小節を選択
        </span>
      ) : (
        <>
          <span className="text-xs font-semibold px-2 py-0.5 text-accent border border-accent">
            M{selSorted.map((i) => i + 1).join(", ")} 選択中
          </span>
          <ToolbarBtn onClick={onCopy}>📋 コピー</ToolbarBtn>
          {clipSize > 0 && (
            <ToolbarBtn onClick={onPaste}>📌 貼り付け ({clipSize})</ToolbarBtn>
          )}
          <ToolbarBtn onClick={onClear}>
            <Trash size={12} /> クリア
          </ToolbarBtn>
          <ToolbarBtn danger onClick={onDelete} disabled={!canDelete}>
            ✕ 削除
          </ToolbarBtn>
          <ToolbarBtn onClick={onDeselect}>解除</ToolbarBtn>
        </>
      )}

      {clipSize > 0 && sel.length === 0 && (
        <>
          <Toolbar.Separator className="w-px h-[18px] flex-shrink-0 bg-[var(--border)]" />
          <ToolbarBtn onClick={onPaste}>📌 貼り付け ({clipSize})</ToolbarBtn>
        </>
      )}
    </Toolbar.Root>
  );
}

const ToolbarBtn = ({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) => (
  <Toolbar.Button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-all duration-[120ms] bg-transparent disabled:pointer-events-none",
      danger
        ? "border border-transparent text-destructive disabled:opacity-30 hover:bg-[rgba(255,68,102,.1)]"
        : "border border-[var(--border)] disabled:opacity-35 hover:bg-[var(--surface-2)] hover:text-[var(--text)] hover:border-[var(--border-strong)]",
    )}
  >
    {children}
  </Toolbar.Button>
);
