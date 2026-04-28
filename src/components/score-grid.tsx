"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DrumIcon } from "@/components/icon";
import { type Measure, PARTS, SUBDIVISIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const BeatRuler = ({
  horizontal,
  isSelected,
  isCurrent,
  isRowStart,
  measureIndex,
  onSelectMeasure,
}: {
  horizontal: boolean;
  isSelected: boolean;
  isCurrent: boolean;
  isRowStart: boolean;
  measureIndex: number;
  onSelectMeasure?: () => void;
}) => {
  return (
    <div className="flex items-center mb-1.5">
      <button
        type="button"
        onClick={onSelectMeasure}
        className={cn(
          "shrink-0 cursor-pointer font-mono font-bold text-xs",
          "pr-2 text-right border-b-2 transition-all",
          horizontal
            ? "hidden"
            : isRowStart
              ? "w-16 min-w-16"
              : "w-12 min-w-12",
          isSelected || isCurrent ? "text-primary" : "text-muted-foreground",
          isSelected ? "border-primary" : "border-transparent",
        )}
      >
        M{measureIndex + 1}
      </button>
      {[1, 2, 3, 4].map((b) => (
        <span key={b} className="flex">
          <span
            className={cn(
              "w-6 mx-px flex items-center justify-center font-mono text-xs shrink-0",
              horizontal && b === 1
                ? isCurrent
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
                : "text-muted-foreground",
            )}
          >
            {horizontal && b === 1 ? `M${measureIndex + 1}` : b}
          </span>
          {[0, 1, 2].map((sub) => (
            <span key={sub} className="w-6 mx-px shrink-0 inline-block" />
          ))}
        </span>
      ))}
    </div>
  );
};

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

            {PARTS.map((part, vi) => (
              <div key={part.id} className="flex items-center mb-0.5">
                <div
                  className={cn(
                    "shrink-0 flex items-center gap-1 font-mono font-semibold text-xs",
                    horizontal
                      ? "hidden"
                      : isRowStart
                        ? "w-16 min-w-16"
                        : "w-12 min-w-12",
                  )}
                  style={{ color: part.color }}
                >
                  {isRowStart && (
                    <>
                      <DrumIcon id={part.id} color={part.color} size={18} />
                      <span>{part.short}</span>
                    </>
                  )}
                </div>

                {Array.from({ length: SUBDIVISIONS }, (_, si) => {
                  const global = mi * SUBDIVISIONS + si;
                  const isActive = measure[part.id][si] === 1;
                  const isCurrent = global === currentStep;

                  const shadows: string[] = [];

                  if (isActive) {
                    shadows.push(`0 0 8px ${part.color}55`);

                    if (isCurrent)
                      shadows.push(`inset 0 0 0 2px rgba(245,200,66,0.75)`);
                  }

                  const cls = cn(
                    "size-6 mx-px rounded-sm border shrink-0 cursor-pointer transition duration-75",
                    isCurrent && "bg-accent",
                    isCurrent && isActive
                      ? "border-transparent"
                      : isCurrent
                        ? "border-[rgba(245,200,66,0.3)]"
                        : isActive
                          ? "border-transparent"
                          : "border-border",
                    !isCurrent && !isActive && "hover:bg-[var(--surface-3)]",
                  );

                  return (
                    <button
                      type="button"
                      key={si}
                      className={cls}
                      data-step-anchor={vi === 0 ? global : undefined}
                      onClick={() => onToggle?.(mi, vi, si)}
                      style={{
                        background: isActive ? part.color : undefined,
                        boxShadow: shadows.length
                          ? shadows.join(", ")
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default ScoreGrid;
