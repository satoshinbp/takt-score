import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        solid: "bg-(--acc) text-[#09090c] hover:opacity-75 active:opacity-50",
        ghost: "text-(--tm) hover:text-(--t) hover:bg-(--s2)",
        outline:
          "border border-(--bd) text-(--t) hover:border-(--bd2) hover:bg-(--s2)",
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        icon: "p-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "sm",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
