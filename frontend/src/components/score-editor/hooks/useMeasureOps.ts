"use client";

import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { Score } from "@/lib/constants";
import { cloneMeasure, emptyMeasure } from "@/lib/constants";

type Args = {
  draft: Score;
  setDraft: Dispatch<SetStateAction<Score>>;
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

  return {
    clipSize: clip?.length ?? 0,
    addBlank,
    addDupe,
    copy,
    paste,
    clear,
    remove,
  };
};
