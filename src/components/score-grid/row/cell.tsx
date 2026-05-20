"use client";

import { useRef } from "react";
import { ORNAMENT, STEP } from "@/lib/constants";
import { cn } from "@/lib/utils";

const CELL_WIDTH_PX = 26; // size-6 (24px) + mx-px (1px × 2)
export const BEAT_WIDTH_PX = 4 * CELL_WIDTH_PX;
const LONG_PRESS_MS = 500;

const isFilled = (v: number) => v !== STEP.OFF;

const getStepCellClass = (
  velocity: number,
  isCurrent: boolean,
  isGhost: boolean
) => {
  const isOn = isFilled(velocity);
  return cn(
    "relative h-6 flex-1 mx-px rounded-sm border cursor-pointer transition duration-75",
    isCurrent && "bg-accent",
    isGhost && "border-dashed",
    !isOn && !isCurrent && "border-border",
    !isOn && isCurrent && "border-[rgba(245,200,66,0.3)]",
    isOn && (!isGhost || isCurrent) && "border-transparent",
    !isOn && !isCurrent && "hover:bg-accent"
  );
};

const getStepCellStyle = (
  velocity: number,
  isCurrent: boolean,
  color: string
) => {
  if (!isFilled(velocity)) return undefined;

  const isAccent = velocity === STEP.ACCENT;
  const isGhost = velocity === STEP.GHOST;

  // ACCENT は強い glow、GHOST は半透明で弱い印象に
  const shadows = [
    `0 0 ${isAccent ? 14 : 8}px ${color}${isAccent ? "99" : "55"}`,
  ];
  if (isCurrent) shadows.push(`inset 0 0 0 2px rgba(245,200,66,0.75)`);

  return {
    background: color,
    boxShadow: shadows.join(", "),
    opacity: isGhost ? 0.45 : 1,
  };
};

type Props = {
  velocity: number;
  ornament: number;
  isCurrent: boolean;
  color: string;
  anchor?: number;
  onClick?: () => void;
  // 右クリック・長押しで呼ばれる。座標はポップオーバーの位置基準として使う
  onContextMenu?: (rect: DOMRect) => void;
};

const ScoreGridCell = ({
  velocity,
  ornament,
  isCurrent,
  color,
  anchor,
  onClick,
  onContextMenu,
}: Props) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const isAccent = velocity === STEP.ACCENT;
  const isGhost = velocity === STEP.GHOST;
  const className = getStepCellClass(velocity, isCurrent, isGhost);
  const style = getStepCellStyle(velocity, isCurrent, color);

  const fireContext = (target: HTMLElement) => {
    onContextMenu?.(target.getBoundingClientRect());
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onContextMenu) return;
    e.preventDefault();
    fireContext(e.currentTarget);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!onContextMenu || e.pointerType !== "touch") return;
    const target = e.currentTarget;
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      fireContext(target);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    onClick?.();
  };

  const ornamentCount =
    ornament >= ORNAMENT.FLAM && ornament <= ORNAMENT.RUFF ? ornament : 0;

  return (
    <button
      type="button"
      className={className}
      data-step-anchor={anchor}
      style={style}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
    >
      {ornamentCount > 0 && (
        <span
          aria-hidden
          className="absolute left-0.5 top-0.5 flex flex-col gap-px pointer-events-none"
        >
          {Array.from({ length: ornamentCount }).map((_, i) => (
            <span key={i} className="block size-1 rounded-full bg-foreground" />
          ))}
        </span>
      )}
      {isAccent && (
        <span
          aria-hidden
          className="absolute right-0.5 top-0 text-xs leading-none font-bold text-foreground pointer-events-none"
        >
          &gt;
        </span>
      )}
    </button>
  );
};

export default ScoreGridCell;
