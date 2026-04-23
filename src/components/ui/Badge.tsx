import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "text-xs font-semibold px-1.5 py-0.5 rounded-full",
        "bg-(--surface-2) text-(--text-muted) tracking-[0.03em]",
        className,
      )}
      {...props}
    />
  );
}
