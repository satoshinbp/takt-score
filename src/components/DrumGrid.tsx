"use client";

import { PARTS, SUBDIVISIONS, type Measure } from "@/lib/constants";
import { DrumIcon } from "@/components/DrumIcon";

type Props = {
  measures: Measure[];
  currentStep: number;
  onToggle?: (mi: number, partIdx: number, si: number) => void;
  mode?: "edit" | "view";
  selMeasures?: number[];
  onSelMeasure?: (mi: number) => void;
};

export function DrumGrid({
  measures,
  currentStep,
  onToggle,
  mode = "edit",
  selMeasures = [],
  onSelMeasure,
}: Props) {
  const cellSz = 24;
  const gap = 2;
  const labelW = 62;
  const measureW = labelW + SUBDIVISIONS * (cellSz + gap);
  const curMeasure = currentStep >= 0 ? Math.floor(currentStep / SUBDIVISIONS) : -1;

  return (
    <div className="select-none flex flex-wrap" style={{ gap: "20px 16px" }}>
      {measures.map((measure, mi) => {
        const isCur = curMeasure === mi;
        const isSel = selMeasures.includes(mi);
        return (
          <div
            key={mi}
            data-measure={mi}
            style={{ width: measureW, flexShrink: 0 }}
          >
            {/* Beat ruler row */}
            <div className="flex items-center mb-1.5">
              <div
                onClick={() => onSelMeasure?.(mi)}
                className="flex-shrink-0 cursor-pointer font-mono font-bold transition-all duration-[120ms]"
                style={{
                  width: labelW,
                  minWidth: labelW,
                  fontSize: 10,
                  color: isSel ? "var(--acc)" : isCur ? "var(--acc)" : "var(--tm)",
                  paddingRight: 10,
                  textAlign: "right",
                  borderBottom: isSel
                    ? "2px solid var(--acc)"
                    : "2px solid transparent",
                }}
              >
                M{mi + 1}
              </div>
              {[1, 2, 3, 4].map((b) => (
                <span key={b} className="flex">
                  <span
                    className="flex items-center justify-center font-mono text-[9px] text-[var(--tm)] shrink-0"
                    style={{ width: cellSz, margin: `0 ${gap / 2}px` }}
                  >
                    {b}
                  </span>
                  {[0, 1, 2].map((sub) => (
                    <span
                      key={sub}
                      className="shrink-0 inline-block"
                      style={{ width: cellSz, margin: `0 ${gap / 2}px` }}
                    />
                  ))}
                </span>
              ))}
            </div>

            {/* Voice rows */}
            {PARTS.map((part, vi) => (
              <div key={part.id} className="flex items-center" style={{ marginBottom: gap }}>
                <div
                  className="flex items-center gap-1.5 pr-2.5 flex-shrink-0 font-mono font-semibold tracking-[0.04em]"
                  style={{
                    width: labelW,
                    minWidth: labelW,
                    fontSize: 9,
                    color: part.color,
                  }}
                >
                  {mi === 0 && (
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
                  let cls = "step-cell";
                  if (active) cls += " active";
                  if (cur) cls += " cur";
                  else if (beat && !active) cls += " beat";
                  return (
                    <div
                      key={si}
                      className={cls}
                      onClick={() => onToggle?.(mi, vi, si)}
                      style={{
                        width: cellSz,
                        height: cellSz,
                        margin: `0 ${gap / 2}px`,
                        background: active ? part.color : undefined,
                        boxShadow: active ? `0 0 8px ${part.color}55` : "none",
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
