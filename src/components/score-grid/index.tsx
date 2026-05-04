"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import BeatRuler from "@/components/score-grid/beat-ruler";
import ScoreGridRow from "@/components/score-grid/row";
import type { Measure, Subdivision } from "@/lib/constants";
import { PART_IDS, PARTS } from "@/lib/constants";
import { decodeStep, getMeasureStepOffset } from "@/lib/playback-utils";

type Props = {
  measures: Measure[];
  currentStep: number;
  onToggle?: (mi: number, partIdx: number, bi: number, si: number) => void;
  onSubdivisionChange?: (mi: number, bi: number, sub: Subdivision) => void;
  selMeasures?: number[];
  onSelMeasure?: (mi: number) => void;
};

const ScoreGrid = ({
  measures,
  currentStep,
  onToggle,
  onSubdivisionChange,
  selMeasures = [],
  onSelMeasure,
}: Props) => {
  const curMeasure =
    currentStep >= 0 ? decodeStep(currentStep, measures).measureIndex : -1;

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
    <div ref={wrapRef} className="select-none flex flex-wrap gap-y-2">
      {measures.map((measure, mi) => {
        const isCur = curMeasure === mi;
        const isSel = selMeasures.includes(mi);
        const isRowStart = rowStarts.has(mi);
        const stepOffset = getMeasureStepOffset(measures, mi);

        return (
          <div key={mi} data-measure={mi} className="shrink-0">
            <BeatRuler
              isSelected={isSel}
              isCurrent={isCur}
              isRowStart={isRowStart}
              onSelectMeasure={() => onSelMeasure?.(mi)}
              measureIndex={mi}
              measure={measure}
              onSubdivisionChange={
                onSubdivisionChange
                  ? (bi, sub) => onSubdivisionChange(mi, bi, sub)
                  : undefined
              }
            />

            {PART_IDS.map((id, vi) => (
              <ScoreGridRow
                key={id}
                id={id}
                config={PARTS[id]}
                measure={measure}
                stepOffset={stepOffset}
                currentStep={currentStep}
                anchoreEnabled={vi === 0}
                onToggle={(bi, si) => onToggle?.(mi, vi, bi, si)}
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
