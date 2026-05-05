"use client";

import { PlusIcon } from "lucide-react";
import { BEAT_WIDTH_PX } from "@/components/score-grid/row/cell";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Measure, Subdivision } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SUBDIVISIONS: Subdivision[] = [3, 4, 6];

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
        <div
          key={bi}
          style={{ width: BEAT_WIDTH_PX }}
          className="shrink-0 flex items-center justify-between"
        >
          <span className="w-6 text-center font-mono text-sm font-bold text-foreground shrink-0">
            {bi + 1}
          </span>
          {onSubdivisionChange && (
            <div className="flex items-center gap-0.5 mr-px">
              <PlusIcon size={10} className="text-muted-foreground" />
              <ToggleGroup
                type="single"
                value={String(beat.subdivision)}
                onValueChange={(val) => {
                  if (val) onSubdivisionChange(bi, Number(val) as Subdivision);
                }}
                className="gap-0"
              >
                {SUBDIVISIONS.map((sub) => (
                  <ToggleGroupItem
                    key={sub}
                    value={String(sub)}
                    className="h-4 min-w-0 w-5 px-0 text-xs font-mono rounded-none"
                  >
                    {sub}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BeatRuler;
