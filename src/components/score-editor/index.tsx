"use client";

import { useEffect, useRef, useState } from "react";
import AiGenerateDialog from "@/components/score-editor/ai-generate-dialog";
import ScoreEditorHeader from "@/components/score-editor/header";
import { useDraftScore } from "@/components/score-editor/hooks/useDraftScore";
import { useFollowPlayback } from "@/components/score-editor/hooks/useFollowPlayback";
import { useMeasureOps } from "@/components/score-editor/hooks/useMeasureOps";
import { useMeasureSelection } from "@/components/score-editor/hooks/useMeasureSelection";
import ScoreEditorToolbar from "@/components/score-editor/toolbar";
import ScoreGrid from "@/components/score-grid";
import Transport from "@/components/transport";
import { usePlayback } from "@/hooks/usePlayback";
import type { Measure, Score } from "@/lib/constants";
import { decodeStep } from "@/lib/playback-utils";

type Props = {
  score: Score;
  isNew?: boolean;
  onSave: (s: Score) => void;
  onBack: () => void;
};

const ScoreEditor = ({ score, isNew = false, onSave, onBack }: Props) => {
  const [isAiOpen, setAiOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);

  const { sel, toggle: toggleSel, clear: clearSel } = useMeasureSelection();
  const {
    draft,
    setDraft,
    handleToggle,
    handleSetStep,
    handleSubdivisionChange,
  } = useDraftScore(score);
  const pb = usePlayback(draft);
  const ops = useMeasureOps({ draft, setDraft, sel, clearSel });

  const prevBpm = useRef(pb.bpm);
  useEffect(() => {
    if (pb.bpm !== prevBpm.current) {
      setDraft((d) => ({ ...d, bpm: pb.bpm }));
      prevBpm.current = pb.bpm;
    }
  }, [pb.bpm, setDraft]);

  const currentMeasure =
    pb.currentStep >= 0
      ? decodeStep(pb.currentStep, draft.measures).measureIndex
      : -1;
  useFollowPlayback(currentMeasure, areaRef);

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
        clipSize={ops.clipSize}
        canDelete={draft.measures.length > 1}
        onAddBlank={ops.addBlank}
        onAddDupe={ops.addDupe}
        onCopy={ops.copy}
        onPaste={ops.paste}
        onClear={ops.clear}
        onDelete={ops.remove}
        onDeselect={clearSel}
        onAiGenerate={() => setAiOpen(true)}
      />
      <div ref={areaRef} className="flex-1 overflow-auto px-4 py-3.5">
        <ScoreGrid
          measures={draft.measures}
          currentStep={pb.currentStep}
          onToggle={handleToggle}
          onSetStep={handleSetStep}
          onSubdivisionChange={handleSubdivisionChange}
          selMeasures={sel}
          onSelMeasure={toggleSel}
        />
      </div>
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
    </div>
  );
};

export default ScoreEditor;
