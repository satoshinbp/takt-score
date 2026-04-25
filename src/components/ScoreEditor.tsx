"use client";

import { DrumGrid } from "@/components/DrumGrid";
import EditorToolbar from "@/components/EditorToolbar";
import { Transport } from "@/components/Transport";
import { usePlayback } from "@/hooks/usePlayback";
import { PARTS, cloneMeasure, emptyMeasure, type Score } from "@/lib/constants";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  score: Score;
  isNew?: boolean;
  onSave: (s: Score) => void;
  onBack: () => void;
};

export function ScoreEditor({ score, isNew = false, onSave, onBack }: Props) {
  const [draft, setDraft] = useState<Score>(() => ({
    ...score,
    measures: score.measures.map(cloneMeasure),
  }));
  const [sel, setSel] = useState<number[]>([]);
  const [clip, setClip] = useState<ReturnType<typeof cloneMeasure>[] | null>(
    null,
  );
  const pb = usePlayback(draft);

  const areaRef = useRef<HTMLDivElement>(null);

  const prevBpm = useRef(pb.bpm);
  useEffect(() => {
    if (pb.bpm !== prevBpm.current) {
      setDraft((d) => ({ ...d, bpm: pb.bpm }));
      prevBpm.current = pb.bpm;
    }
  }, [pb.bpm]);

  useEffect(() => {
    if (pb.currentMeasure < 0 || !areaRef.current) return;
    const container = areaRef.current;
    const el = container.querySelector(
      `[data-measure="${pb.currentMeasure}"]`,
    ) as HTMLElement;
    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const scrollTop =
      container.scrollTop +
      elRect.top -
      containerRect.top -
      (container.clientHeight - el.clientHeight) / 2;
    container.scrollTo({ top: Math.max(0, scrollTop), behavior: "smooth" });
  }, [pb.currentMeasure]);

  const handleToggle = useCallback(
    (mi: number, partIdx: number, si: number) => {
      const partId = PARTS[partIdx].id;
      setDraft((d) => {
        const ms = d.measures.map(cloneMeasure);
        ms[mi][partId][si] = ms[mi][partId][si] ? 0 : 1;
        return { ...d, measures: ms };
      });
    },
    [],
  );

  const toggleSel = (mi: number) =>
    setSel((s) => (s.includes(mi) ? s.filter((i) => i !== mi) : [...s, mi]));

  const addBlank = () =>
    setDraft((d) => ({ ...d, measures: [...d.measures, emptyMeasure()] }));

  const addDupe = () => {
    const src = sel.length
      ? draft.measures[sel[sel.length - 1]]
      : draft.measures[draft.measures.length - 1];
    setDraft((d) => ({ ...d, measures: [...d.measures, cloneMeasure(src)] }));
  };

  const copyMeas = () => {
    if (!sel.length) return;
    setClip(
      [...sel]
        .sort((a, b) => a - b)
        .map((i) => cloneMeasure(draft.measures[i])),
    );
  };

  const pasteMeas = () => {
    if (!clip) return;
    const at = sel.length ? Math.max(...sel) + 1 : draft.measures.length;
    setDraft((d) => {
      const ms = [...d.measures];
      ms.splice(at, 0, ...clip.map(cloneMeasure));
      return { ...d, measures: ms };
    });
  };

  const clearMeas = () => {
    if (!sel.length) return;
    setDraft((d) => ({
      ...d,
      measures: d.measures.map((m, i) =>
        sel.includes(i) ? emptyMeasure() : cloneMeasure(m),
      ),
    }));
  };

  const delMeas = () => {
    if (draft.measures.length <= 1 || !sel.length) return;
    const s = new Set(sel);
    setDraft((d) => ({
      ...d,
      measures: d.measures.filter((_, i) => !s.has(i)),
    }));
    setSel([]);
  };

  const handleSave = () => onSave({ ...draft, updatedAt: Date.now() });

  return (
    <div className="page-fade flex flex-col h-full overflow-hidden bg-[var(--background)]">
      {/* Top bar */}
      <div className="flex items-center gap-2.5 px-4 py-2 flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface-1)]">
        <button
          onClick={() => {
            pb.stop();
            onBack();
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-[120ms] bg-transparent border border-[var(--border)] text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          ← 戻る
        </button>
        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="タイトル..."
          className="text-[17px] font-semibold flex-1 min-w-0 px-1.5 py-0.5 rounded bg-transparent border border-transparent text-[var(--text)] outline-none transition-[border-color,background] duration-150 focus:border-[var(--border)] focus:bg-[var(--surface-2)]"
        />
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-[120ms] bg-[var(--accent)] text-[#09090c]"
        >
          {isNew ? "作成" : "保存"}
        </button>
      </div>

      <EditorToolbar
        sel={sel}
        clipSize={clip?.length ?? 0}
        canDelete={draft.measures.length > 1}
        onAddBlank={addBlank}
        onAddDupe={addDupe}
        onCopy={copyMeas}
        onPaste={pasteMeas}
        onClear={clearMeas}
        onDelete={delMeas}
        onDeselect={() => setSel([])}
      />

      {/* Grid */}
      <div ref={areaRef} className="flex-1 overflow-auto px-4 py-3.5 pb-2.5">
        <DrumGrid
          measures={draft.measures}
          currentStep={pb.currentStep}
          onToggle={handleToggle}
          mode="edit"
          selMeasures={sel}
          onSelMeasure={toggleSel}
        />
      </div>

      <Transport
        isPlaying={pb.isPlaying}
        onToggle={pb.toggle}
        bpm={pb.bpm}
        onBpmChange={pb.setBpm}
        loop={pb.loop}
        onLoopToggle={() => pb.setLoop((l) => !l)}
        currentMeasure={pb.currentMeasure}
        currentBeat={pb.currentBeat}
      />
    </div>
  );
}
