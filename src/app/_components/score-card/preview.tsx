"use client";

import { type Measure, PARTS, SUBDIVISIONS } from "@/lib/constants";

type Props = { measure: Measure };

const ScorePreview = ({ measure }: Props) => {
  return (
    <div className="flex items-end gap-0.5 h-16 mb-3 overflow-hidden">
      {Array.from({ length: SUBDIVISIONS }, (_, s) => {
        const bd = measure.BD[s];
        const sn = measure.SNARE[s];
        const hh = measure.HH[s] || measure.HH_OPEN[s];
        const height = bd ? 52 : sn ? 36 : hh ? 20 : 6;
        const background = bd
          ? PARTS.BD.color
          : sn
            ? PARTS.SNARE.color
            : hh
              ? PARTS.HH.color
              : "#1e1e26";

        return (
          <div
            key={s}
            className="flex-1 opacity-75"
            style={{ height, background }}
          />
        );
      })}
    </div>
  );
};

export default ScorePreview;
