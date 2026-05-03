"use client";

import { cn } from "@/lib/utils";

type Props = {
  isSelected: boolean;
  isCurrent: boolean;
  isRowStart: boolean;
  measureIndex: number;
  onSelectMeasure?: () => void;
};

const BeatRuler = ({
  isSelected,
  isCurrent,
  isRowStart,
  measureIndex,
  onSelectMeasure,
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
      {[1, 2, 3, 4].map((b) => (
        <span key={b} className="flex">
          <span className="w-6 mx-px flex items-center justify-center font-mono text-xs shrink-0 text-muted-foreground">
            {b}
          </span>
          {[0, 1, 2].map((sub) => (
            <span key={sub} className="w-6 mx-px shrink-0 inline-block" />
          ))}
        </span>
      ))}
    </div>
  );
};

export default BeatRuler;
