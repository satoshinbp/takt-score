"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ACCENT_STYLES = {
  "chart-accent": {
    bg: "bg-chart-accent",
    border: "border-chart-accent",
    glow: "shadow-md shadow-chart-accent/50",
    stroke: "stroke-chart-accent",
    text: "text-chart-accent",
  },
  "chart-regular": {
    bg: "bg-chart-regular",
    border: "border-chart-regular",
    glow: "shadow-md shadow-chart-regular/50",
    stroke: "stroke-chart-regular",
    text: "text-chart-regular",
  },
  red: {
    bg: "bg-destructive",
    border: "border-destructive",
    glow: "shadow-md shadow-destructive/50",
    stroke: "stroke-destructive",
    text: "text-destructive",
  },
  violet: {
    bg: "bg-violet-400",
    border: "border-violet-400",
    glow: "shadow-md shadow-violet-400/50",
    stroke: "stroke-violet-400",
    text: "text-violet-400",
  },
} as const;

type KnobProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
  size?: number;
  accent?: keyof typeof ACCENT_STYLES;
};

const Knob = ({
  value,
  min,
  max,
  step,
  onChange,
  label,
  unit,
  size = 80,
  accent = "chart-accent",
}: KnobProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const startY = useRef(0);
  const startVal = useRef(0);
  const movedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const range = max - min;
  const norm = range > 0 ? (value - min) / range : 0;
  const angle = -135 + norm * 270;
  const accentStyles = ACCENT_STYLES[accent];

  const commitEdit = () => {
    const n = parseFloat(editVal);
    if (!isNaN(n)) {
      let nv = Math.round(n / step) * step;
      nv = Math.max(min, Math.min(max, nv));
      onChange(nv);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!isDragging) return;
    const move = (e: MouseEvent) => {
      const dy = startY.current - e.clientY;
      if (Math.abs(dy) > 2) movedRef.current = true;
      const delta = (dy / 120) * range;
      let nv = startVal.current + delta;
      nv = Math.round(nv / step) * step;
      nv = Math.max(min, Math.min(max, nv));
      onChange(nv);
    };
    const up = () => setIsDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [isDragging, range, step, min, max, onChange]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const dir = e.deltaY < 0 ? 1 : -1;
    const nv = Math.max(min, Math.min(max, value + dir * step));
    onChange(nv);
  };

  const cx = size / 2;
  const cy = size / 2;
  const tickInner = size / 2 - 4;
  const tickOuter = size / 2 - 1;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        role="slider"
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onMouseDown={(e) => {
          if (isEditing) return;
          movedRef.current = false;
          setIsDragging(true);
          startY.current = e.clientY;
          startVal.current = value;
        }}
        onClick={() => {
          if (!movedRef.current && !isEditing) {
            setEditVal(String(value));
            setIsEditing(true);
          }
        }}
        onKeyDown={(e) => {
          if (isEditing) return;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(Math.max(min, Math.min(max, value + step)));
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            onChange(Math.max(min, Math.min(max, value - step)));
          } else if (e.key === "Home") {
            e.preventDefault();
            onChange(min);
          } else if (e.key === "End") {
            e.preventDefault();
            onChange(max);
          }
        }}
        onWheel={onWheel}
        className={cn(
          "relative rounded-full border border-zinc-700/60 bg-radial",
          "from-zinc-800 to-zinc-950 shadow-lg",
          isEditing ? "cursor-text" : "cursor-ns-resize"
        )}
        style={{
          width: size,
          height: size,
          boxShadow:
            "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)",
        }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none"
        >
          {Array.from({ length: 11 }).map((_, i) => {
            const a = -135 + (i / 10) * 270;
            const rad = (a * Math.PI) / 180;
            const isFilled = i / 10 <= norm;
            return (
              <line
                key={i}
                x1={cx + tickInner * Math.cos(rad)}
                y1={cy + tickInner * Math.sin(rad)}
                x2={cx + tickOuter * Math.cos(rad)}
                y2={cy + tickOuter * Math.sin(rad)}
                className={isFilled ? accentStyles.stroke : "stroke-zinc-700"}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 origin-top",
            "rounded-sm w-[3px] m-[-1px]",
            accentStyles.glow
          )}
          style={{
            height: size / 2 - 14,
            rotate: `${angle - 90}deg`,
          }}
        >
          <div className={cn("h-full w-full rounded-sm", accentStyles.bg)} />
        </div>

        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "rounded-full border border-zinc-700/60 bg-radial",
            "from-zinc-800 to-zinc-950"
          )}
          style={{
            width: size * 0.42,
            height: size * 0.42,
          }}
        />

        {isEditing ? (
          <input
            ref={inputRef}
            type="number"
            value={editVal}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setEditVal(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") setIsEditing(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "rounded-sm border bg-zinc-950 font-bold font-mono",
              "text-center outline-none px-0.5 py-1",
              accentStyles.border,
              accentStyles.text
            )}
            style={{
              width: size * 0.62,
              fontSize: size * 0.18,
            }}
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "pointer-events-none font-bold font-mono tracking-tight",
              accentStyles.text
            )}
            style={{
              fontSize: size * 0.18,
            }}
          >
            {Math.round(value * 10) / 10}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-sm tracking-widest text-muted-foreground font-semibold">
          {label}
        </div>
        {unit && (
          <div className="text-xs text-muted-foreground mt-0.5">{unit}</div>
        )}
      </div>
    </div>
  );
};

export default Knob;
