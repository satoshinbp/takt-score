"use client";

import { useEffect, useRef, useState } from "react";

type KnobProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  unit?: string;
  size?: number;
  accent?: string;
};

export const Knob = ({
  value,
  min,
  max,
  step,
  onChange,
  label,
  unit,
  size = 80,
  accent = "#f97316",
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
        className="relative rounded-full border border-zinc-700/60 shadow-lg"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 30% 30%, #28283c, #14141e 70%)",
          cursor: isEditing ? "text" : "ns-resize",
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
                stroke={isFilled ? accent : "#2c2c3e"}
                strokeWidth={2}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        <div
          className="absolute rounded-sm"
          style={{
            top: "50%",
            left: "50%",
            width: 3,
            height: size / 2 - 14,
            background: accent,
            transformOrigin: "top center",
            transform: `translate(-50%, 0) rotate(${angle + 90}deg)`,
            boxShadow: `0 0 6px ${accent}aa`,
            marginTop: -1,
          }}
        />

        <div
          className="absolute rounded-full border border-zinc-700/60"
          style={{
            top: "50%",
            left: "50%",
            width: size * 0.42,
            height: size * 0.42,
            background: "radial-gradient(circle at 35% 35%, #1c1c2e, #0c0c14)",
            transform: "translate(-50%, -50%)",
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
            className="absolute font-bold font-mono text-center outline-none rounded-sm"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: size * 0.62,
              background: "#0a0a14",
              border: `1px solid ${accent}`,
              fontSize: size * 0.18,
              color: accent,
              padding: "2px 4px",
            }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center font-bold font-mono pointer-events-none"
            style={{
              fontSize: size * 0.18,
              color: accent,
              letterSpacing: "-0.02em",
            }}
          >
            {Math.round(value * 10) / 10}
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-[9px] tracking-[0.14em] text-zinc-400 font-bold">
          {label}
        </div>
        {unit && <div className="text-[8px] text-zinc-600 mt-0.5">{unit}</div>}
      </div>
    </div>
  );
};
