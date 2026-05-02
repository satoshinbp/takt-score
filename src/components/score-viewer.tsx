"use client";

import ScoreTimeline from "@/components/score-timeline";
import ViewerHeader from "@/components/score-viewer-header";
import Transport from "@/components/transport";
import { usePlayback } from "@/hooks/usePlayback";
import { type Score, SUBDIVISIONS } from "@/lib/constants";

type Props = {
  score: Score;
  onEdit: () => void;
  onBack: () => void;
  onDelete?: () => void;
};

const ScoreViewer = ({ score, onEdit, onBack, onDelete }: Props) => {
  const pb = usePlayback(score);
  const totalSteps = score.measures.length * SUBDIVISIONS;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ViewerHeader
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
        totalSteps={totalSteps}
        onToggle={pb.toggle}
        onStop={pb.stop}
        onBpmChange={pb.setBpm}
        onSeek={pb.seekTo}
        onLoopToggle={() => pb.setLoop((l) => !l)}
      />
      <ScoreTimeline
        measures={score.measures}
        currentStep={pb.currentStep}
        isPlaying={pb.isPlaying}
        bpm={pb.bpm}
      />
    </div>
  );
};

export default ScoreViewer;
