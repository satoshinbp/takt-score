"use client";

import { useEffect, useRef } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ORNAMENT, STEP } from "@/lib/constants";

type Props = {
  open: boolean;
  rect: DOMRect | null;
  velocity: number;
  ornament: number;
  onChange: (velocity: number, ornament: number) => void;
  onOpenChange: (open: boolean) => void;
};

const VELOCITY_OPTIONS: { value: number; label: string; hint: string }[] = [
  { value: STEP.OFF, label: "off", hint: "鳴らさない" },
  { value: STEP.NORMAL, label: "normal", hint: "通常" },
  { value: STEP.ACCENT, label: "accent", hint: "強く（>）" },
  { value: STEP.GHOST, label: "ghost", hint: "弱く（半透明）" },
];

const ORNAMENT_OPTIONS: { value: number; label: string; hint: string }[] = [
  { value: ORNAMENT.NONE, label: "none", hint: "装飾音なし" },
  { value: ORNAMENT.FLAM, label: "flam", hint: "装飾音 1" },
  { value: ORNAMENT.DRAG, label: "drag", hint: "装飾音 2" },
  { value: ORNAMENT.RUFF, label: "ruff", hint: "装飾音 3" },
];

const CellPopover = ({
  open,
  rect,
  velocity,
  ornament,
  onChange,
  onOpenChange,
}: Props) => {
  // 仮想アンカー: 直前にクリックしたセルの矩形を Radix に伝える
  const virtualRef = useRef<{ getBoundingClientRect: () => DOMRect }>({
    getBoundingClientRect: () => new DOMRect(),
  });

  useEffect(() => {
    if (rect) {
      virtualRef.current = { getBoundingClientRect: () => rect };
    }
  }, [rect]);

  const handleVelocity = (s: string) => {
    if (s === "") return;
    onChange(Number(s), ornament);
  };

  const handleOrnament = (s: string) => {
    if (s === "") return;
    onChange(velocity, Number(s));
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        className="w-auto"
        align="center"
        sideOffset={6}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase text-muted-foreground">
              強弱
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={String(velocity)}
              onValueChange={handleVelocity}
            >
              {VELOCITY_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={String(opt.value)}
                  title={opt.hint}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase text-muted-foreground">
              装飾音
            </span>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={String(ornament)}
              onValueChange={handleOrnament}
            >
              {ORNAMENT_OPTIONS.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={String(opt.value)}
                  title={opt.hint}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CellPopover;
