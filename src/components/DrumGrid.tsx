"use client";

import { PARTS, SUBDIVISIONS, type Measure } from "@/lib/constants";

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
  const cellSz = mode === "view" ? 34 : 24;
  const gap = 2;
  const labelW = mode === "view" ? 76 : 62;
  const mw = SUBDIVISIONS * (cellSz + gap) + gap;

  return (
    <div style={{ userSelect: "none", minWidth: "max-content" }}>
      {/* Beat ruler */}
      <div className="flex mb-1.5" style={{ paddingLeft: labelW }}>
        {measures.map((_, mi) => (
          <span key={mi} className="flex">
            {mi > 0 && <span style={{ width: 4, flexShrink: 0, display: "inline-block" }} />}
            {[1, 2, 3, 4].map((b) => (
              <span key={b} className="flex">
                <span
                  className="flex items-center justify-center"
                  style={{
                    width: cellSz,
                    margin: `0 ${gap / 2}px`,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: 9,
                    color: "var(--tm)",
                    flexShrink: 0,
                  }}
                >
                  {b}
                </span>
                {[0, 1, 2].map((sub) => (
                  <span
                    key={sub}
                    style={{
                      width: cellSz,
                      margin: `0 ${gap / 2}px`,
                      flexShrink: 0,
                      display: "inline-block",
                    }}
                  />
                ))}
              </span>
            ))}
          </span>
        ))}
      </div>

      {/* Voice rows */}
      {PARTS.map((part, vi) => (
        <div key={part.id} className="flex items-center" style={{ marginBottom: gap }}>
          {/* Label */}
          <div
            className="flex items-center gap-1.5 pr-2.5 flex-shrink-0 sticky left-0 z-[5]"
            style={{
              width: labelW,
              minWidth: labelW,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: mode === "view" ? 12 : 10,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: part.color,
              background: "var(--bg)",
            }}
          >
            <div
              className="rounded-full flex-shrink-0"
              style={{ width: 6, height: 6, background: part.color }}
            />
            <span>{part.short}</span>
          </div>

          {/* Cells */}
          {measures.map((measure, mi) => (
            <span key={mi} className="flex items-center">
              {mi > 0 && (
                <span
                  style={{
                    width: 3,
                    margin: `0 ${gap / 2}px`,
                    alignSelf: "stretch",
                    background: "var(--bd2)",
                    opacity: 0.6,
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
              )}
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
            </span>
          ))}
        </div>
      ))}

      {/* Measure number row */}
      <div className="flex mt-0.5" style={{ paddingLeft: labelW }}>
        {measures.map((_, mi) => (
          <span key={mi} className="flex">
            {mi > 0 && <span style={{ width: 3, margin: `0 ${gap / 2}px`, flexShrink: 0, display: "inline-block" }} />}
            <div
              onClick={() => onSelMeasure?.(mi)}
              className="flex-shrink-0 pt-1 cursor-pointer transition-all duration-[120ms]"
              style={{
                width: mw,
                paddingLeft: gap / 2,
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: 9,
                color: selMeasures.includes(mi) ? "var(--acc)" : "var(--tm)",
                borderTop: selMeasures.includes(mi)
                  ? "2px solid var(--acc)"
                  : "2px solid transparent",
                textAlign: "center",
              }}
            >
              M{mi + 1}
            </div>
          </span>
        ))}
      </div>
    </div>
  );
}
