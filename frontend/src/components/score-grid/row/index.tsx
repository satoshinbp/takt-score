"use client";

import { memo, useCallback } from "react";
import ScoreGridCell, { BEAT_WIDTH_PX } from "@/components/score-grid/row/cell";
import ScoreGridRowHeader from "@/components/score-grid/row/header";
import type { PartConfig, PartId } from "@/lib/constants";
import { readOrnament } from "@/lib/ornament";
import type { Measure } from "@/types/common";

type Props = {
  id: PartId;
  config: PartConfig;
  measure: Measure;
  stepOffset: number;
  // Global step index when the cursor is in this measure, -1 otherwise. Holding
  // -1 for non-current measures lets memo skip every row outside the current
  // measure during playback.
  currentStep: number;
  measureIndex: number;
  partIndex: number;
  anchoreEnabled?: boolean;
  onToggle?: (mi: number, vi: number, bi: number, si: number) => void;
  onCellContextMenu?: (
    mi: number,
    vi: number,
    bi: number,
    si: number,
    rect: DOMRect,
  ) => void;
  isRowStart: boolean;
};

const ScoreGridRow = ({
  id,
  config,
  measure,
  stepOffset,
  currentStep,
  measureIndex,
  partIndex,
  anchoreEnabled = false,
  onToggle,
  onCellContextMenu,
  isRowStart,
}: Props) => {
  const beatOffsets = measure.reduce<number[]>((acc, beat, bi) => {
    acc.push(bi === 0 ? stepOffset : acc[bi - 1] + measure[bi - 1].subdivision);
    return acc;
  }, []);

  const handleCellClick = useCallback(
    (bi: number, si: number) => onToggle?.(measureIndex, partIndex, bi, si),
    [onToggle, measureIndex, partIndex],
  );

  const handleCellContextMenu = useCallback(
    (bi: number, si: number, rect: DOMRect) =>
      onCellContextMenu?.(measureIndex, partIndex, bi, si, rect),
    [onCellContextMenu, measureIndex, partIndex],
  );

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
                bi={bi}
                si={si}
                velocity={val}
                ornament={readOrnament(beat, id, si)}
                isCurrent={global === currentStep}
                color={config.color}
                anchor={anchoreEnabled ? global : undefined}
                onClick={onToggle ? handleCellClick : undefined}
                onContextMenu={
                  onCellContextMenu ? handleCellContextMenu : undefined
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default memo(ScoreGridRow);
