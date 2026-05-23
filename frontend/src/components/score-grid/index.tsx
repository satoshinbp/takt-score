"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import BeatRuler from "@/components/score-grid/beat-ruler";
import CellPopover from "@/components/score-grid/cell-popover";
import ScoreGridRow from "@/components/score-grid/row";
import type { Measure, Subdivision } from "@/lib/constants";
import { PART_IDS, PARTS } from "@/lib/constants";
import { readOrnament } from "@/lib/ornament";
import { decodeStep, getMeasureStepOffset } from "@/lib/playback-utils";

type Props = {
  measures: Measure[];
  currentStep: number;
  onToggle?: (mi: number, partIdx: number, bi: number, si: number) => void;
  onSetStep?: (
    mi: number,
    partIdx: number,
    bi: number,
    si: number,
    velocity: number,
    ornament: number,
  ) => void;
  onSubdivisionChange?: (mi: number, bi: number, sub: Subdivision) => void;
  selMeasures?: number[];
  onSelMeasure?: (mi: number) => void;
};

type PopoverTarget = {
  mi: number;
  partIdx: number;
  bi: number;
  si: number;
  rect: DOMRect;
};

const ScoreGrid = ({
  measures,
  currentStep,
  onToggle,
  onSetStep,
  onSubdivisionChange,
  selMeasures = [],
  onSelMeasure,
}: Props) => {
  const curMeasure =
    currentStep >= 0 ? decodeStep(currentStep, measures).measureIndex : -1;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [rowStarts, setRowStarts] = useState<Set<number>>(() => new Set([0]));
  const [popoverTarget, setPopoverTarget] = useState<PopoverTarget | null>(
    null,
  );

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

  const isEditable = onToggle !== undefined && onSetStep !== undefined;

  const popoverVelocity = popoverTarget
    ? (measures[popoverTarget.mi]?.[popoverTarget.bi]?.steps[
        PART_IDS[popoverTarget.partIdx]
      ]?.[popoverTarget.si] ?? 0)
    : 0;

  const popoverOrnament =
    popoverTarget && measures[popoverTarget.mi]?.[popoverTarget.bi]
      ? readOrnament(
          measures[popoverTarget.mi][popoverTarget.bi],
          PART_IDS[popoverTarget.partIdx],
          popoverTarget.si,
        )
      : 0;

  return (
    <>
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
                  onToggle={
                    onToggle ? (bi, si) => onToggle(mi, vi, bi, si) : undefined
                  }
                  onCellContextMenu={
                    isEditable
                      ? (bi, si, rect) =>
                          setPopoverTarget({ mi, partIdx: vi, bi, si, rect })
                      : undefined
                  }
                  isRowStart={isRowStart}
                />
              ))}
            </div>
          );
        })}
      </div>
      {isEditable && (
        <CellPopover
          open={popoverTarget !== null}
          rect={popoverTarget?.rect ?? null}
          velocity={popoverVelocity}
          ornament={popoverOrnament}
          onChange={(v, o) => {
            if (!popoverTarget) return;
            onSetStep(
              popoverTarget.mi,
              popoverTarget.partIdx,
              popoverTarget.bi,
              popoverTarget.si,
              v,
              o,
            );
          }}
          onOpenChange={(open) => {
            if (!open) setPopoverTarget(null);
          }}
        />
      )}
    </>
  );
};

export default memo(ScoreGrid);
