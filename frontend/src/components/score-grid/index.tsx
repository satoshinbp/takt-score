"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import BeatRuler from "@/components/score-grid/beat-ruler";
import CellPopover from "@/components/score-grid/cell-popover";
import ScoreGridRow from "@/components/score-grid/row";
import type { Subdivision } from "@/lib/constants";
import { PART_IDS, PARTS } from "@/lib/constants";
import { readOrnament } from "@/lib/ornament";
import { decodeStep, getMeasureStepOffset } from "@/lib/playback-utils";
import type { Measure } from "@/types/common";

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

  // Stabilize onToggle via a ref so the callback passed down to memoized rows
  // does not change identity when the parent re-renders (e.g. on currentStep
  // updates during playback). The ref always points to the latest onToggle.
  const onToggleRef = useRef(onToggle);
  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);
  const handleToggle = useCallback(
    (mi: number, vi: number, bi: number, si: number) =>
      onToggleRef.current?.(mi, vi, bi, si),
    [],
  );

  // setPopoverTarget is a React setState updater and is already stable, so a
  // useCallback with empty deps is sufficient to give rows a stable handler.
  const handleCellContextMenu = useCallback(
    (mi: number, vi: number, bi: number, si: number, rect: DOMRect) =>
      setPopoverTarget({ mi, partIdx: vi, bi, si, rect }),
    [],
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
                  currentStep={isCur ? currentStep : -1}
                  measureIndex={mi}
                  partIndex={vi}
                  anchoreEnabled={vi === 0}
                  onToggle={onToggle ? handleToggle : undefined}
                  onCellContextMenu={
                    isEditable ? handleCellContextMenu : undefined
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

export default ScoreGrid;
