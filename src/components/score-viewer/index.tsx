"use client";

import ScoreGrid from "@/components/score-grid";
import ScoreViewerHeader from "@/components/score-viewer/header";
import Transport from "@/components/transport";
import { usePlayback } from "@/hooks/usePlayback";
import type { Score } from "@/lib/constants";

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

const ScoreViewer = ({ score, onEdit, onBack, onDelete }: Props) => {
  const pb = usePlayback(score);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ScoreViewerHeader
        title={score.title}
        onBack={() => {
          pb.stop();
          onBack();
        }}
        onEdit={() => {
          pb.stop();
          onEdit();
        }}
        onDelete={onDelete}
      />
      <Transport
        isPlaying={pb.isPlaying}
        currentStep={pb.currentStep}
        bpm={pb.bpm}
        loop={pb.loop}
        measures={score.measures}
        onToggle={pb.toggle}
        onStop={pb.stop}
        onBpmChange={pb.setBpm}
        onSeek={pb.seekTo}
        onLoopToggle={() => pb.setLoop((l) => !l)}
      />
      <div className="flex-1 overflow-auto px-4 py-3.5 pb-2.5">
        <ScoreGrid measures={score.measures} currentStep={pb.currentStep} />
      </div>
    </div>
  );
};

export default ScoreViewer;
