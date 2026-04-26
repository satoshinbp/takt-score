"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DrumIcon } from "@/components/Icon";
import { type Measure, PARTS, SUBDIVISIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  measures: Measure[];
  currentStep: number;
  onToggle?: (mi: number, partIdx: number, si: number) => void;
  selMeasures?: number[];
  onSelMeasure?: (mi: number) => void;
  horizontal?: boolean;
};

export const ScoreGrid = ({
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
            {/* Beat ruler row */}
            <div className="flex items-center mb-1.5">
              <button
                type="button"
                onClick={() => onSelMeasure?.(mi)}
                className={cn(
                  "shrink-0 cursor-pointer font-mono font-bold text-xs",
                  "pr-2.5 text-right border-b-2 transition-all duration-150",
                  horizontal
                    ? "hidden"
                    : isRowStart
                      ? "w-16 min-w-16"
                      : "w-12 min-w-12",
                  isSel || isCur ? "text-accent" : "text-muted",
                  isSel ? "border-accent" : "border-transparent",
                )}
              >
                M{mi + 1}
              </button>
              {[1, 2, 3, 4].map((b) => (
                <span key={b} className="flex">
                  <span
                    className={cn(
                      "w-6 mx-px flex items-center justify-center font-mono text-xs shrink-0",
                      horizontal && b === 1
                        ? isCur
                          ? "text-accent font-bold"
                          : "text-muted"
                        : "text-muted",
                    )}
                  >
                    {horizontal && b === 1 ? `M${mi + 1}` : b}
                  </span>
                  {[0, 1, 2].map((sub) => (
                    <span
                      key={sub}
                      className="w-6 mx-px shrink-0 inline-block"
                    />
                  ))}
                </span>
              ))}
            </div>

            {PARTS.map((part, vi) => (
              <div key={part.id} className="flex items-center mb-0.5">
                <div
                  className={cn(
                    "shrink-0 flex items-center gap-1.5 pr-2.5 font-mono font-semibold text-xs tracking-wider",
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
                  const isBeat = si % 4 === 0;
                  let cls = "step-cell w-6 h-6 mx-px";

                  if (horizontal && si === 0 && mi > 0) cls += " measure-start";

                  if (isActive) cls += " active";

                  if (isCurrent) cls += " cur";
                  else if (isBeat && !isActive) cls += " beat";

                  return (
                    <button
                      type="button"
                      key={si}
                      className={cls}
                      data-step-anchor={vi === 0 ? global : undefined}
                      onClick={() => onToggle?.(mi, vi, si)}
                      style={{
                        background: isActive ? part.color : undefined,
                        boxShadow: isActive
                          ? isCurrent
                            ? `0 0 8px ${part.color}55, inset 0 0 0 2px rgba(245,200,66,0.75)`
                            : `0 0 8px ${part.color}55`
                          : "none",
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
