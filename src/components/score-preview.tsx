"use client";

import { type Measure, SUBDIVISIONS } from "@/lib/constants";

type Props = { measure: Measure };

const ScorePreview = ({ measure }: Props) => {
  return (
    <div className="flex items-end gap-0.5 h-13 mb-3 overflow-hidden">
      {Array.from({ length: SUBDIVISIONS }, (_, s) => {
        const bd = measure.BD[s];
        const sn = measure.SNARE[s];
        const hh = measure.HH[s] || measure.HH_OPEN[s];
        const h = bd ? 52 : sn ? 36 : hh ? 20 : 6;
        const col = bd
          ? "#f87171"
          : sn
            ? "#fb923c"
            : hh
              ? "#38bdf8"
              : "#1e1e26";

        return (
          <div
            key={s}
            className="flex-1 rounded-sm opacity-75"
            style={{ height: h, background: col }}
          />
        );
      })}
    </div>
  );
};

export default ScorePreview;
