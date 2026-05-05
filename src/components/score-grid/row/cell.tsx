"use client";

import { cn } from "@/lib/utils";

// size-6 (24px) + mx-px (1px × 2)
export const CELL_WIDTH_PX = 26;

const getStepCellClass = (isActive: boolean, isCurrent: boolean) =>
  cn(
    "size-6 mx-px rounded-sm border shrink-0 cursor-pointer transition duration-75",
    isCurrent && "bg-accent",
    isCurrent && isActive
      ? "border-transparent"
      : isCurrent
        ? "border-[rgba(245,200,66,0.3)]"
        : isActive
          ? "border-transparent"
          : "border-border",
    !isCurrent && !isActive && "hover:bg-[var(--surface-3)]",
  );

const getStepCellStyle = (
  isActive: boolean,
  isCurrent: boolean,
  color: string,
) => {
  if (!isActive) return undefined;

  const shadows = [`0 0 8px ${color}55`];

  if (isCurrent) {
    shadows.push(`inset 0 0 0 2px rgba(245,200,66,0.75)`);
  }

  return {
    background: color,
    boxShadow: shadows.join(", "),
  };
};

type Props = {
  isActive: boolean;
  isCurrent: boolean;
  color: string;
  anchor?: number;
  onClick?: () => void;
};

const ScoreGridCell = ({
  isActive,
  isCurrent,
  color,
  anchor,
  onClick,
}: Props) => {
  const className = getStepCellClass(isActive, isCurrent);
  const style = getStepCellStyle(isActive, isCurrent, color);

  return (
    <button
      type="button"
      className={className}
      data-step-anchor={anchor}
      style={style}
      onClick={onClick}
    />
  );
};

export default ScoreGridCell;
