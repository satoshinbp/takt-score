"use client";

import {
  ArrowDown,
  CirclePlus,
  ClipboardPaste,
  Copy,
  Plus,
  Redo2,
  Scissors,
  Sparkles,
  Trash,
  Undo2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  sel: number[];
  clipSize: number;
  canDelete: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddBlank: () => void;
  onAddDupe: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onCut: () => void;
  onClear: () => void;
  onDelete: () => void;
  onDeselect: () => void;
  onAiGenerate: () => void;
};

const ScoreEditorToolbar = ({
  sel,
  clipSize,
  canDelete,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddBlank,
  onAddDupe,
  onCopy,
  onPaste,
  onCut,
  onClear,
  onDelete,
  onDeselect,
  onAiGenerate,
}: Props) => {
  const { t } = useTranslation();
  const selSorted = [...sel].sort((a, b) => a - b);

  return (
    <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 border-b flex-wrap">
      <Button
        variant="outline"
        onClick={onUndo}
        disabled={!canUndo}
        size="sm"
        title={t("scoreEditorToolbar.undo")}
      >
        <Undo2 size={12} />
      </Button>
      <Button
        variant="outline"
        onClick={onRedo}
        disabled={!canRedo}
        size="sm"
        title={t("scoreEditorToolbar.redo")}
      >
        <Redo2 size={12} />
      </Button>

      <Separator orientation="vertical" />

      <Button variant="outline" onClick={onAiGenerate} size="sm">
        <Sparkles size={12} /> {t("scoreEditorToolbar.aiGenerate")}
      </Button>

      <Separator orientation="vertical" />
      <span className="text-xs uppercase mr-0.5">
        {t("scoreEditorToolbar.add")}
      </span>

      <Button variant="outline" onClick={onAddBlank} size="sm">
        <Plus size={12} /> {t("scoreEditorToolbar.addBlank")}
      </Button>
      <Button variant="outline" onClick={onAddDupe} size="sm">
        <CirclePlus size={12} />{" "}
        {sel.length
          ? t("scoreEditorToolbar.duplicateSelected")
          : t("scoreEditorToolbar.duplicateLast")}
      </Button>

      <Separator orientation="vertical" />

      <span className="text-xs uppercase mr-0.5">
        {t("scoreEditorToolbar.selectionOps")}
      </span>
      {sel.length === 0 ? (
        <span className="text-xs flex items-center gap-1 px-1">
          <ArrowDown size={12} /> {t("scoreEditorToolbar.selectPrompt")}
        </span>
      ) : (
        <>
          <Badge>
            {t("scoreEditorToolbar.selectedBadge", {
              measures: selSorted.map((i) => i + 1).join(", "),
            })}
          </Badge>
          <Button variant="outline" onClick={onCopy} size="sm">
            <Copy size={12} /> {t("scoreEditorToolbar.copy")}
          </Button>
          <Button variant="outline" onClick={onCut} size="sm">
            <Scissors size={12} /> {t("scoreEditorToolbar.cut")}
          </Button>
          {clipSize > 0 && (
            <Button variant="outline" onClick={onPaste} size="sm">
              <ClipboardPaste size={12} />{" "}
              {t("scoreEditorToolbar.paste", { count: clipSize })}
            </Button>
          )}
          <Button variant="outline" onClick={onClear} size="sm">
            <Trash size={12} /> {t("scoreEditorToolbar.clear")}
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!canDelete}
            size="sm"
          >
            <X size={12} /> {t("scoreEditorToolbar.delete")}
          </Button>
          <Button variant="outline" onClick={onDeselect} size="sm">
            {t("scoreEditorToolbar.deselect")}
          </Button>
        </>
      )}

      {clipSize > 0 && sel.length === 0 && (
        <>
          <Separator orientation="vertical" />
          <Button variant="outline" onClick={onPaste} size="sm">
            <ClipboardPaste size={12} />{" "}
            {t("scoreEditorToolbar.paste", { count: clipSize })}
          </Button>
        </>
      )}
    </div>
  );
};

export default ScoreEditorToolbar;
