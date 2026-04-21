"use client";

import { SUBDIVISIONS, type Measure } from "@/lib/constants";

type Props = { measures: Measure[] };

export function ScorePreview({ measures }: Props) {
  const m = measures[0];
  if (!m) return null;
  return (
    <div className="flex items-end gap-0.5 h-[52px] mb-3 overflow-hidden">
      {Array.from({ length: SUBDIVISIONS }, (_, s) => {
        const bd = m.BD[s];
        const sn = m.SNARE[s];
        const hh = m.HH[s] || m.HH_OPEN[s];
        const h = bd ? 52 : sn ? 36 : hh ? 20 : 6;
        const col = bd ? "#f87171" : sn ? "#fb923c" : hh ? "#38bdf8" : "#1e1e26";
        return (
          <div
            key={s}
            className="flex-1 rounded-[2px] opacity-75"
            style={{ height: h, background: col }}
          />
        );
      })}
    </div>
  );
}
