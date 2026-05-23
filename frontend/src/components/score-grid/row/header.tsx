"use client";

import { DrumIcon } from "@/components/icon";
import type { PartConfig, PartId } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  id: PartId;
  config: PartConfig;
  isRowStart: boolean;
};

const ScoreGridRowHeader = ({ id, config, isRowStart }: Props) => (
  <div
    className={cn(
      "shrink-0 flex items-center gap-1 font-mono font-semibold text-xs",
      isRowStart ? "w-16 min-w-16" : "w-12 min-w-12",
    )}
    style={{ color: config.color }}
  >
    {isRowStart && (
      <>
        <DrumIcon id={id} size={18} />
        <span>{config.short}</span>
      </>
    )}
  </div>
);

export default ScoreGridRowHeader;
