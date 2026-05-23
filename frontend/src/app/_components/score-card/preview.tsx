"use client";

import { PARTS } from "@/lib/constants";
import { type Measure } from "@/types/common";

type Props = { measure: Measure };

const ScorePreview = ({ measure }: Props) => {
  return (
    <div className="flex items-end gap-0.5 h-16 mb-3 overflow-hidden">
      {measure.flatMap((beat, bi) =>
        beat.steps.BD.map((_, si) => {
          const isBD = beat.steps.BD[si];
          const isSN = beat.steps.SNARE[si];
          const isHH = beat.steps.HH[si] || beat.steps.HH_OPEN[si];
          const height = isBD ? 52 : isSN ? 36 : isHH ? 20 : 6;
          const background = isBD
            ? PARTS.BD.color
            : isSN
              ? PARTS.SNARE.color
              : isHH
                ? PARTS.HH.color
                : "#1e1e26";

          return (
            <div
              key={`${bi}-${si}`}
              className="flex-1 opacity-75"
              style={{ height, background }}
            />
          );
        }),
      )}
    </div>
  );
};

export default ScorePreview;
