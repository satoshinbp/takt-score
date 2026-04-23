"use client";

import Link from "next/link";
import * as Toolbar from "@radix-ui/react-toolbar";

type Props = {
  breadcrumb?: string;
  actions?: React.ReactNode;
};

export function Header({ breadcrumb, actions }: Props) {
  return (
    <Toolbar.Root asChild>
      <header className="flex items-center gap-3 px-5 h-[50px] flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface-1)] z-[100]">
        <Toolbar.Button asChild>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[15px] font-bold tracking-[0.06em] flex-shrink-0 font-sans text-[var(--accent)]"
          >
            <span className="text-lg">🥁</span>
            <span>DRUM MASTER</span>
          </Link>
        </Toolbar.Button>

        {breadcrumb && (
          <span className="text-[11px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {breadcrumb}
          </span>
        )}

        {actions && (
          <div className="ml-auto flex items-center">{actions}</div>
        )}
      </header>
    </Toolbar.Root>
  );
}
