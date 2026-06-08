"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { cloneMeasure, emptyMeasure } from "@/lib/constants";
import type { ScoreDetail } from "@/types/common";

type Args = {
  draft: ScoreDetail;
  setDraft: Dispatch<SetStateAction<ScoreDetail>>;
  sel: number[];
  clearSel: () => void;
};

export const useMeasureOps = ({ draft, setDraft, sel, clearSel }: Args) => {
  const [clip, setClip] = useState<ReturnType<typeof cloneMeasure>[] | null>(
    null,
  );

  const addBlank = () =>
    setDraft((d) => ({ ...d, measures: [...d.measures, emptyMeasure()] }));

  const addDupe = () => {
    const src = sel.length
      ? draft.measures[sel[sel.length - 1]]
      : draft.measures[draft.measures.length - 1];
    setDraft((d) => ({ ...d, measures: [...d.measures, cloneMeasure(src)] }));
  };

  const copy = () => {
    if (!sel.length) return;
    setClip(
      [...sel]
        .sort((a, b) => a - b)
        .map((i) => cloneMeasure(draft.measures[i])),
    );
  };

  const paste = () => {
    if (!clip) return;
    const at = sel.length ? Math.max(...sel) + 1 : draft.measures.length;
    setDraft((d) => {
      const ms = [...d.measures];
      ms.splice(at, 0, ...clip.map(cloneMeasure));
      return { ...d, measures: ms };
    });
    // Pasted measures shift the original indices, so the old selection is stale.
    clearSel();
  };

  const clear = () => {
    if (!sel.length) return;
    setDraft((d) => ({
      ...d,
      measures: d.measures.map((m, i) =>
        sel.includes(i) ? emptyMeasure() : cloneMeasure(m),
      ),
    }));
  };

  const remove = () => {
    if (draft.measures.length <= 1 || !sel.length) return;
    const s = new Set(sel);
    setDraft((d) => ({
      ...d,
      measures: d.measures.filter((_, i) => !s.has(i)),
    }));
    clearSel();
  };

  const cut = () => {
    // Keep at least one measure; mirror remove()'s guard before copying.
    if (draft.measures.length <= 1 || !sel.length) return;
    copy();
    remove();
  };

  const move = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setDraft((d) => {
      const ms = [...d.measures];
      const [moved] = ms.splice(fromIndex, 1);
      ms.splice(toIndex, 0, moved);
      return { ...d, measures: ms };
    });
    // Reordering invalidates the indices the selection refers to.
    clearSel();
  };

  return {
    clipSize: clip?.length ?? 0,
    addBlank,
    addDupe,
    copy,
    paste,
    clear,
    remove,
    cut,
    move,
  };
};
