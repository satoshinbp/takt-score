"use client";

import { useMemo } from "react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslation } from "@/hooks/use-translation";
import { ORNAMENT, STEP } from "@/lib/constants";
import type { DictKey } from "@/lib/i18n";

type Props = {
  open: boolean;
  rect: DOMRect | null;
  velocity: number;
  ornament: number;
  onChange: (velocity: number, ornament: number) => void;
  onOpenChange: (open: boolean) => void;
};

const VELOCITY_OPTIONS: { value: number; label: string; hintKey: DictKey }[] = [
  { value: STEP.OFF, label: "off", hintKey: "cellPopover.hint.off" },
  { value: STEP.NORMAL, label: "normal", hintKey: "cellPopover.hint.normal" },
  { value: STEP.ACCENT, label: "accent", hintKey: "cellPopover.hint.accent" },
  { value: STEP.GHOST, label: "ghost", hintKey: "cellPopover.hint.ghost" },
];

const ORNAMENT_OPTIONS: { value: number; label: string; hintKey: DictKey }[] = [
  {
    value: ORNAMENT.NONE,
    label: "none",
    hintKey: "cellPopover.hint.ornamentNone",
  },
  { value: ORNAMENT.FLAM, label: "flam", hintKey: "cellPopover.hint.flam" },
  { value: ORNAMENT.DRAG, label: "drag", hintKey: "cellPopover.hint.drag" },
  { value: ORNAMENT.RUFF, label: "ruff", hintKey: "cellPopover.hint.ruff" },
];

const CellPopover = ({
  open,
  rect,
  velocity,
  ornament,
  onChange,
  onOpenChange,
}: Props) => {
  const { t } = useTranslation();
  // 仮想アンカー: 直前にクリックしたセルの矩形を Radix に伝える．
  // rect ごとに新しい closure を作ることで，ref を mutate せずに最新値を渡す．
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => rect ?? new DOMRect(),
      },
    }),
    [rect]
  );

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
              {t("cellPopover.velocity")}
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
                  title={t(opt.hintKey)}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase text-muted-foreground">
              {t("cellPopover.ornament")}
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
                  title={t(opt.hintKey)}
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
