"use client";

type Props = {
  beatsPerBar: number;
  currentBeat: number;
  accentEvery: number;
  isSilent: boolean;
  fadeAmount: number;
};

export const BeatDots = ({
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
        const baseColor = isAccent ? "#f97316" : "#22d3ee";
        const opacity = isSilent ? Math.max(0.08, fadeAmount * 0.35) : 1;
        const sizePx = isAccent ? 30 : 22;
        return (
          <div
            key={i}
            className="rounded-full transition-[background,box-shadow,opacity] duration-100"
            style={{
              width: sizePx,
              height: sizePx,
              background: isCurrent ? baseColor : `${baseColor}22`,
              border: `2px solid ${baseColor}${isCurrent ? "" : "66"}`,
              opacity,
              boxShadow:
                isCurrent && !isSilent ? `0 0 16px ${baseColor}aa` : "none",
            }}
          />
        );
      })}
    </div>
  );
};
