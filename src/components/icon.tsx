import type { PartId } from "@/lib/constants";

type IconProps = { size?: number };

type DrumIconProps = { id: PartId; color: string; size?: number };

export const DrumIcon = ({ id, color, size = 20 }: DrumIconProps) => {
  const w = size;
  const h = Math.round((size * 22) / 28);
  const vb = "0 0 28 22";
  const so = {
    stroke: color,
    strokeWidth: 1.4,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const sf = {
    stroke: color,
    strokeWidth: 1.4,
    fill: `${color}25`,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const icons: Record<PartId, React.ReactNode> = {
    CRASH: (
      <svg width={w} height={h} viewBox={vb}>
        <line x1="14" y1="8" x2="17" y2="20" {...so} strokeWidth={1} />
        <g transform="rotate(-14,14,7)">
          <ellipse cx="14" cy="7" rx="11" ry="2.2" {...sf} />
          <circle
            cx="14"
            cy="7"
            r="1.3"
            fill={color}
            stroke="none"
            opacity={0.8}
          />
        </g>
      </svg>
    ),
    RIDE: (
      <svg width={w} height={h} viewBox={vb}>
        <line x1="14" y1="11" x2="15.5" y2="20" {...so} strokeWidth={1} />
        <ellipse cx="14" cy="10" rx="12.5" ry="2" {...sf} />
        <ellipse
          cx="14"
          cy="10"
          rx="3.5"
          ry="1.4"
          stroke={color}
          strokeWidth={1.2}
          fill={`${color}55`}
        />
        <circle
          cx="14"
          cy="10"
          r="0.9"
          fill={color}
          stroke="none"
          opacity={0.9}
        />
      </svg>
    ),
    HH_OPEN: (
      <svg width={w} height={h} viewBox={vb}>
        <line x1="14" y1="1" x2="14" y2="21" {...so} strokeWidth={1} />
        <ellipse cx="14" cy="5" rx="8.5" ry="2" {...sf} />
        <ellipse cx="14" cy="16" rx="8.5" ry="2" {...sf} />
        <polyline points="12,9 14,7 16,9" {...so} strokeWidth={0.9} />
        <polyline points="12,12 14,14 16,12" {...so} strokeWidth={0.9} />
      </svg>
    ),
    HH: (
      <svg width={w} height={h} viewBox={vb}>
        <line x1="14" y1="1" x2="14" y2="21" {...so} strokeWidth={1} />
        <ellipse cx="14" cy="9" rx="8.5" ry="2" {...sf} />
        <ellipse cx="14" cy="13" rx="8.5" ry="2" {...sf} />
      </svg>
    ),
    HI_TOM: (
      <svg width={w} height={h} viewBox={vb}>
        <path d="M7,9 L21,9 L20,19 L8,19 Z" {...sf} />
        <ellipse cx="14" cy="9" rx="7" ry="2.4" {...sf} />
        <ellipse
          cx="14"
          cy="19"
          rx="6"
          ry="1.6"
          stroke={color}
          strokeWidth={0.8}
          fill="none"
          opacity={0.35}
        />
        <line
          x1="8"
          y1="11"
          x2="8.4"
          y2="15"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
        <line
          x1="20"
          y1="11"
          x2="19.6"
          y2="15"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
      </svg>
    ),
    MID_TOM: (
      <svg width={w} height={h} viewBox={vb}>
        <path d="M4,8 L24,8 L22.5,19 L5.5,19 Z" {...sf} />
        <ellipse cx="14" cy="8" rx="10" ry="2.8" {...sf} />
        <ellipse
          cx="14"
          cy="19"
          rx="8.5"
          ry="1.8"
          stroke={color}
          strokeWidth={0.8}
          fill="none"
          opacity={0.35}
        />
        <line
          x1="5.5"
          y1="10"
          x2="6"
          y2="15"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
        <line
          x1="22.5"
          y1="10"
          x2="22"
          y2="15"
          stroke={color}
          strokeWidth={1}
          opacity={0.5}
        />
      </svg>
    ),
    SNARE: (
      <svg width={w} height={h} viewBox={vb}>
        <path d="M4,7 L24,7 L24,16 L4,16 Z" {...sf} />
        <ellipse cx="14" cy="7" rx="10" ry="2.8" {...sf} />
        <ellipse
          cx="14"
          cy="16"
          rx="10"
          ry="2.5"
          stroke={color}
          strokeWidth={1}
          fill="none"
          opacity={0.55}
        />
        <line
          x1="6.5"
          y1="15.5"
          x2="21.5"
          y2="15.5"
          stroke={color}
          strokeWidth={0.7}
          strokeDasharray="2,1.2"
          opacity={0.9}
        />
        <line
          x1="6.5"
          y1="17"
          x2="21.5"
          y2="17"
          stroke={color}
          strokeWidth={0.7}
          strokeDasharray="2,1.2"
          opacity={0.7}
        />
        <line
          x1="6.5"
          y1="18.3"
          x2="21.5"
          y2="18.3"
          stroke={color}
          strokeWidth={0.7}
          strokeDasharray="2,1.2"
          opacity={0.5}
        />
        <line
          x1="4"
          y1="9"
          x2="4"
          y2="14"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.5}
        />
        <line
          x1="24"
          y1="9"
          x2="24"
          y2="14"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.5}
        />
      </svg>
    ),
    LO_TOM: (
      <svg width={w} height={h} viewBox={vb}>
        <path d="M2,6 L26,6 L26,17 L2,17 Z" {...sf} />
        <ellipse cx="14" cy="6" rx="12" ry="3" {...sf} />
        <ellipse
          cx="14"
          cy="17"
          rx="12"
          ry="2.5"
          stroke={color}
          strokeWidth={0.8}
          fill="none"
          opacity={0.35}
        />
        <line x1="4" y1="17" x2="3" y2="21.5" {...so} strokeWidth={1.2} />
        <line x1="14" y1="17" x2="14" y2="21.5" {...so} strokeWidth={1.2} />
        <line x1="24" y1="17" x2="25" y2="21.5" {...so} strokeWidth={1.2} />
      </svg>
    ),
    BD: (
      <svg width={w} height={h} viewBox={vb}>
        <circle cx="14" cy="11" r="9.5" {...sf} />
        <circle
          cx="14"
          cy="11"
          r="7.5"
          stroke={color}
          strokeWidth={0.8}
          fill="none"
          opacity={0.45}
        />
        <circle
          cx="14"
          cy="11"
          r="1.5"
          fill={color}
          opacity={0.75}
          stroke="none"
        />
        <line
          x1="14"
          y1="20.5"
          x2="14"
          y2="22"
          stroke={color}
          strokeWidth={1.2}
          opacity={0.55}
        />
        <line
          x1="12"
          y1="21.5"
          x2="16"
          y2="21.5"
          stroke={color}
          strokeWidth={1}
          opacity={0.45}
        />
      </svg>
    ),
  };

  return (
    icons[id] ?? (
      <svg width={w} height={h} viewBox={vb}>
        <circle
          cx="14"
          cy="11"
          r="5"
          stroke={color}
          strokeWidth={1.5}
          fill={`${color}25`}
        />
      </svg>
    )
  );
};

export const TaktScoreIcon = ({ size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="120" height="120" rx="26" fill="oklch(0.145 0 0)" />
    <line
      x1="48"
      y1="98"
      x2="69"
      y2="42"
      stroke="white"
      strokeWidth="9"
      strokeLinecap="round"
    />
    <g transform="translate(76, 30) rotate(17)">
      <rect
        x="-22"
        y="-13"
        width="44"
        height="26"
        rx="10"
        fill="oklch(0.769 0.188 70.08)"
      />
      <rect
        x="-16"
        y="-9"
        width="20"
        height="10"
        rx="5"
        fill="white"
        opacity="0.2"
      />
    </g>
  </svg>
);
