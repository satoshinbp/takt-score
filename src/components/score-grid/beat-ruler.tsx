"use client";

import type { Measure, Subdivision } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NEXT_SUBDIVISION: Record<Subdivision, Subdivision> = { 4: 3, 3: 6, 6: 4 };

type Props = {
  isSelected: boolean;
  isCurrent: boolean;
  isRowStart: boolean;
  measureIndex: number;
  measure: Measure;
  onSelectMeasure?: () => void;
  onSubdivisionChange?: (beatIndex: number, subdivision: Subdivision) => void;
};

const BeatRuler = ({
  isSelected,
  isCurrent,
  isRowStart,
  measureIndex,
  measure,
  onSelectMeasure,
  onSubdivisionChange,
}: Props) => {
  return (
    <div className="flex items-center mb-1.5">
      <button
        type="button"
        onClick={onSelectMeasure}
        className={cn(
          "shrink-0 cursor-pointer font-mono font-bold text-xs",
          "pr-2 text-right border-b-2 transition-all",
          isRowStart ? "w-16 min-w-16" : "w-12 min-w-12",
          isSelected || isCurrent ? "text-primary" : "text-muted-foreground",
          isSelected ? "border-primary" : "border-transparent",
        )}
      >
        M{measureIndex + 1}
      </button>
      {measure.map((beat, bi) => (
        <span key={bi} className="flex">
          <button
            type="button"
            onClick={() =>
              onSubdivisionChange?.(bi, NEXT_SUBDIVISION[beat.subdivision])
            }
            className={cn(
              "w-6 mx-px flex flex-col items-center justify-center font-mono text-xs shrink-0 text-muted-foreground",
              onSubdivisionChange
                ? "cursor-pointer hover:text-primary"
                : "cursor-default",
            )}
          >
            <span>{bi + 1}</span>
            {beat.subdivision !== 4 && (
              <span className="text-[9px] leading-none opacity-70">
                {beat.subdivision}
              </span>
            )}
          </button>
          {Array.from({ length: beat.subdivision - 1 }, (_, si) => (
            <span key={si} className="w-6 mx-px shrink-0 inline-block" />
          ))}
        </span>
      ))}
    </div>
  );
};

export default BeatRuler;
