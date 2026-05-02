"use client";

import { cn } from "@/lib/utils";

type Props = {
  horizontal: boolean;
  isSelected: boolean;
  isCurrent: boolean;
  isRowStart: boolean;
  measureIndex: number;
  onSelectMeasure?: () => void;
};

const BeatRuler = ({
  horizontal,
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
          horizontal
            ? "hidden"
            : isRowStart
              ? "w-16 min-w-16"
              : "w-12 min-w-12",
          isSelected || isCurrent ? "text-primary" : "text-muted-foreground",
          isSelected ? "border-primary" : "border-transparent",
        )}
      >
        M{measureIndex + 1}
      </button>
      {[1, 2, 3, 4].map((b) => (
        <span key={b} className="flex">
          <span
            className={cn(
              "w-6 mx-px flex items-center justify-center font-mono text-xs shrink-0",
              horizontal && b === 1
                ? isCurrent
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
                : "text-muted-foreground",
            )}
          >
            {horizontal && b === 1 ? `M${measureIndex + 1}` : b}
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
