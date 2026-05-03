"use client";

import ScoreGridCell from "@/components/score-grid/row/cell";
import ScoreGridRowHeader from "@/components/score-grid/row/header";
import type { Measure, PartConfig, PartId } from "@/lib/constants";
import { SUBDIVISIONS } from "@/lib/constants";

type Props = {
  id: PartId;
  config: PartConfig;
  partMeasure: Measure[PartId];
  stepOffset: number;
  currentStep: number;
  anchoreEnabled?: boolean;
  onToggle?: (si: number) => void;
  isRowStart: boolean;
};

const ScoreGridRow = ({
  id,
  config,
  partMeasure,
  stepOffset,
  currentStep,
  anchoreEnabled = false,
  onToggle,
  isRowStart,
}: Props) => (
  <div className="flex items-center mb-0.5">
    <ScoreGridRowHeader id={id} config={config} isRowStart={isRowStart} />
    {Array.from({ length: SUBDIVISIONS }, (_, si) => {
      const global = stepOffset + si;

      return (
        <ScoreGridCell
          key={si}
          isActive={partMeasure[si] === 1}
          isCurrent={global === currentStep}
          color={config.color}
          anchor={anchoreEnabled ? global : undefined}
          onClick={() => onToggle?.(si)}
        />
      );
    })}
  </div>
);

export default ScoreGridRow;
