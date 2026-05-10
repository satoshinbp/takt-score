"use client";

import { cn } from "@/lib/utils";

type Props = {
  beatsPerBar: number;
  currentBeat: number;
  accentEvery: number;
  isSilent: boolean;
  fadeAmount: number;
};

const ACCENT_STYLES = {
  size: "size-[30px]",
  active: "bg-primary border-primary",
  dim: "bg-primary/15 border-primary/40",
  glow: "shadow-lg shadow-primary/60",
};

const REGULAR_STYLES = {
  size: "size-[22px]",
  active: "bg-secondary border-secondary",
  dim: "bg-secondary/15 border-secondary/40",
  glow: "shadow-lg shadow-secondary/60",
};

const BeatDots = ({
  beatsPerBar,
  currentBeat,
  accentEvery,
  isSilent,
  fadeAmount,
}: Props) => {
  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length: beatsPerBar }).map((_, i) => {
        const isAccent = i % accentEvery === 0;
        const isCurrent = i === currentBeat;
        const styles = isAccent ? ACCENT_STYLES : REGULAR_STYLES;
        const opacity = isSilent ? Math.max(0.08, fadeAmount * 0.35) : 1;
        return (
          <div
            key={i}
            className={cn(
              "rounded-full border-2 transition-all duration-100",
              styles.size,
              isCurrent ? styles.active : styles.dim,
              isCurrent && !isSilent && styles.glow,
            )}
            style={{ opacity }}
          />
        );
      })}
    </div>
  );
};

export default BeatDots;
