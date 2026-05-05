"use client";

import ScoreGridCell, { BEAT_WIDTH_PX } from "@/components/score-grid/row/cell";
import ScoreGridRowHeader from "@/components/score-grid/row/header";
import type { Measure, PartConfig, PartId } from "@/lib/constants";

type Props = {
  id: PartId;
  config: PartConfig;
  measure: Measure;
  stepOffset: number;
  currentStep: number;
  anchoreEnabled?: boolean;
  onToggle?: (bi: number, si: number) => void;
  isRowStart: boolean;
};

const ScoreGridRow = ({
  id,
  config,
  measure,
  stepOffset,
  currentStep,
  anchoreEnabled = false,
  onToggle,
  isRowStart,
}: Props) => {
  const beatOffsets = measure.reduce<number[]>((acc, beat, bi) => {
    acc.push(bi === 0 ? stepOffset : acc[bi - 1] + measure[bi - 1].subdivision);
    return acc;
  }, []);

  return (
    <div className="flex items-center mb-0.5">
      <ScoreGridRowHeader id={id} config={config} isRowStart={isRowStart} />
      {measure.map((beat, bi) => (
        <div
          key={bi}
          style={{ width: BEAT_WIDTH_PX }}
          className="flex shrink-0"
        >
          {beat.steps[id].map((val, si) => {
            const global = (beatOffsets[bi] ?? stepOffset) + si;
            return (
              <ScoreGridCell
                key={`${bi}-${si}`}
                isActive={val === 1}
                isCurrent={global === currentStep}
                color={config.color}
                anchor={anchoreEnabled ? global : undefined}
                onClick={() => onToggle?.(bi, si)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ScoreGridRow;
