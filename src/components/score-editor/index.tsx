"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AiGenerateDialog from "@/components/score-editor/ai-generate-dialog";
import ScoreEditorHeader from "@/components/score-editor/header";
import ScoreEditorToolbar from "@/components/score-editor/toolbar";
import ScoreGrid from "@/components/score-grid";
import Transport from "@/components/transport";
import { usePlayback } from "@/hooks/usePlayback";
import {
  cloneMeasure,
  emptyBeat,
  emptyMeasure,
  type Measure,
  PART_IDS,
  type Score,
  type Subdivision,
} from "@/lib/constants";
import { decodeStep } from "@/lib/playback-utils";

type Props = {
  score: Score;
  isNew?: boolean;
  onSave: (s: Score) => void;
  onBack: () => void;
};

const ScoreEditor = ({ score, isNew = false, onSave, onBack }: Props) => {
  const [draft, setDraft] = useState<Score>(() => ({
    ...score,
    measures: score.measures.map(cloneMeasure),
  }));
  const [sel, setSel] = useState<number[]>([]);
  const [clip, setClip] = useState<ReturnType<typeof cloneMeasure>[] | null>(
    null,
  );
  const [isAiOpen, setAiOpen] = useState(false);
  const pb = usePlayback(draft);
  const currentMeasure =
    pb.currentStep >= 0
      ? decodeStep(pb.currentStep, draft.measures).measureIndex
      : -1;

  const areaRef = useRef<HTMLDivElement>(null);

  const prevBpm = useRef(pb.bpm);
  useEffect(() => {
    if (pb.bpm !== prevBpm.current) {
      setDraft((d) => ({ ...d, bpm: pb.bpm }));
      prevBpm.current = pb.bpm;
    }
  }, [pb.bpm]);

  useEffect(() => {
    if (currentMeasure < 0 || !areaRef.current) return;
    const container = areaRef.current;
    const el = container.querySelector(
      `[data-measure="${currentMeasure}"]`,
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
  }, [currentMeasure]);

  const handleToggle = useCallback(
    (mi: number, partIdx: number, bi: number, si: number) => {
      const partId = PART_IDS[partIdx];
      setDraft((d) => {
        const ms = d.measures.map(cloneMeasure);
        ms[mi][bi].steps[partId][si] ^= 1;
        return { ...d, measures: ms };
      });
    },
    [],
  );

  const handleSubdivisionChange = useCallback(
    (mi: number, bi: number, sub: Subdivision) => {
      setDraft((d) => {
        const ms = d.measures.map(cloneMeasure);
        ms[mi][bi] = emptyBeat(sub);
        return { ...d, measures: ms };
      });
    },
    [],
  );

  const toggleSel = useCallback(
    (mi: number) =>
      setSel((s) => (s.includes(mi) ? s.filter((i) => i !== mi) : [...s, mi])),
    [],
  );

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

  const handleAiGenerate = (measures: Measure[], bpm: number) => {
    setDraft((d) => ({ ...d, measures, bpm }));
    pb.stop();
  };

  const handleSave = () => onSave({ ...draft, updatedAt: Date.now() });

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <AiGenerateDialog
        open={isAiOpen}
        onOpenChange={setAiOpen}
        onGenerate={handleAiGenerate}
      />
      <ScoreEditorHeader
        onBack={() => {
          pb.stop();
          onBack();
        }}
        title={draft.title}
        onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
        onSave={handleSave}
        isNew={isNew}
      />
      <ScoreEditorToolbar
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
        onAiGenerate={() => setAiOpen(true)}
      />
      <Transport
        isPlaying={pb.isPlaying}
        currentStep={pb.currentStep}
        bpm={pb.bpm}
        loop={pb.loop}
        measures={draft.measures}
        onToggle={pb.toggle}
        onStop={pb.stop}
        onBpmChange={pb.setBpm}
        onSeek={pb.seekTo}
        onLoopToggle={() => pb.setLoop((l) => !l)}
      />
      <div ref={areaRef} className="flex-1 overflow-auto px-4 py-3.5 pb-2.5">
        <ScoreGrid
          measures={draft.measures}
          currentStep={pb.currentStep}
          onToggle={handleToggle}
          onSubdivisionChange={handleSubdivisionChange}
          selMeasures={sel}
          onSelMeasure={toggleSel}
        />
      </div>
    </div>
  );
};

export default ScoreEditor;
