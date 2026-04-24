"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { DrumIcon } from "@/components/DrumIcon";
import { PARTS, SUBDIVISIONS, type Measure } from "@/lib/constants";

type Props = {
  measures: Measure[];
  currentStep: number;
  onToggle?: (mi: number, partIdx: number, si: number) => void;
  selMeasures?: number[];
  onSelMeasure?: (mi: number) => void;
};

export function DrumGrid({
  measures,
  currentStep,
  onToggle,
  selMeasures = [],
  onSelMeasure,
}: Props) {
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
    <div ref={wrapRef} className="select-none flex flex-wrap gap-x-4 gap-y-5">
      {measures.map((measure, mi) => {
        const isCur = curMeasure === mi;
        const isSel = selMeasures.includes(mi);
        const isRowStart = rowStarts.has(mi);
        return (
          <div key={mi} data-measure={mi} className="shrink-0">
            {/* Beat ruler row */}
            <div className="flex items-center mb-1.5">
              <div
                onClick={() => onSelMeasure?.(mi)}
                className={`w-[62px] min-w-[62px] shrink-0 cursor-pointer font-mono font-bold text-[10px] pr-2.5 text-right border-b-2 transition-all duration-[120ms] ${isSel || isCur ? "text-[var(--accent)]" : "text-muted"} ${isSel ? "border-[var(--accent)]" : "border-transparent"}`}
              >
                M{mi + 1}
              </div>
              {[1, 2, 3, 4].map((b) => (
                <span key={b} className="flex">
                  <span className="w-6 mx-px flex items-center justify-center font-mono text-[9px] text-muted shrink-0">
                    {b}
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
                  className="w-[62px] min-w-[62px] shrink-0 flex items-center gap-1.5 pr-2.5 font-mono font-semibold text-[9px] tracking-[0.04em]"
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
                  const active = measure[part.id][si] === 1;
                  const cur = global === currentStep;
                  const beat = si % 4 === 0;
                  let cls = "step-cell w-6 h-6 mx-px";
                  if (active) cls += " active";
                  if (cur) cls += " cur";
                  else if (beat && !active) cls += " beat";
                  return (
                    <div
                      key={si}
                      className={cls}
                      onClick={() => onToggle?.(mi, vi, si)}
                      style={{
                        background: active ? part.color : undefined,
                        boxShadow: active
                          ? cur
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
}
