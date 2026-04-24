"use client";

import Link from "next/link";
import * as Toolbar from "@radix-ui/react-toolbar";
import { cn } from "@/lib/utils";

type Props = {
  breadcrumb?: string;
  actions?: React.ReactNode;
};

export function Header({ breadcrumb, actions }: Props) {
  return (
    <Toolbar.Root asChild>
      <header
        className={cn(
          "flex items-center gap-4 px-4 h-[50px] flex-shrink-0",
          "border-b bg-accent-foreground z-[100]",
        )}
      >
        <Toolbar.Button asChild>
          <Link
            href="/"
            className="text-lg font-bold tracking-wider flex-shrink-0 font-sans text-accent"
          >
            🥁 DRUM MASTER
          </Link>
        </Toolbar.Button>

        {breadcrumb && (
          <span className="text-xs uppercase tracking-wider text-muted">
            {breadcrumb}
          </span>
        )}

        {actions && <div className="ml-auto flex items-center">{actions}</div>}
      </header>
    </Toolbar.Root>
  );
}
