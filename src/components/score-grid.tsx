"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import BeatRuler from "@/components/beat-ruler";
import ScoreGridCell from "@/components/score-grid-cell";
import ScoreGridRowHeader from "@/components/score-grid-row-header";
import type { Measure, PartConfig, PartId } from "@/lib/constants";
import { PART_IDS, PARTS, SUBDIVISIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ScoreGridRow = ({
  id,
  config,
  partMeasure,
  stepOffset,
  currentStep,
  anchoreEnabled = false,
  onToggle,
  horizontal,
  isRowStart,
}: {
  id: PartId;
  config: PartConfig;
  partMeasure: Measure[PartId];
  stepOffset: number;
  currentStep: number;
  anchoreEnabled?: boolean;
  onToggle?: (si: number) => void;
  horizontal: boolean;
  isRowStart: boolean;
}) => (
  <div className="flex items-center mb-0.5">
    <ScoreGridRowHeader
      id={id}
      config={config}
      horizontal={horizontal}
      isRowStart={isRowStart}
    />
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

type Props = {
  measures: Measure[];
  currentStep: number;
  onToggle?: (mi: number, partIdx: number, si: number) => void;
  selMeasures?: number[];
  onSelMeasure?: (mi: number) => void;
  horizontal?: boolean;
};

const ScoreGrid = ({
  measures,
  currentStep,
  onToggle,
  selMeasures = [],
  onSelMeasure,
  horizontal = false,
}: Props) => {
  const curMeasure =
    currentStep >= 0 ? Math.floor(currentStep / SUBDIVISIONS) : -1;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [rowStarts, setRowStarts] = useState<Set<number>>(() => new Set([0]));

  useLayoutEffect(() => {
    const el = wrapRef.current;

    if (!el) return;
    const compute = () => {
      const children = Array.from(el.children) as HTMLElement[];
      const starts = new Set<number>();
      let prevTop = -1;
      children.forEach((child, i) => {
        if (child.offsetTop !== prevTop) {
          starts.add(i);
          prevTop = child.offsetTop;
        }
      });
      setRowStarts(starts);
    };
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    compute();

    return () => ro.disconnect();
  }, [measures.length]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "select-none flex",
        horizontal ? "flex-nowrap" : "flex-wrap gap-y-2",
      )}
    >
      {measures.map((measure, mi) => {
        const isCur = curMeasure === mi;
        const isSel = selMeasures.includes(mi);
        const isRowStart = rowStarts.has(mi);

        return (
          <div key={mi} data-measure={mi} className="shrink-0">
            <BeatRuler
              horizontal={horizontal}
              isSelected={isSel}
              isCurrent={isCur}
              isRowStart={isRowStart}
              onSelectMeasure={() => onSelMeasure?.(mi)}
              measureIndex={mi}
            />

            {PART_IDS.map((id, vi) => (
              <ScoreGridRow
                key={id}
                id={id}
                config={PARTS[id]}
                partMeasure={measure[id]}
                stepOffset={mi * SUBDIVISIONS}
                currentStep={currentStep}
                anchoreEnabled={vi === 0}
                onToggle={(si) => onToggle?.(mi, vi, si)}
                horizontal={horizontal}
                isRowStart={isRowStart}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default memo(ScoreGrid);
